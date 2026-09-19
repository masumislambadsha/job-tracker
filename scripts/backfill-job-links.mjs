/**
 * One-off backfill: fill missing/invalid jobLink values with placeholders.
 * Run: node scripts/backfill-job-links.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugifyCompanyForDomain(company) {
  const slug = String(company || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return slug || "company";
}

function slugifyPosition(position) {
  const slug = String(position || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "role";
}

function buildPlaceholderJobLink(company, position) {
  return `https://${slugifyCompanyForDomain(company)}.com/careers/${slugifyPosition(position)}`;
}

const BLOCKED_JOB_LINK_HOSTS = [
  "docs.google.com",
  "drive.google.com",
  "forms.google.com",
  "forms.gle",
  "sheets.google.com",
  "slides.google.com",
];

function isBlockedJobLinkHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return BLOCKED_JOB_LINK_HOSTS.some((b) => host === b || host.endsWith(`.${b}`));
}

function isValidJobLink(url) {
  if (!url) return false;
  const trimmed = String(url).trim();
  if (!/^https?:\/\/.+\..+/.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (isBlockedJobLinkHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const apps = await prisma.application.findMany({
    select: { id: true, company: true, position: true, jobLink: true },
  });
  const missing = apps.filter((a) => !isValidJobLink(a.jobLink));
  console.log(`Found ${missing.length}/${apps.length} applications with missing/invalid job links.`);

  let updated = 0;
  for (const app of missing) {
    const placeholder = buildPlaceholderJobLink(app.company, app.position);
    await prisma.application.update({
      where: { id: app.id },
      data: { jobLink: placeholder },
    });
    updated++;
  }
  console.log(`✅ Backfilled ${updated} job links.`);
}

main()
  .catch((e) => {
    console.error("❌ Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
