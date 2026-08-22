import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      user = await getOrCreateDefaultUser();
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const jobType = searchParams.get("jobType");
    const jobNature = searchParams.get("jobNature");
    const portalId = searchParams.get("portalId");
    const resumeVersionId = searchParams.get("resumeVersionId");
    const priority = searchParams.get("priority");
    const tag = searchParams.get("tag");
    const sortBy = searchParams.get("sortBy") || "dateApplied";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: any = {
      userId: user.id,
    };

    if (status) {
      where.status = status;
    }
    if (jobType) {
      where.jobType = jobType;
    }
    if (jobNature) {
      where.jobNature = jobNature;
    }
    if (portalId) {
      where.portalId = portalId;
    }
    if (resumeVersionId) {
      where.resumeVersionId = resumeVersionId;
    }
    if (priority) {
      where.priority = Number(priority);
    }

    if (search) {
      where.OR = [
        { company: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        { comments: { contains: search, mode: "insensitive" } },
        { companyLocation: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    const orderBy: any = {};
    if (sortBy === "company" || sortBy === "position" || sortBy === "status" || sortBy === "priority" || sortBy === "followUpDate") {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.dateApplied = sortOrder;
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy,
      include: {
        portal: {
          select: { id: true, name: true, url: true, tier: true },
        },
        resumeVersion: {
          select: { id: true, label: true, url: true },
        },
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

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Applications GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      user = await getOrCreateDefaultUser();
    }

    const body = await request.json();
    const {
      company,
      position,
      dateApplied,
      status = "APPLIED",
      jobNature,
      jobType,
      companyLocation,
      jobLink,
      portalId,
      howApplied,
      resumeVersionId,
      salaryMin,
      salaryMax,
      currency = "USD",
      priority,
      followUpDate,
      comments,
      tags = [],
    } = body;

    if (!company || !position || !dateApplied) {
      return NextResponse.json(
        { error: "Company, position, and date applied are required" },
        { status: 400 }
      );
    }

    const parsedDateApplied = new Date(dateApplied);
    const parsedFollowUpDate = followUpDate ? new Date(followUpDate) : null;

    const app = await prisma.application.create({
      data: {
        userId: user.id,
        company: company.trim(),
        position: position.trim(),
        dateApplied: parsedDateApplied,
        status,
        jobNature: jobNature || null,
        jobType: jobType || null,
        companyLocation: companyLocation?.trim() || null,
        jobLink: jobLink?.trim() || null,
        portalId: portalId || null,
        howApplied: howApplied || null,
        resumeVersionId: resumeVersionId || null,
        salaryMin: salaryMin !== undefined && salaryMin !== null ? Number(salaryMin) : null,
        salaryMax: salaryMax !== undefined && salaryMax !== null ? Number(salaryMax) : null,
        currency: currency || "USD",
        priority: priority ? Number(priority) : null,
        followUpDate: parsedFollowUpDate,
        comments: comments?.trim() || null,
      },
    });

    // Record initial StatusHistory entry
    await prisma.statusHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: null,
        toStatus: status,
        changedAt: parsedDateApplied,
      },
    });

    // Handle tags
    if (Array.isArray(tags) && tags.length > 0) {
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
            applicationId: app.id,
            tagId: tagRecord.id,
          },
        });
      }
    }

    // Return the full populated application object
    const populated = await prisma.application.findUnique({
      where: { id: app.id },
      include: {
        portal: true,
        resumeVersion: true,
        tags: { include: { tag: true } },
        statusHistory: { orderBy: { changedAt: "desc" } },
      },
    });

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Applications POST error:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
