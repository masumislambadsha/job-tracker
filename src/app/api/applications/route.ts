import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { appendApplication } from "@/lib/google-sheets";

const APPLICATION_LIST_SELECT = {
  id: true,
  userId: true,
  company: true,
  position: true,
  dateApplied: true,
  status: true,
  jobNature: true,
  jobType: true,
  companyLocation: true,
  jobLink: true,
  portalId: true,
  howApplied: true,
  resumeVersionId: true,
  salaryMin: true,
  salaryMax: true,
  currency: true,
  priority: true,
  followUpDate: true,
  createdAt: true,
  updatedAt: true,
  portal: {
    select: { id: true, name: true, url: true, tier: true },
  },
  resumeVersion: {
    select: { id: true, label: true, url: true },
  },
} as const;

const SORTABLE_FIELDS = new Set([
  "company",
  "position",
  "status",
  "priority",
  "followUpDate",
  "dateApplied",
]);

const SORT_DIRECTIONS = new Set(["asc", "desc"]);

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
    const hasFollowUp = searchParams.get("hasFollowUp") === "true";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = SORTABLE_FIELDS.has(searchParams.get("sortBy") || "")
      ? (searchParams.get("sortBy") as string)
      : "dateApplied";
    const sortOrder = SORT_DIRECTIONS.has(searchParams.get("sortOrder") || "")
      ? (searchParams.get("sortOrder") as "asc" | "desc")
      : "desc";
    const cursor = searchParams.get("cursor");
    const requestedPageSize = Number(searchParams.get("pageSize"));
    const pageSize = Number.isFinite(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, 200)
      : 50;

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

    if (hasFollowUp) {
      where.followUpDate = { not: null };
    }

    if (search) {
      where.OR = [
        { company: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        { comments: { contains: search, mode: "insensitive" } },
        { companyLocation: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.dateApplied = {};
      if (dateFrom) {
        where.dateApplied.gte = new Date(`${dateFrom}T00:00:00.000Z`);
      }
      if (dateTo) {
        where.dateApplied.lte = new Date(`${dateTo}T23:59:59.999Z`);
      }
    }

    // Keyset pagination: id is the unique tiebreaker so ordering is stable
    // even when the selected sort field contains ties.
    const orderBy = [{ [sortBy]: sortOrder }, { id: sortOrder }];

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        orderBy,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: pageSize,
        select: APPLICATION_LIST_SELECT,
      }),
    ]);

    const last = applications[applications.length - 1];
    const nextCursor = applications.length === pageSize && last ? last.id : null;

    return NextResponse.json({
      data: applications,
      total,
      nextCursor,
      pageSize,
    });
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

    // Sync to Google Sheets. This is awaited (not fire-and-forget) because
    // Vercel serverless functions freeze after the response is returned, which
    // would otherwise leave the sheet sync unfinished. Failures are caught and
    // logged so they never fail the application creation itself.
    try {
      await appendApplication(populated);
    } catch (err) {
      console.error("[Sheets Sync] Background error:", (err as Error).message);
    }

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Applications POST error:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
