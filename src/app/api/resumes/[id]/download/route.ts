import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const resume = await prisma.resumeVersion.findFirst({
      where: { id, userId: user.id },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // 1) PDFs stored in MongoDB (works on Vercel serverless) — preferred.
    if (resume.fileData) {
      const buffer = Buffer.from(resume.fileData, "base64");
      const downloadName = `${resume.label.replace(/[^a-z0-9 _()-]/gi, "").trim() || resume.fileName?.replace(/\.pdf$/i, "") || "resume"}.pdf`;

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": resume.mimeType || "application/pdf",
          "Content-Length": String(buffer.length),
          "Content-Disposition": `attachment; filename="${downloadName}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // 2) External URLs (Google Drive etc.)
    if (!resume.url.startsWith("/resumes/")) {
      // Legacy data: URLs were sometimes stored as full data: URLs.
      if (resume.url.startsWith("data:application/pdf;base64,")) {
        const buffer = Buffer.from(resume.url.split(",")[1] || "", "base64");
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Length": String(buffer.length),
            "Content-Disposition": `attachment; filename="${resume.label.replace(/[^a-z0-9 _()-]/gi, "").trim() || "resume"}.pdf"`,
            "Cache-Control": "no-store",
          },
        });
      }
      return NextResponse.redirect(resume.url);
    }

    // 3) Legacy local-disk files (local dev only; ephemeral/missing on Vercel).
    const safeName = path.basename(resume.url);
    if (!/^[a-z0-9_.-]+\.pdf$/i.test(safeName)) {
      return NextResponse.json({ error: "Invalid resume file" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "resumes", safeName);

    try {
      const fileInfo = await stat(filePath);
      if (!fileInfo.isFile()) throw new Error("Not a file");
      const buffer = await readFile(filePath);

      const downloadName = `${resume.label.replace(/[^a-z0-9 _()-]/gi, "").trim() || safeName.replace(/\.pdf$/i, "")}.pdf`;

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(fileInfo.size),
          "Content-Disposition": `attachment; filename="${downloadName}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Resume file not found. Please re-upload the PDF." },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Resume download error:", error);
    return NextResponse.json(
      { error: "Failed to download resume" },
      { status: 500 }
    );
  }
}
