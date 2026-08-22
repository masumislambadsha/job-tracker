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

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const existing = await prisma.application.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (existing.status === status) {
      return NextResponse.json(existing);
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
    });

    await prisma.statusHistory.create({
      data: {
        applicationId: id,
        fromStatus: existing.status,
        toStatus: status,
        changedAt: new Date(),
      },
    });

    const populated = await prisma.application.findUnique({
      where: { id: updated.id },
      include: {
        portal: true,
        resumeVersion: true,
        tags: { include: { tag: true } },
        statusHistory: { orderBy: { changedAt: "desc" } },
      },
    });

    return NextResponse.json(populated);
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
