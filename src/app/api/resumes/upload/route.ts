import { NextResponse } from "next/server";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";

// Vercel serverless functions have a read-only filesystem (except /tmp,
// which is ephemeral), so uploaded PDFs can't be written to public/resumes
// in production. Instead this endpoint is stateless: it validates the PDF
// and returns its bytes as base64. The client then sends that payload to
// POST /api/resumes (or PUT /api/resumes/[id]) which persists it in MongoDB.
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(request: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "PDF must be under 8MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "PDF must be under 8MB" },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9_.-]/g, "_");

    // Auto-generate human readable label from filename
    const defaultLabel = sanitizedName
      .replace(/\.pdf$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return NextResponse.json({
      success: true,
      // Persisted later via POST /api/resumes; kept as a virtual path so
      // existing UI checks (url.startsWith("/resumes/")) keep working.
      url: `/resumes/${sanitizedName}`,
      filename: sanitizedName,
      suggestedLabel: defaultLabel,
      fileData: buffer.toString("base64"),
      mimeType: "application/pdf",
      fileSize: buffer.length,
    });
  } catch (error) {
    console.error("Resume file upload error:", error);
    return NextResponse.json({ error: "Failed to upload PDF resume" }, { status: 500 });
  }
}
