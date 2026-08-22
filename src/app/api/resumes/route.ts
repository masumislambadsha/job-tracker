import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { calculatePercentage } from "@/lib/utils";

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const resumes = await prisma.resumeVersion.findMany({
      where: { userId: user.id },
      include: {
        applications: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedResumes = resumes.map((resume) => {
      const apps = resume.applications;
      const applicationsCount = apps.length;

      // Callbacks / positive responses (interviews, assessments, offers)
      const callbacksCount = apps.filter(
        (a) =>
          a.status === "OA_ASSESSMENT" ||
          a.status === "INTERVIEW_SCHEDULED" ||
          a.status === "INTERVIEW_COMPLETED" ||
          a.status === "OFFER"
      ).length;

      const callbackRate = calculatePercentage(callbacksCount, applicationsCount);

      return {
        id: resume.id,
        userId: resume.userId,
        label: resume.label,
        url: resume.url,
        createdAt: resume.createdAt.toISOString(),
        applicationsCount,
        callbacksCount,
        callbackRate,
      };
    });

    return NextResponse.json(enrichedResumes);
  } catch (error) {
    console.error("Resumes GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume versions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const body = await request.json();
    const { label, url } = body;

    if (!label || !url) {
      return NextResponse.json(
        { error: "Label and URL are required" },
        { status: 400 }
      );
    }

    const created = await prisma.resumeVersion.create({
      data: {
        userId: user.id,
        label: label.trim(),
        url: url.trim(),
      },
    });

    return NextResponse.json(
      {
        ...created,
        applicationsCount: 0,
        callbacksCount: 0,
        callbackRate: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Resume POST error:", error);
    return NextResponse.json(
      { error: "Failed to create resume version" },
      { status: 500 }
    );
  }
}
