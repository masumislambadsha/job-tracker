import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { SEED_PORTALS } from "@/lib/constants";

export async function POST() {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    // 1. Ensure all 24 verified portals exist
    for (const portalData of SEED_PORTALS) {
      const existing = await prisma.portal.findFirst({
        where: { userId: user.id, name: portalData.name },
      });
      if (!existing) {
        await prisma.portal.create({
          data: {
            userId: user.id,
            name: portalData.name,
            url: portalData.url,
            tier: portalData.tier,
            notes: portalData.notes,
            lastCheckedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Portals and sample data verified." });
  } catch (error) {
    console.error("Seed API error:", error);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
