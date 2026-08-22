import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";

export async function POST() {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    // Delete all application data for this user
    const userApps = await prisma.application.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const appIds = userApps.map((a) => a.id);

    if (appIds.length > 0) {
      await prisma.statusHistory.deleteMany({
        where: { applicationId: { in: appIds } },
      });
      await prisma.applicationTag.deleteMany({
        where: { applicationId: { in: appIds } },
      });
      await prisma.application.deleteMany({
        where: { userId: user.id },
      });
    }

    return NextResponse.json({ success: true, message: "All application data cleared." });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Failed to reset application data" }, { status: 500 });
  }
}
