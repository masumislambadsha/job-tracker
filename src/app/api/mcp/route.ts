import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { blockedJobLinkNotice, blockedJobLinkUnchangedNotice, resolveJobLink } from "@/lib/job-link";
import { isMcpAuthorized, mcpCorsHeaders, getMcpToken } from "@/lib/mcp-token";
import { isOAuthAccessToken } from "@/lib/oauth";
import { appendApplication } from "@/lib/google-sheets";

// ─── Helper: get user ID ──────────────────────────────────────────────────────
async function getUserId(request: NextRequest): Promise<string> {
  let user = await getCurrentUser();
  if (!user) user = await getOrCreateDefaultUser();
  return user.id;
}

// ─── Build MCP server with all tools ─────────────────────────────────────────
function createMcpServer() {
  const server = new McpServer({
    name: "jobdesk",
    version: "1.0.0",
  });

  // ── get_dashboard_stats ───────────────────────────────────────────────────
  server.tool("get_dashboard_stats", "Get live KPI metrics: total applications, active pipeline, interviews, offers, response rate, overdue follow-ups.", {}, async () => {
    const userId = await getOrCreateDefaultUser().then(u => u.id);
    const TERMINAL = ["REJECTED", "GHOSTED", "WITHDRAWN"];
    const RESPONSE = ["OA_ASSESSMENT", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER", "REJECTED"];

    const [total, active, interviews, offers, applied, responses] = await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.application.count({ where: { userId, status: { notIn: TERMINAL } } }),
      prisma.application.count({ where: { userId, status: { in: ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER"] } } }),
      prisma.application.count({ where: { userId, status: "OFFER" } }),
      prisma.application.count({ where: { userId, status: { not: "WISHLIST" } } }),
      prisma.application.count({ where: { userId, status: { in: RESPONSE } } }),
    ]);
    const responseRate = applied > 0 ? Math.round((responses / applied) * 100) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7 = new Date(today.getTime() + 7 * 86400000);
    const FOLLOW_UP_SELECT = { company: true, position: true, status: true, followUpDate: true } as const;

    const [overdue, upcoming] = await Promise.all([
      prisma.application.findMany({
        where: { userId, followUpDate: { not: null, lt: today }, status: { notIn: [...TERMINAL, "OFFER"] } },
        orderBy: [{ followUpDate: "asc" }, { id: "asc" }],
        select: FOLLOW_UP_SELECT,
      }),
      prisma.application.findMany({
        where: { userId, followUpDate: { not: null, gte: today, lte: next7 }, status: { notIn: [...TERMINAL, "OFFER"] } },
        orderBy: [{ followUpDate: "asc" }, { id: "asc" }],
        select: FOLLOW_UP_SELECT,
      }),
    ]);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          total_applications: total,
          active_pipeline: active,
          interviews,
          offers,
          response_rate_pct: responseRate,
          overdue_follow_ups: overdue.map(a => ({ company: a.company, position: a.position, status: a.status, due: a.followUpDate })),
          upcoming_follow_ups: upcoming.map(a => ({ company: a.company, position: a.position, status: a.status, due: a.followUpDate })),
        }, null, 2),
      }],
    };
  });

  // ── list_applications ─────────────────────────────────────────────────────
  server.tool("list_applications", "List all job applications with optional filters.", {
    status: z.string().optional().describe("Pipeline status e.g. APPLIED, INTERVIEW_SCHEDULED, OFFER, REJECTED"),
    search: z.string().optional().describe("Search by company or position"),
    priority: z.number().min(1).max(5).optional(),
    limit: z.number().default(50),
  }, async ({ status, search, priority, limit }) => {
    const userId = await getOrCreateDefaultUser().then(u => u.id);
    const apps = await prisma.application.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(search ? { OR: [{ company: { contains: search, mode: "insensitive" } }, { position: { contains: search, mode: "insensitive" } }] } : {}),
      },
      include: { portal: { select: { name: true } }, resumeVersion: { select: { label: true } }, tags: { include: { tag: true } } },
      orderBy: { dateApplied: "desc" },
      take: limit,
    });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(apps.map(a => ({
          id: a.id, company: a.company, position: a.position, status: a.status,
          date_applied: a.dateApplied, priority: a.priority, follow_up: a.followUpDate,
          job_link: a.jobLink,
          portal: a.portal?.name ?? null, resume: a.resumeVersion?.label ?? null,
          tags: a.tags.map(t => t.tag.name), salary: a.salaryMin ? `${a.currency} ${a.salaryMin}–${a.salaryMax}` : null,
          comments: a.comments,
        })), null, 2),
      }],
    };
  });

  // ── add_application ───────────────────────────────────────────────────────
  server.tool("add_application", "Add a new job application to the pipeline. You MUST always provide job_link: use the real job posting URL if the user gave one; if no link was provided, you MUST generate a placeholder from the company and role, e.g. company 'Zayson' + position 'Full Stack Developer' -> 'https://zayson.com/careers/full-stack-developer'. Google Docs, Forms, Sheets, Slides or Drive links are NEVER valid posting links — if the user gives one, the call still succeeds but the link is rejected and replaced with a placeholder; prefer the real posting URL or omit job_link. Never omit job_link or store null.", {
    company: z.string(),
    position: z.string(),
    status: z.enum(["WISHLIST","APPLIED","OA_ASSESSMENT","INTERVIEW_SCHEDULED","INTERVIEW_COMPLETED","OFFER","REJECTED","GHOSTED","WITHDRAWN"]).default("APPLIED"),
    date_applied: z.string().optional().describe("YYYY-MM-DD, defaults to today"),
    job_type: z.enum(["REMOTE","HYBRID","ONSITE"]).optional(),
    job_nature: z.enum(["FULL_TIME","PART_TIME","CONTRACT","FREELANCE","INTERNSHIP"]).optional(),
    company_location: z.string().optional(),
    job_link: z.string().optional().describe("REQUIRED: real job posting URL if known; otherwise generate placeholder https://{company-slug}.com/careers/{position-slug} (e.g. https://zayson.com/careers/full-stack-developer). Google Docs/Forms/Drive links are never valid — generate the placeholder instead. Never leave blank."),
    salary_min: z.number().optional(),
    salary_max: z.number().optional(),
    currency: z.string().default("USD"),
    priority: z.number().min(1).max(5).default(3),
    follow_up_date: z.string().optional().describe("YYYY-MM-DD"),
    comments: z.string().optional(),
  }, async (args) => {
    const userId = await getOrCreateDefaultUser().then(u => u.id);
    const resolvedLink = resolveJobLink(args.job_link, args.company, args.position);
    const finalJobLink = resolvedLink.url;
    const linkNotice =
      resolvedLink.outcome === "placeholder-blocked"
        ? `\n${blockedJobLinkNotice(resolvedLink.providedUrl!, finalJobLink)}`
        : resolvedLink.outcome === "placeholder-missing"
          ? `\n🔗 Job link: ${finalJobLink} (⚠️ placeholder — no real link was provided, update it later)`
          : `\n🔗 Job link: ${finalJobLink}`;
    const app = await prisma.application.create({
      data: {
        userId, company: args.company, position: args.position, status: args.status,
        dateApplied: args.date_applied ? new Date(args.date_applied) : new Date(),
        jobType: args.job_type ?? null, jobNature: args.job_nature ?? null,
        companyLocation: args.company_location ?? null, jobLink: finalJobLink,
        salaryMin: args.salary_min ?? null, salaryMax: args.salary_max ?? null,
        currency: args.currency, priority: args.priority,
        followUpDate: args.follow_up_date ? new Date(args.follow_up_date) : null,
        comments: args.comments ?? null,
        statusHistory: { create: { fromStatus: null, toStatus: args.status, changedAt: new Date() } },
      },
    });
    try {
      await appendApplication(app);
    } catch (err) {
      console.error("[Sheets Sync] Background error:", (err as Error).message);
    }
    return { content: [{ type: "text" as const, text: `✅ Created: ${app.company} — ${app.position} [${app.status}] (id: ${app.id})${linkNotice}` }] };
  });

  // ── update_application_status ─────────────────────────────────────────────
  server.tool("update_application_status", "Move an application to a new pipeline status and log the transition.", {
    id: z.string().describe("Application MongoDB ObjectId"),
    status: z.enum(["WISHLIST","APPLIED","OA_ASSESSMENT","INTERVIEW_SCHEDULED","INTERVIEW_COMPLETED","OFFER","REJECTED","GHOSTED","WITHDRAWN"]),
    comment: z.string().optional(),
  }, async ({ id, status, comment }) => {
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) return { content: [{ type: "text" as const, text: `❌ Not found: ${id}` }] };
    await prisma.application.update({
      where: { id },
      data: {
        status, ...(comment ? { comments: comment } : {}),
        statusHistory: { create: { fromStatus: existing.status, toStatus: status, changedAt: new Date() } },
      },
    });
    return { content: [{ type: "text" as const, text: `✅ ${existing.company} — ${existing.position}: ${existing.status} → ${status}` }] };
  });

  // ── update_application ────────────────────────────────────────────────────
  server.tool("update_application", "Update fields on an application (follow-up, salary, priority, comments, etc.)", {
    id: z.string(),
    follow_up_date: z.string().optional().describe("YYYY-MM-DD"),
    comments: z.string().optional(),
    priority: z.number().min(1).max(5).optional(),
    salary_min: z.number().optional(),
    salary_max: z.number().optional(),
    currency: z.string().optional(),
    company_location: z.string().optional(),
    job_link: z.string().optional().describe("Real job posting URL. Google Docs/Forms/Drive links are rejected and left unchanged — pass the real posting URL instead."),
  }, async ({ id, follow_up_date, comments, priority, salary_min, salary_max, currency, company_location, job_link }) => {
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) return { content: [{ type: "text" as const, text: `❌ Not found: ${id}` }] };
    // Never store a Docs/Forms/Drive link: skip it, apply everything else.
    let linkNotice = "";
    let resolvedJobLink: string | undefined;
    if (job_link !== undefined) {
      const resolved = resolveJobLink(job_link, existing.company, existing.position);
      if (resolved.outcome === "valid") {
        resolvedJobLink = resolved.url;
      } else if (resolved.outcome === "placeholder-blocked") {
        linkNotice = `\n${blockedJobLinkUnchangedNotice(resolved.providedUrl!)}`;
      }
      // blank/malformed on update: keep the existing link, no noise.
    }
    await prisma.application.update({
      where: { id },
      data: {
        ...(follow_up_date ? { followUpDate: new Date(follow_up_date) } : {}),
        ...(comments !== undefined ? { comments } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(salary_min !== undefined ? { salaryMin: salary_min } : {}),
        ...(salary_max !== undefined ? { salaryMax: salary_max } : {}),
        ...(currency !== undefined ? { currency } : {}),
        ...(company_location !== undefined ? { companyLocation: company_location } : {}),
        ...(resolvedJobLink !== undefined ? { jobLink: resolvedJobLink } : {}),
      },
    });
    return { content: [{ type: "text" as const, text: `✅ Updated: ${existing.company} — ${existing.position}${linkNotice}` }] };
  });

  // ── delete_application ────────────────────────────────────────────────────
  server.tool("delete_application", "Permanently delete a job application and all its history.", {
    id: z.string(),
  }, async ({ id }) => {
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) return { content: [{ type: "text" as const, text: `❌ Not found: ${id}` }] };
    await prisma.statusHistory.deleteMany({ where: { applicationId: id } });
    await prisma.applicationTag.deleteMany({ where: { applicationId: id } });
    await prisma.application.delete({ where: { id } });
    return { content: [{ type: "text" as const, text: `🗑️ Deleted: ${existing.company} — ${existing.position}` }] };
  });

  // ── list_portals ──────────────────────────────────────────────────────────
  server.tool("list_portals", "List all curated job portals in the directory.", {
    tier: z.number().min(1).max(3).optional(),
  }, async ({ tier }) => {
    const userId = await getOrCreateDefaultUser().then(u => u.id);
    const portals = await prisma.portal.findMany({
      where: { userId, ...(tier ? { tier } : {}) },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    });
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(portals.map(p => ({ id: p.id, name: p.name, url: p.url, tier: p.tier, notes: p.notes, last_checked: p.lastCheckedAt })), null, 2),
      }],
    };
  });

  // ── list_resumes ──────────────────────────────────────────────────────────
  server.tool("list_resumes", "List all resume versions with their PDF URLs. Use download_resume to fetch the actual file.", {}, async () => {
    const userId = await getOrCreateDefaultUser().then(u => u.id);
    const resumes = await prisma.resumeVersion.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(resumes.map(r => ({ id: r.id, label: r.label, url: r.url, hasFile: Boolean(r.fileData || r.fileSize), source: (r.fileData || r.url.startsWith("/resumes/")) ? "stored_pdf" : "external_url" })), null, 2),
      }],
    };
  });

  // ── download_resume ───────────────────────────────────────────────────────
  server.tool("download_resume", "Download a resume PDF by ID. Returns metadata plus the full PDF as a base64-encoded string (decode it to get application/pdf bytes). Also includes the absolute file path (local) and download endpoint.", {
    id: z.string().describe("Resume version ID from list_resumes"),
  }, async ({ id }) => {
    const resume = await prisma.resumeVersion.findUnique({ where: { id } });
    if (!resume) {
      return { content: [{ type: "text" as const, text: `❌ Resume not found: ${id}` }] };
    }

    // PDFs stored in MongoDB (works in production) — preferred.
    if (resume.fileData) {
      const buffer = Buffer.from(resume.fileData, "base64");
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            label: resume.label,
            mime_type: resume.mimeType || "application/pdf",
            size_bytes: buffer.length,
            download_endpoint: `/api/resumes/${id}/download`,
            encoding: "base64",
            data_base64: resume.fileData,
            note: "Decode data_base64 from base64 to binary and save with a .pdf extension.",
          }, null, 2),
        }],
      };
    }

    if (!resume.url.startsWith("/resumes/")) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ label: resume.label, source: "external_url", url: resume.url, note: "External resume (e.g. Google Drive) — fetch this URL directly." }, null, 2),
        }],
      };
    }

    const safeName = path.basename(resume.url);
    if (!/^[a-z0-9_.-]+\.pdf$/i.test(safeName)) {
      return { content: [{ type: "text" as const, text: "❌ Invalid resume file reference." }] };
    }

    const filePath = path.join(process.cwd(), "public", "resumes", safeName);
    try {
      const buffer = await readFile(filePath);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            label: resume.label,
            mime_type: "application/pdf",
            size_bytes: buffer.length,
            file_path: filePath,
            download_endpoint: `/api/resumes/${id}/download`,
            encoding: "base64",
            data_base64: buffer.toString("base64"),
            note: "Decode data_base64 from base64 to binary and save with a .pdf extension. If you have filesystem access, you can also read file_path directly.",
          }, null, 2),
        }],
      };
    } catch {
      return { content: [{ type: "text" as const, text: `❌ Resume file not found. Please re-upload the PDF.` }] };
    }
  });

  // ── get_overdue_followups ─────────────────────────────────────────────────
  server.tool("get_overdue_followups", "Get all applications with overdue follow-up reminders.", {}, async () => {
    const userId = await getOrCreateDefaultUser().then(u => u.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apps = await prisma.application.findMany({
      where: { userId, followUpDate: { lt: today }, status: { notIn: ["REJECTED","GHOSTED","WITHDRAWN","OFFER"] } },
      orderBy: { followUpDate: "asc" },
    });
    return {
      content: [{
        type: "text" as const,
        text: apps.length === 0 ? "✅ No overdue follow-ups!" : JSON.stringify(apps.map(a => ({ id: a.id, company: a.company, position: a.position, status: a.status, overdue_since: a.followUpDate })), null, 2),
      }],
    };
  });

  return server;
}

// ─── Next.js route handler ────────────────────────────────────────────────────
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const header = request.headers.get("authorization");
  if (header) {
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (match) {
      const bearer = match[1];
      if (bearer === getMcpToken()) return true;
      if (await isOAuthAccessToken(bearer)) return true;
    }
  }
  return isMcpAuthorized(request);
}

async function handleMcpRequest(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthorized(request))) {
    return NextResponse.json(
      { error: "Unauthorized. Pass ?token=<MCP_TOKEN> or Authorization: Bearer <MCP_TOKEN>" },
      { status: 401, headers: mcpCorsHeaders() },
    );
  }

  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — works on Vercel/serverless
  });

  await server.connect(transport);
  const response = await transport.handleRequest(request);

  for (const [key, value] of Object.entries(mcpCorsHeaders())) {
    response.headers.set(key, value);
  }
  return response as NextResponse;
}

export async function POST(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function GET(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mcpCorsHeaders() });
}
