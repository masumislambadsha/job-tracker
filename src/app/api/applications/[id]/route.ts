import { NextResponse } from "next/server";
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

    const application = await prisma.application.findFirst({
      where: { id, userId: user.id },
      include: {
        portal: true,
        resumeVersion: true,
        tags: {
          include: {
            tag: true,
          },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Application GET [id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const existing = await prisma.application.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      company,
      position,
      dateApplied,
      status,
      jobNature,
      jobType,
      companyLocation,
      jobLink,
      portalId,
      howApplied,
      resumeVersionId,
      salaryMin,
      salaryMax,
      currency,
      priority,
      followUpDate,
      comments,
      tags,
    } = body;

    // If status has changed, log to StatusHistory
    if (status && status !== existing.status) {
      await prisma.statusHistory.create({
        data: {
          applicationId: id,
          fromStatus: existing.status,
          toStatus: status,
          changedAt: new Date(),
        },
      });
    }

    // Update basic fields
    const updated = await prisma.application.update({
      where: { id },
      data: {
        company: company !== undefined ? company.trim() : existing.company,
        position: position !== undefined ? position.trim() : existing.position,
        dateApplied: dateApplied ? new Date(dateApplied) : existing.dateApplied,
        status: status || existing.status,
        jobNature: jobNature !== undefined ? jobNature : existing.jobNature,
        jobType: jobType !== undefined ? jobType : existing.jobType,
        companyLocation: companyLocation !== undefined ? companyLocation : existing.companyLocation,
        jobLink: jobLink !== undefined ? jobLink : existing.jobLink,
        portalId: portalId !== undefined ? (portalId || null) : existing.portalId,
        howApplied: howApplied !== undefined ? howApplied : existing.howApplied,
        resumeVersionId: resumeVersionId !== undefined ? (resumeVersionId || null) : existing.resumeVersionId,
        salaryMin: salaryMin !== undefined ? (salaryMin ? Number(salaryMin) : null) : existing.salaryMin,
        salaryMax: salaryMax !== undefined ? (salaryMax ? Number(salaryMax) : null) : existing.salaryMax,
        currency: currency !== undefined ? currency : existing.currency,
        priority: priority !== undefined ? (priority ? Number(priority) : null) : existing.priority,
        followUpDate: followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : existing.followUpDate,
        comments: comments !== undefined ? comments : existing.comments,
      },
    });

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      await prisma.applicationTag.deleteMany({
        where: { applicationId: id },
      });

      for (const tagName of tags) {
        const cleanTag = tagName.trim().toLowerCase();
        if (!cleanTag) continue;

        let tagRecord = await prisma.tag.findFirst({
          where: { userId: user.id, name: cleanTag },
        });

        if (!tagRecord) {
          tagRecord = await prisma.tag.create({
            data: {
              userId: user.id,
              name: cleanTag,
            },
          });
        }

        await prisma.applicationTag.create({
          data: {
            applicationId: id,
            tagId: tagRecord.id,
          },
        });
      }
    }

    const fullResult = await prisma.application.findUnique({
      where: { id: updated.id },
      include: {
        portal: true,
        resumeVersion: true,
        tags: { include: { tag: true } },
        statusHistory: { orderBy: { changedAt: "desc" } },
      },
    });

    return NextResponse.json(fullResult);
  } catch (error) {
    console.error("Application PUT [id] error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
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

    const existing = await prisma.application.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    await prisma.statusHistory.deleteMany({ where: { applicationId: id } });
    await prisma.applicationTag.deleteMany({ where: { applicationId: id } });
    await prisma.application.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Application DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
