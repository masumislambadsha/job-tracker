import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, "_");

    const resumesDir = path.join(process.cwd(), "public", "resumes");
    await mkdir(resumesDir, { recursive: true });

    const filePath = path.join(resumesDir, sanitizedName);
    await writeFile(filePath, buffer);

    const publicUrl = `/resumes/${sanitizedName}`;

    // Auto-generate human readable label from filename
    const defaultLabel = sanitizedName
      .replace(/\.pdf$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: sanitizedName,
      suggestedLabel: defaultLabel,
    });
  } catch (error) {
    console.error("Resume file upload error:", error);
    return NextResponse.json({ error: "Failed to upload PDF resume" }, { status: 500 });
  }
}
