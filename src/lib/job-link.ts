

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

export function buildPlaceholderJobLink(company: string, position: string): string {
  return `https://${slugifyCompanyForDomain(company)}.com/careers/${slugifyPosition(position)}`;
}

export function isValidJobLink(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!/^https?:\/\/.+\..+/.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeJobLink(
  input: string | null | undefined,
  company: string,
  position: string
): { url: string; usedPlaceholder: boolean } {
  const trimmed = (input || "").trim();
  if (trimmed && isValidJobLink(trimmed)) {
    return { url: trimmed, usedPlaceholder: false };
  }
  return { url: buildPlaceholderJobLink(company, position), usedPlaceholder: true };
}
