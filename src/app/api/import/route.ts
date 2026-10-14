import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { normalizeJobLink } from "@/lib/job-link";

function mapStatusToEnum(rawStatus?: string): string {
  if (!rawStatus) return "APPLIED";
  const s = rawStatus.toLowerCase().trim();
  if (s.includes("wish")) return "WISHLIST";
  if (s.includes("oa") || s.includes("assess") || s.includes("test") || s.includes("challenge")) return "OA_ASSESSMENT";
  if (s.includes("interview scheduled") || s.includes("round") || s.includes("scheduled")) return "INTERVIEW_SCHEDULED";
  if (s.includes("interview completed") || s.includes("done")) return "INTERVIEW_COMPLETED";
  if (s.includes("offer")) return "OFFER";
  if (s.includes("reject")) return "REJECTED";
  if (s.includes("ghost") || s.includes("no reply")) return "GHOSTED";
  if (s.includes("withdraw")) return "WITHDRAWN";
  return "APPLIED";
}

function mapJobNatureToEnum(rawNature?: string): string | null {
  if (!rawNature) return null;
  const n = rawNature.toLowerCase().trim();
  if (n.includes("full")) return "FULL_TIME";
  if (n.includes("part")) return "PART_TIME";
  if (n.includes("contract") || n.includes("freelance")) return "CONTRACT";
  if (n.includes("intern")) return "INTERNSHIP";
  return "FULL_TIME";
}

function mapJobTypeToEnum(rawType?: string): string | null {
  if (!rawType) return null;
  const t = rawType.toLowerCase().trim();
  if (t.includes("remote")) return "REMOTE";
  if (t.includes("hybrid")) return "HYBRID";
  if (t.includes("onsite") || t.includes("on-site") || t.includes("office")) return "ONSITE";
  return "REMOTE";
}

// Canonical sheet columns (user order):
// Date, Company, Position, Job Link, Job Nature, Job Type,
// Company Location, Job Status, Comments, Source / Portal, How Applied,
// Resume Version, Resume URL, Salary Min, Salary Max, Currency, Priority,
// Follow-up Date, Tags
// Matching is case-insensitive so exports, Google Sheets, and hand-edited
// CSVs all parse. Aliases keep backward compat with the old Appendix B names.
function buildLookup(row: Record<string, any>): Map<string, any> {
  const map = new Map<string, any>();
  for (const key of Object.keys(row || {})) {
    map.set(key.trim().toLowerCase(), (row as any)[key]);
  }
  return map;
}

