

export function slugifyCompanyForDomain(company: string): string {
  const slug = (company || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]/g, ""); // domains can't contain spaces — squash
  return slug || "company";
}

export function slugifyPosition(position: string): string {
  const slug = (position || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "role";
}

/**
 * Hosts that can never be a real job posting (user pasted a doc/form/resume link
 * by mistake). Treated as invalid so callers fall back to the placeholder.
 * NOTE: deliberately specific hosts — e.g. careers.google.com stays valid.
 */
const BLOCKED_JOB_LINK_HOSTS = [
  "docs.google.com", // Google Docs / Sheets / Slides
  "drive.google.com", // Google Drive (resume files, not postings)
  "forms.google.com", // Google Forms
  "forms.gle", // Google Forms short links
  "sheets.google.com",
  "slides.google.com",
];

export function isBlockedJobLinkHost(hostname: string): boolean {
  const host = (hostname || "").toLowerCase();
  return BLOCKED_JOB_LINK_HOSTS.some((b) => host === b || host.endsWith(`.${b}`));
}

export function buildPlaceholderJobLink(company: string, position: string): string {
  return `https://${slugifyCompanyForDomain(company)}.com/careers/${slugifyPosition(position)}`;
}

export function isValidJobLink(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
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

export function normalizeJobLink(
  input: string | null | undefined,
  company: string,
  position: string
): { url: string; usedPlaceholder: boolean } {
  const resolved = resolveJobLink(input, company, position);
  return { url: resolved.url, usedPlaceholder: resolved.outcome !== "valid" };
}

export type JobLinkOutcome = "valid" | "placeholder-missing" | "placeholder-blocked";

export interface ResolvedJobLink {
  outcome: JobLinkOutcome;
  /** URL to store (real link or generated placeholder). */
  url: string;
  /** The raw link the caller provided (only set when non-blank). */
  providedUrl?: string;
  /** Blocked hostname, when outcome is placeholder-blocked. */
  blockedHost?: string;
}

/**
 * Tri-state resolver:
 * - real posting link        -> { outcome: "valid" }
 * - blank / malformed        -> { outcome: "placeholder-missing" } (quiet fallback)
 * - explicit Docs/Forms/Drive link -> { outcome: "placeholder-blocked" }
 *   (caller should reject or warn with guidance, not silently accept)
 */
export function resolveJobLink(
  input: string | null | undefined,
  company: string,
  position: string
): ResolvedJobLink {
  const trimmed = (input || "").trim();
  const placeholder = buildPlaceholderJobLink(company, position);
  if (trimmed) {
    try {
      const parsed = new URL(trimmed);
      if (
        (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        isBlockedJobLinkHost(parsed.hostname)
      ) {
        return {
          outcome: "placeholder-blocked",
          url: placeholder,
          providedUrl: trimmed,
          blockedHost: parsed.hostname.toLowerCase(),
        };
      }
    } catch {
      // Not parseable — falls through to generic handling below.
    }
    if (isValidJobLink(trimmed)) {
      return { outcome: "valid", url: trimmed, providedUrl: trimmed };
    }
  }
  return { outcome: "placeholder-missing", url: placeholder };
}

/** Corrective message for callers (esp. AI) that passed a Docs/Forms/Drive link. */
export function blockedJobLinkNotice(providedUrl: string, placeholder: string): string {
  return (
    `⚠️ REJECTED job_link: '${providedUrl}' is a Google Docs/Forms/Drive link — ` +
    `never a valid job posting. Used placeholder ${placeholder} instead. ` +
    `Next time: pass the real job posting URL, or omit job_link and a placeholder ` +
    `is generated automatically. Ask the user for the real link and update it later.`
  );
}

/** Variant for updates where the stored link is left untouched. */
export function blockedJobLinkUnchangedNotice(providedUrl: string): string {
  return (
    `⚠️ REJECTED job_link: '${providedUrl}' is a Google Docs/Forms/Drive link — ` +
    `never a valid job posting. Left the existing link unchanged. ` +
    `Pass the real job posting URL to update it.`
  );
}
