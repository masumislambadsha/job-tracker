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

function isValidJobLink(url) {
  if (!url) return false;
  const trimmed = String(url).trim();
  if (!/^https?:\/\/.+\..+/.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
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
