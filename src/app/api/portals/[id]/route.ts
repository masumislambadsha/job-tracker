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
    const { name, url, tier, notes, markChecked } = body;

    const existing = await prisma.portal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    const updated = await prisma.portal.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        url: url !== undefined ? url.trim() : existing.url,
        tier: tier !== undefined ? (tier ? Number(tier) : null) : existing.tier,
        notes: notes !== undefined ? notes : existing.notes,
        lastCheckedAt: markChecked ? new Date() : existing.lastCheckedAt,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Portal PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update portal" },
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

    const existing = await prisma.portal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    await prisma.portal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Portal DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete portal" },
      { status: 500 }
    );
  }
}
