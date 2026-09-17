import { ApplicationItem } from "@/lib/types";

export const APPLICATION_LIST_CAP = 2000;

interface FetchAllApplicationsOptions {
  params?: Record<string, string>;
  limit?: number;
}

export async function fetchAllApplications({
  params = {},
  limit = APPLICATION_LIST_CAP,
}: FetchAllApplicationsOptions = {}): Promise<ApplicationItem[]> {
  const all: ApplicationItem[] = [];
  let cursor: string | undefined;

  do {
    const search = new URLSearchParams({ pageSize: "200", ...params });
    if (cursor) search.set("cursor", cursor);

    const res = await fetch(`/api/applications?${search.toString()}`);
    if (!res.ok) {
      throw new Error(`Applications request failed: ${res.status}`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.data)) break;

    all.push(...data.data);
    cursor = data.nextCursor ?? undefined;
    if (all.length >= limit) break;
  } while (cursor);

  return all;
}