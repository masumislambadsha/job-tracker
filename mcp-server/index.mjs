#!/usr/bin/env node
/**
 * JobDesk MCP Server (stdio)
 * --------------------------
 * Exposes your JobDesk database as MCP tools over stdio.
 * Used by local IDEs / desktop apps (Antigravity, Claude Desktop, etc.).
 *
 * The browser-facing MCP endpoint lives inside Next.js at /api/mcp
 * (Streamable HTTP, token-protected) — no separate server needed.
 *
 * Usage:
 *   node mcp-server/index.mjs
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";

// ─── Prisma ──────────────────────────────────────────────────────────────────
const prisma = new PrismaClient();

async function getDefaultUserId() {
  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) throw new Error("No user found in JobDesk database.");
  return user.id;
}

// ─── MCP Server ──────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "jobdesk",
  version: "1.0.0",
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: get_dashboard_stats
// ──────────────────────────────────────────────────────────────────────────────
server.tool("get_dashboard_stats", "Get live KPI metrics: total applications, active pipeline, interviews, offers, response rate, overdue follow-ups, weekly trend, portal leaderboard.", {}, async () => {
  const userId = await getDefaultUserId();
  const apps = await prisma.application.findMany({
    where: { userId },
    include: { portal: true, statusHistory: { orderBy: { changedAt: "asc" } } },
  });

  const total = apps.length;
  const active = apps.filter(a => !["REJECTED","GHOSTED","WITHDRAWN"].includes(a.status)).length;
  const interviews = apps.filter(a => ["INTERVIEW_SCHEDULED","INTERVIEW_COMPLETED","OFFER"].includes(a.status)).length;
  const offers = apps.filter(a => a.status === "OFFER").length;

  const applied = apps.filter(a => a.status !== "WISHLIST").length;
  const responses = apps.filter(a => !["WISHLIST","APPLIED","GHOSTED"].includes(a.status) || (a.statusHistory && a.statusHistory.length > 1)).length;
  const responseRate = applied > 0 ? Math.round((responses / applied) * 100) : 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next7 = new Date(today.getTime() + 7 * 86400000);
  const overdue = apps.filter(a => a.followUpDate && new Date(a.followUpDate) < today && !["REJECTED","GHOSTED","WITHDRAWN","OFFER"].includes(a.status));
  const upcoming = apps.filter(a => a.followUpDate && new Date(a.followUpDate) >= today && new Date(a.followUpDate) <= next7 && !["REJECTED","GHOSTED","WITHDRAWN","OFFER"].includes(a.status));

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        total_applications: total,
        active_pipeline: active,
        interviews,
        offers,
        response_rate_pct: responseRate,
        overdue_follow_ups: overdue.map(a => ({ company: a.company, position: a.position, due: a.followUpDate, status: a.status })),
        upcoming_follow_ups: upcoming.map(a => ({ company: a.company, position: a.position, due: a.followUpDate, status: a.status })),
      }, null, 2),
    }],
  };
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: list_applications
// ──────────────────────────────────────────────────────────────────────────────
server.tool("list_applications", "List all job applications. Optional filters: status, company search, priority.", {
  status: z.string().optional().describe("Filter by pipeline status e.g. APPLIED, INTERVIEW_SCHEDULED, OFFER, REJECTED"),
  search: z.string().optional().describe("Search by company name or position"),
  priority: z.number().min(1).max(5).optional().describe("Filter by priority rating 1-5"),
  limit: z.number().default(50).describe("Max results to return"),
}, async ({ status, search, priority, limit }) => {
  const userId = await getDefaultUserId();
  const apps = await prisma.application.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search ? {
        OR: [
          { company: { contains: search, mode: "insensitive" } },
          { position: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: { portal: { select: { name: true } }, resumeVersion: { select: { label: true } }, tags: { include: { tag: true } } },
    orderBy: { dateApplied: "desc" },
    take: limit,
  });

  const result = apps.map(a => ({
    id: a.id,
    company: a.company,
    position: a.position,
    status: a.status,
    date_applied: a.dateApplied,
    job_type: a.jobType,
    priority: a.priority,
    follow_up_date: a.followUpDate,
    portal: a.portal?.name ?? null,
    resume: a.resumeVersion?.label ?? null,
    tags: a.tags.map(t => t.tag.name),
    salary: a.salaryMin ? `${a.currency} ${a.salaryMin}–${a.salaryMax}` : null,
    comments: a.comments,
  }));

  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: add_application
// ──────────────────────────────────────────────────────────────────────────────
server.tool("add_application", "Add a new job application to your pipeline.", {
  company: z.string().describe("Company name"),
  position: z.string().describe("Job title / role"),
  status: z.enum(["WISHLIST","APPLIED","OA_ASSESSMENT","INTERVIEW_SCHEDULED","INTERVIEW_COMPLETED","OFFER","REJECTED","GHOSTED","WITHDRAWN"]).default("APPLIED"),
  date_applied: z.string().optional().describe("Date applied (YYYY-MM-DD). Defaults to today."),
  job_type: z.enum(["REMOTE","HYBRID","ONSITE"]).optional(),
  job_nature: z.enum(["FULL_TIME","PART_TIME","CONTRACT","FREELANCE","INTERNSHIP"]).optional(),
  company_location: z.string().optional(),
  job_link: z.string().optional().describe("Job posting URL"),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  currency: z.string().default("USD"),
  priority: z.number().min(1).max(5).default(3),
  follow_up_date: z.string().optional().describe("Next follow-up date (YYYY-MM-DD)"),
  comments: z.string().optional(),
}, async (args) => {
  const userId = await getDefaultUserId();
  const app = await prisma.application.create({
    data: {
      userId,
      company: args.company,
      position: args.position,
      status: args.status,
      dateApplied: args.date_applied ? new Date(args.date_applied) : new Date(),
      jobType: args.job_type ?? null,
      jobNature: args.job_nature ?? null,
      companyLocation: args.company_location ?? null,
      jobLink: args.job_link ?? null,
      salaryMin: args.salary_min ?? null,
      salaryMax: args.salary_max ?? null,
      currency: args.currency,
      priority: args.priority,
      followUpDate: args.follow_up_date ? new Date(args.follow_up_date) : null,
      comments: args.comments ?? null,
      statusHistory: {
        create: { fromStatus: null, toStatus: args.status, changedAt: new Date() },
      },
    },
  });

  return { content: [{ type: "text", text: `✅ Created application: ${app.company} — ${app.position} [${app.status}] (id: ${app.id})` }] };
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: update_application_status
// ──────────────────────────────────────────────────────────────────────────────
server.tool("update_application_status", "Move an application to a new pipeline status. Automatically logs the transition to StatusHistory.", {
  id: z.string().describe("Application ID (MongoDB ObjectId)"),
  status: z.enum(["WISHLIST","APPLIED","OA_ASSESSMENT","INTERVIEW_SCHEDULED","INTERVIEW_COMPLETED","OFFER","REJECTED","GHOSTED","WITHDRAWN"]),
  comment: z.string().optional().describe("Optional note about this status change"),
}, async ({ id, status, comment }) => {
  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) return { content: [{ type: "text", text: `❌ Application not found: ${id}` }] };

  await prisma.application.update({
    where: { id },
    data: {
      status,
      ...(comment ? { comments: comment } : {}),
      statusHistory: {
        create: { fromStatus: existing.status, toStatus: status, changedAt: new Date() },
      },
    },
  });

  return { content: [{ type: "text", text: `✅ Updated ${existing.company} — ${existing.position}: ${existing.status} → ${status}` }] };
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: update_application
// ──────────────────────────────────────────────────────────────────────────────
server.tool("update_application", "Update any fields of an application (follow-up date, salary, comments, priority, etc.)", {
  id: z.string().describe("Application ID"),
  follow_up_date: z.string().optional().describe("New follow-up date YYYY-MM-DD"),
  comments: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  currency: z.string().optional(),
  company_location: z.string().optional(),
  job_link: z.string().optional(),
}, async ({ id, follow_up_date, comments, priority, salary_min, salary_max, currency, company_location, job_link }) => {
  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) return { content: [{ type: "text", text: `❌ Application not found: ${id}` }] };

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
      ...(job_link !== undefined ? { jobLink: job_link } : {}),
    },
  });

  return { content: [{ type: "text", text: `✅ Updated application: ${existing.company} — ${existing.position}` }] };
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: delete_application
// ──────────────────────────────────────────────────────────────────────────────
server.tool("delete_application", "Permanently delete a job application and all its history.", {
  id: z.string().describe("Application ID"),
}, async ({ id }) => {
  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) return { content: [{ type: "text", text: `❌ Application not found: ${id}` }] };

  await prisma.statusHistory.deleteMany({ where: { applicationId: id } });
  await prisma.applicationTag.deleteMany({ where: { applicationId: id } });
  await prisma.application.delete({ where: { id } });

  return { content: [{ type: "text", text: `🗑️ Deleted: ${existing.company} — ${existing.position}` }] };
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: list_portals
// ──────────────────────────────────────────────────────────────────────────────
server.tool("list_portals", "List all curated job portals in your JobDesk directory.", {
  tier: z.number().min(1).max(3).optional().describe("Filter by tier (1=daily, 2=weekly, 3=reference)"),
}, async ({ tier }) => {
  const userId = await getDefaultUserId();
  const portals = await prisma.portal.findMany({
    where: { userId, ...(tier ? { tier } : {}) },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });

  return {
    content: [{
      type: "text",
      text: JSON.stringify(portals.map(p => ({
        id: p.id,
        name: p.name,
        url: p.url,
        tier: p.tier,
        notes: p.notes,
        last_checked: p.lastCheckedAt,
        applications: p.applicationsCount,
        response_rate_pct: p.responseRate,
      })), null, 2),
    }],
  };
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: list_resumes
// ──────────────────────────────────────────────────────────────────────────────
server.tool("list_resumes", "List all resume versions with their callback rates. Use download_resume to fetch the actual PDF file.", {}, async () => {
  const userId = await getDefaultUserId();
  const resumes = await prisma.resumeVersion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return {
    content: [{
      type: "text",
      text: JSON.stringify(resumes.map(r => ({
        id: r.id,
        label: r.label,
        url: r.url,
        source: r.url.startsWith("/resumes/") ? "local_pdf" : "external_url",
        created: r.createdAt,
      })), null, 2),
    }],
  };
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: download_resume
// ──────────────────────────────────────────────────────────────────────────────
server.tool("download_resume", "Download a resume PDF by ID. Local uploads are returned as a base64 PDF embedded resource; external (e.g. Google Drive) resumes return their direct URL.", {
  id: z.string().describe("Resume version ID from list_resumes"),
}, async ({ id }) => {
  const resume = await prisma.resumeVersion.findUnique({ where: { id } });
  if (!resume) return { content: [{ type: "text", text: `❌ Resume not found: ${id}` }] };

  if (!resume.url.startsWith("/resumes/")) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ label: resume.label, source: "external_url", url: resume.url, note: "External resume — fetch this URL directly." }, null, 2),
      }],
    };
  }

  const safeName = path.basename(resume.url);
  if (!/^[a-z0-9_.-]+\.pdf$/i.test(safeName)) {
    return { content: [{ type: "text", text: "❌ Invalid resume file reference." }] };
  }

  const filePath = path.join(process.cwd(), "public", "resumes", safeName);
  try {
    const buffer = await readFile(filePath);
    return {
      content: [
        {
          type: "text",
          text: `📄 ${resume.label} — application/pdf (${(buffer.length / 1024).toFixed(1)} KB). PDF attached as base64 in the embedded resource.`,
        },
        {
          type: "resource",
          resource: {
            uri: `file://${filePath}`,
            mimeType: "application/pdf",
            blob: buffer.toString("base64"),
          },
        },
      ],
    };
  } catch {
    return { content: [{ type: "text", text: `❌ Resume file missing on disk: ${safeName}` }] };
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// TOOL: get_overdue_followups
// ──────────────────────────────────────────────────────────────────────────────
server.tool("get_overdue_followups", "Get all applications with overdue follow-up reminders.", {}, async () => {
  const userId = await getDefaultUserId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const apps = await prisma.application.findMany({
    where: {
      userId,
      followUpDate: { lt: today },
      status: { notIn: ["REJECTED","GHOSTED","WITHDRAWN","OFFER"] },
    },
    orderBy: { followUpDate: "asc" },
  });

  return {
    content: [{
      type: "text",
      text: apps.length === 0
        ? "✅ No overdue follow-ups!"
        : JSON.stringify(apps.map(a => ({
            id: a.id,
            company: a.company,
            position: a.position,
            status: a.status,
            overdue_since: a.followUpDate,
          })), null, 2),
    }],
  };
});

// ─── Transport: stdio ─────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("JobDesk MCP Server running in stdio mode");
