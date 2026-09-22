import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { appendApplication } from "@/lib/google-sheets";
import { normalizeJobLink, resolveJobLink } from "@/lib/job-link";

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
    const search = searchParams.get("search")?.trim() || null;
    const status = searchParams.get("status")?.trim() || null;
    const jobType = searchParams.get("jobType")?.trim() || null;
    const jobNature = searchParams.get("jobNature")?.trim() || null;
    const portalId = searchParams.get("portalId")?.trim() || null;
    const resumeVersionId = searchParams.get("resumeVersionId")?.trim() || null;
    const tagId = searchParams.get("tagId")?.trim() || null;
    const tag = searchParams.get("tag")?.trim() || null;
    const hasFollowUp = searchParams.get("hasFollowUp") === "true";
    const dateFrom = searchParams.get("dateFrom")?.trim() || null;
    const dateTo = searchParams.get("dateTo")?.trim() || null;
    const followUpFrom = searchParams.get("followUpFrom")?.trim() || null;
    const followUpTo = searchParams.get("followUpTo")?.trim() || null;
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
    if (tagId) {
      where.tags = { some: { tagId } };
    } else if (tag) {
      where.tags = { some: { tag: { name: tag.toLowerCase() } } };
    }

    if (followUpFrom || followUpTo) {
      where.followUpDate = {};
      if (followUpFrom) {
        const from = new Date(`${followUpFrom}T00:00:00.000Z`);
        if (!Number.isNaN(from.getTime())) where.followUpDate.gte = from;
      }
      if (followUpTo) {
        const to = new Date(`${followUpTo}T23:59:59.999Z`);
        if (!Number.isNaN(to.getTime())) where.followUpDate.lte = to;
      }
      // An empty range object matches everything on Mongo; drop it.
      if (Object.keys(where.followUpDate).length === 0) {
        delete where.followUpDate;
      }
    } else if (hasFollowUp) {
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
        const from = new Date(`${dateFrom}T00:00:00.000Z`);
        if (!Number.isNaN(from.getTime())) where.dateApplied.gte = from;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999Z`);
        if (!Number.isNaN(to.getTime())) where.dateApplied.lte = to;
      }
      if (Object.keys(where.dateApplied).length === 0) {
        delete where.dateApplied;
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

    // Job posting link is compulsory: real link if given, auto-generated
    // placeholder like https://company.com/careers/role when omitted.
    // An explicit Google Docs/Forms/Drive link is rejected so the caller
    // learns it is never a valid posting.
    const resolvedLink = resolveJobLink(jobLink, company, position);
    if (resolvedLink.outcome === "placeholder-blocked") {
      return NextResponse.json(
        {
          error: "jobLink rejected: Google Docs/Forms/Drive links are never valid job posting links.",
          hint: "Omit jobLink to auto-generate a placeholder, or provide the real job posting URL.",
          placeholder: resolvedLink.url,
        },
        { status: 400 }
      );
    }
    const { url: finalJobLink } = normalizeJobLink(jobLink, company, position);

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
        jobLink: finalJobLink,
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
