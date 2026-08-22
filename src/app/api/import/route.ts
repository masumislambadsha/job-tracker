import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";

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
      // Column mappings from Appendix B
      const company = row["Company"] || row["company"] || row["Company Name"] || "";
      const position = row["Position"] || row["position"] || row["Role"] || row["Job Title"] || "";
      const rawDate = row["Date"] || row["date"] || row["Date Applied"] || new Date().toISOString();
      const rawResumeUrl = row["Resume Drive"] || row["resumeDrive"] || row["Resume Link"] || row["Resume"] || "";
      const rawNature = row["Job Nature"] || row["jobNature"] || row["Nature"] || "";
      const rawType = row["Job Type"] || row["jobType"] || row["Type"] || "";
      const location = row["Company Location"] || row["companyLocation"] || row["Location"] || "";
      const jobLink = row["Job Link"] || row["jobLink"] || row["Link"] || row["URL"] || "";
      const rawStatus = row["Job Status"] || row["jobStatus"] || row["Status"] || "Applied";
      const howApplied = row["How Applied"] || row["howApplied"] || "Portal";
      const comments = row["Comments"] || row["comments"] || row["Notes"] || "";

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

      parsedRows.push({
        company: company.trim(),
        position: position.trim(),
        dateApplied,
        status: mapStatusToEnum(rawStatus),
        jobNature: mapJobNatureToEnum(rawNature),
        jobType: mapJobTypeToEnum(rawType),
        companyLocation: location.trim() || null,
        jobLink: jobLink.trim() || null,
        howApplied: howApplied.trim() || "Portal",
        comments: comments.trim() || null,
        rawResumeUrl: rawResumeUrl.trim() || null,
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

      let resumeVersionId: string | null = null;
      if (item.rawResumeUrl) {
        let resume = await prisma.resumeVersion.findFirst({
          where: { userId: user.id, url: item.rawResumeUrl },
        });
        if (!resume) {
          resume = await prisma.resumeVersion.create({
            data: {
              userId: user.id,
              label: `Imported Resume (${item.company})`,
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
          howApplied: item.howApplied,
          resumeVersionId,
          comments: item.comments,
          followUpDate: new Date(item.dateApplied.getTime() + 7 * 86400000),
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
