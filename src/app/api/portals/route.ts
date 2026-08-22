import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { calculatePercentage } from "@/lib/utils";

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const portals = await prisma.portal.findMany({
      where: { userId: user.id },
      include: {
        applications: {
          select: { id: true, status: true },
        },
      },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    });

    const enrichedPortals = portals.map((portal) => {
      const apps = portal.applications;
      const applicationsCount = apps.length;

      // Responses: anything that reached assessment, interview, offer, or explicit rejection
      const responsesCount = apps.filter(
        (a) =>
          a.status !== "WISHLIST" &&
          a.status !== "APPLIED" &&
          a.status !== "GHOSTED"
      ).length;

      const responseRate = calculatePercentage(responsesCount, applicationsCount);

      return {
        id: portal.id,
        userId: portal.userId,
        name: portal.name,
        url: portal.url,
        tier: portal.tier,
        notes: portal.notes,
        lastCheckedAt: portal.lastCheckedAt,
        applicationsCount,
        responsesCount,
        responseRate,
      };
    });

    return NextResponse.json(enrichedPortals);
  } catch (error) {
    console.error("Portals GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portals" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const body = await request.json();
    const { name, url, tier, notes } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Portal name and URL are required" },
        { status: 400 }
      );
    }

    const portal = await prisma.portal.create({
      data: {
        userId: user.id,
        name: name.trim(),
        url: url.trim(),
        tier: tier ? Number(tier) : 3,
        notes: notes?.trim() || null,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        ...portal,
        applicationsCount: 0,
        responsesCount: 0,
        responseRate: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Portal POST error:", error);
    return NextResponse.json(
      { error: "Failed to create portal" },
      { status: 500 }
    );
  }
}
