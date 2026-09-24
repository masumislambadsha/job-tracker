import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { calculatePercentage } from "@/lib/utils";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const resumes = await prisma.resumeVersion.findMany({
      where: { userId: user.id },
      // Never ship PDF bytes in list responses (they can be several MB).
      select: {
        id: true,
        userId: true,
        label: true,
        url: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
        applications: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedResumes = resumes.map((resume) => {
      const apps = resume.applications;
      const applicationsCount = apps.length;

      // Callbacks / positive responses (interviews, assessments, offers)
      const callbacksCount = apps.filter(
        (a) =>
          a.status === "OA_ASSESSMENT" ||
          a.status === "INTERVIEW_SCHEDULED" ||
          a.status === "INTERVIEW_COMPLETED" ||
          a.status === "OFFER"
      ).length;

      const callbackRate = calculatePercentage(callbacksCount, applicationsCount);

      return {
        id: resume.id,
        userId: resume.userId,
        label: resume.label,
        url: resume.url,
        fileName: resume.fileName,
        mimeType: resume.mimeType,
        fileSize: resume.fileSize,
        hasFile: Boolean(resume.fileSize),
        createdAt: resume.createdAt.toISOString(),
        applicationsCount,
        callbacksCount,
        callbackRate,
      };
    });

    return NextResponse.json(enrichedResumes);
  } catch (error) {
    console.error("Resumes GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume versions" },
      { status: 500 }
    );
  }
}

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
}

export async function POST(request: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    let label: string | undefined;
    let url: string | undefined;
    let fileData: string | undefined;
    let fileName: string | undefined;
    let mimeType: string | undefined;
    let fileSize: number | undefined;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // Single-request upload: label + PDF file together (efficient, one trip).
      const form = await request.formData();
      label = (form.get("label") as string | null) || undefined;
      url = (form.get("url") as string | null) || undefined;
      const file = form.get("file") as unknown as File | null;
      if (file && typeof (file as File).arrayBuffer === "function") {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          return NextResponse.json(
            { error: "Only PDF files are supported" },
            { status: 400 }
          );
        }
        const buf = Buffer.from(await file.arrayBuffer());
        if (buf.length > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "PDF must be under 8MB" },
            { status: 400 }
          );
        }
        fileData = buf.toString("base64");
        fileName = sanitizeFileName(file.name);
        mimeType = "application/pdf";
        fileSize = buf.length;
      }
    } else {
      const body = await request.json();
      label = body.label;
      url = body.url;
      fileData = body.fileData;
      fileName = body.fileName || body.filename;
      mimeType = body.mimeType;
      fileSize = body.fileSize;
    }

    if (!label) {
      return NextResponse.json(
        { error: "Label and URL are required" },
        { status: 400 }
      );
    }

    if (fileData) {
      const buf = Buffer.from(fileData, "base64");
      if (buf.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "PDF must be under 8MB" },
          { status: 400 }
        );
      }
      fileSize = buf.length;
      mimeType = mimeType || "application/pdf";
      fileName = fileName ? sanitizeFileName(fileName) : `resume_${Date.now()}.pdf`;
      // Virtual path keeps existing UI/download logic working; bytes live in MongoDB.
      url = `/resumes/${fileName}`;
    }

    if (!url) {
      return NextResponse.json(
        { error: "Label and URL are required" },
        { status: 400 }
      );
    }

    const created = await prisma.resumeVersion.create({
      data: {
        userId: user.id,
        label: label.trim(),
        url: url.trim(),
        fileData: fileData || undefined,
        fileName: fileName || undefined,
        mimeType: mimeType || undefined,
        fileSize: fileSize ?? undefined,
      },
    });

    const { fileData: _omit, ...safe } = created;

    return NextResponse.json(
      {
        ...safe,
        hasFile: Boolean(created.fileSize),
        applicationsCount: 0,
        callbacksCount: 0,
        callbackRate: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Resume POST error:", error);
    return NextResponse.json(
      { error: "Failed to create resume version" },
      { status: 500 }
    );
  }
}
