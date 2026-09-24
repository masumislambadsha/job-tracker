import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const existing = await prisma.resumeVersion.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
    }

    let label: string | undefined;
    let url: string | undefined;
    let fileData: string | undefined;
    let fileName: string | undefined;
    let mimeType: string | undefined;
    let fileSize: number | undefined;
    let clearFile = false;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      label = (form.get("label") as string | null) ?? undefined;
      url = (form.get("url") as string | null) ?? undefined;
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
      clearFile = body.clearFile === true;
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
      fileName = fileName ? sanitizeFileName(fileName) : existing.fileName || `resume_${Date.now()}.pdf`;
      url = `/resumes/${fileName}`;
    }

    const updated = await prisma.resumeVersion.update({
      where: { id },
      data: {
        label: label !== undefined ? label.trim() : existing.label,
        url: url !== undefined ? url.trim() : existing.url,
        ...(fileData
          ? { fileData, fileName, mimeType, fileSize }
          : clearFile
            ? { fileData: null, fileName: null, mimeType: null, fileSize: null }
            : {}),
      },
    });

    const { fileData: _omit, ...safe } = updated;
    return NextResponse.json({ ...safe, hasFile: Boolean(updated.fileSize) });
  } catch (error) {
    console.error("Resume PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update resume version" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const existing = await prisma.resumeVersion.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
    }

    await prisma.resumeVersion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete resume version" },
      { status: 500 }
    );
  }
}
