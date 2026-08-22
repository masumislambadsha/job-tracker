import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const body = await request.json();
    const { label, url } = body;

    const existing = await prisma.resumeVersion.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
    }

    const updated = await prisma.resumeVersion.update({
      where: { id },
      data: {
        label: label !== undefined ? label.trim() : existing.label,
        url: url !== undefined ? url.trim() : existing.url,
      },
    });

    return NextResponse.json(updated);
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
