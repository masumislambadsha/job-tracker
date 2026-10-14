import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import Papa from "papaparse";

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        portal: true,
        resumeVersion: true,
        tags: { include: { tag: true } },
      },
      orderBy: { dateApplied: "desc" },
    });

    // Canonical column order — must match the user's Google Sheet exactly:
    // Date, Company, Position, Job Link, Job Nature, Job Type,
    // Company Location, Job Status, Comments, Source / Portal, How Applied,
    // Resume Version, Resume URL, Salary Min, Salary Max, Currency, Priority,
    // Follow-up Date, Tags (columns A:S). Papa.unparse preserves key insertion
    // order, so do NOT reorder these keys.
    const exportRows = applications.map((app) => ({
      "Date": new Date(app.dateApplied).toISOString().split("T")[0],
      "Company": app.company,
      "Position": app.position,
      "Job Link": app.jobLink || "",
      "Job Nature": app.jobNature || "",
      "Job Type": app.jobType || "",
      "Company Location": app.companyLocation || "",
      "Job Status": app.status,
      "Comments": app.comments || "",
      "Source / Portal": app.portal?.name || "",
      "How Applied": app.howApplied || "",
      "Resume Version": app.resumeVersion?.label || "",
      "Resume URL": app.resumeVersion?.url || "",
      "Salary Min": app.salaryMin ?? "",
      "Salary Max": app.salaryMax ?? "",
      "Currency": app.currency || "USD",
      "Priority": app.priority ?? "",
      "Follow-up Date": app.followUpDate ? new Date(app.followUpDate).toISOString().split("T")[0] : "",
      "Tags": app.tags.map((t) => t.tag.name).join(", "),
    }));

    const csv = Papa.unparse(exportRows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jobdesk_applications_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