function pick(lookup: Map<string, any>, ...aliases: string[]): string {
  for (const alias of aliases) {
    const v = lookup.get(alias.trim().toLowerCase());
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

function parseIntOrNull(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[,$\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parsePriorityOrNull(raw: string): number | null {
  const n = parseIntOrNull(raw);
  if (n === null) return null;
  if (n < 1 || n > 5) return null;
  return n;
}

function parseDateOrNull(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const { rows, dryRun } = await request.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No data rows provided" },
        { status: 400 }
      );
    }

    // Fetch existing user applications for duplicate detection on (Company + Position + Date Applied)
    const existingApps = await prisma.application.findMany({
      where: { userId: user.id },
      select: { company: true, position: true, dateApplied: true },
    });

    const existingSet = new Set(
      existingApps.map(
        (a) =>
          `${a.company.toLowerCase().trim()}|${a.position.toLowerCase().trim()}|${
            new Date(a.dateApplied).toISOString().split("T")[0]
          }`
      )
    );

    const parsedRows: any[] = [];
    let duplicatesCount = 0;

    for (const row of rows) {
      const lookup = buildLookup(row);

      const company = pick(lookup, "company", "company name");
      const position = pick(lookup, "position", "role", "job title");
      const rawDate = pick(lookup, "date", "date applied", "dateapplied", "applied date") || new Date().toISOString();
      const jobLinkRaw = pick(lookup, "job link", "joblink", "job url", "link", "url");
      const rawNature = pick(lookup, "job nature", "jobnature", "nature");
      const rawType = pick(lookup, "job type", "jobtype", "type");
      const location = pick(lookup, "company location", "companylocation", "location");
      const rawStatus = pick(lookup, "job status", "jobstatus", "status") || "Applied";
      const comments = pick(lookup, "comments", "notes", "note");
      const portalName = pick(lookup, "source / portal", "source/portal", "source", "portal", "portal name", "source name");
      const howApplied = pick(lookup, "how applied", "howapplied", "applied via") || "Portal";
      const resumeLabel = pick(lookup, "resume version", "resumeversion", "resume label");
      const rawResumeUrl = pick(
        lookup,
        "resume url",
        "resumeurl",
        "resume drive",
        "resumedrive",
        "resume link",
        "resume"
      );
      const rawSalaryMin = pick(lookup, "salary min", "salarymin", "salary minimum", "min salary");
      const rawSalaryMax = pick(lookup, "salary max", "salarymax", "salary maximum", "max salary");
      const currency = (pick(lookup, "currency", "salary currency") || "USD").toUpperCase().trim();
      const rawPriority = pick(lookup, "priority");
      const rawFollowUp = pick(
        lookup,
        "follow-up date",
        "follow up date",
        "followup date",
        "followupdate",
        "follow up",
        "reminder date"
      );
      const rawTags = pick(lookup, "tags", "tag", "labels");

      if (!company || !position) continue;

      let dateApplied: Date;
      try {
        dateApplied = new Date(rawDate);
        if (isNaN(dateApplied.getTime())) dateApplied = new Date();
      } catch {
        dateApplied = new Date();
      }

      const dateStr = dateApplied.toISOString().split("T")[0];
      const key = `${company.toLowerCase().trim()}|${position.toLowerCase().trim()}|${dateStr}`;
      const isDuplicate = existingSet.has(key);

      if (isDuplicate) {
        duplicatesCount++;
      }

      const followUpDate = parseDateOrNull(rawFollowUp) ?? new Date(dateApplied.getTime() + 7 * 86400000);
      const tagNames = rawTags
        .split(/[,;]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      parsedRows.push({
        company: company.trim(),
        position: position.trim(),
        dateApplied,
        status: mapStatusToEnum(rawStatus),
        jobNature: mapJobNatureToEnum(rawNature),
        jobType: mapJobTypeToEnum(rawType),
        companyLocation: location.trim() || null,
        // Compulsory: fall back to placeholder when the sheet has no link.
        jobLink: normalizeJobLink(jobLinkRaw, company, position).url,
        howApplied: howApplied.trim() || "Portal",
        comments: comments.trim() || null,
        portalName: portalName.trim() || null,
        resumeLabel: resumeLabel.trim() || null,
        rawResumeUrl: rawResumeUrl.trim() || null,
        salaryMin: parseIntOrNull(rawSalaryMin),
        salaryMax: parseIntOrNull(rawSalaryMax),
        currency: currency || "USD",
        priority: parsePriorityOrNull(rawPriority),
        followUpDate,
        tagNames,
        isDuplicate,
      });
    }

    if (dryRun) {
      return NextResponse.json({
        totalParsed: parsedRows.length,
        duplicatesCount,
        preview: parsedRows.slice(0, 10),
      });
    }

    // Commit rows to database
    let createdCount = 0;

    for (const item of parsedRows) {
      if (item.isDuplicate) continue; // Skip duplicates on commit

      // Link or create portal from "Source / Portal"
      let portalId: string | null = null;
      if (item.portalName) {
        const existingPortal = await prisma.portal.findFirst({
          where: { userId: user.id, name: item.portalName },
        });
        if (existingPortal) {
          portalId = existingPortal.id;
        } else {
          const created = await prisma.portal.create({
            data: {
              userId: user.id,
              name: item.portalName,
              url: item.jobLink && item.jobLink.startsWith("http") ? item.jobLink : "https://example.com",
              notes: "Auto-created from CSV import",
            },
          });
          portalId = created.id;
        }
      }

      let resumeVersionId: string | null = null;
      if (item.rawResumeUrl) {
        let resume = await prisma.resumeVersion.findFirst({
          where: { userId: user.id, url: item.rawResumeUrl },
        });
        if (!resume) {
          resume = await prisma.resumeVersion.create({
            data: {
              userId: user.id,
              label: item.resumeLabel || `Imported Resume (${item.company})`,
              url: item.rawResumeUrl,
            },
          });
        }
        resumeVersionId = resume.id;
      }

      const app = await prisma.application.create({
        data: {
          userId: user.id,
          company: item.company,
          position: item.position,
          dateApplied: item.dateApplied,
          status: item.status,
          jobNature: item.jobNature,
          jobType: item.jobType,
          companyLocation: item.companyLocation,
          jobLink: item.jobLink,
          portalId,
          howApplied: item.howApplied,
          resumeVersionId,
          salaryMin: item.salaryMin,
          salaryMax: item.salaryMax,
          currency: item.currency,
          priority: item.priority,
          comments: item.comments,
          followUpDate: item.followUpDate,
        },
      });

      await prisma.statusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus: null,
          toStatus: item.status,
          changedAt: item.dateApplied,
        },
      });

      // Link tags from "Tags" (comma-separated)
      for (const tagName of item.tagNames || []) {
        let tagRecord = await prisma.tag.findFirst({
          where: { userId: user.id, name: tagName },
        });
        if (!tagRecord) {
          tagRecord = await prisma.tag.create({
            data: { userId: user.id, name: tagName },
          });
        }
        try {
          await prisma.applicationTag.create({
            data: { applicationId: app.id, tagId: tagRecord.id },
          });
        } catch {
          // Ignore duplicate tag links
        }
      }

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount: createdCount,
      skippedDuplicates: duplicatesCount,
    });
  } catch (error) {
    console.error("CSV Import error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV import" },
      { status: 500 }
    );
  }
}
