"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { KanbanBoard } from "@/components/applications/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickAddModal } from "@/components/applications/QuickAddModal";
import { KanbanSkeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw, Layers, Search, X } from "lucide-react";
import { ApplicationItem, ApplicationStatus, PortalItem } from "@/lib/types";
import { fetchAllApplications } from "@/lib/fetch-applications";

type BoardFilters = {
  search: string;
  portalId: string;
  tagId: string;
};

const DEFAULT_BOARD_FILTERS: BoardFilters = {
  search: "",
  portalId: "",
  tagId: "",
};

function getInitialBoardFilters(): BoardFilters {
  if (typeof window === "undefined") return DEFAULT_BOARD_FILTERS;
  const params = new URLSearchParams(window.location.search);
  return {
    search: params.get("search") ?? "",
    portalId: params.get("portalId") ?? "",
    tagId: params.get("tagId") ?? "",
  };
}

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function KanbanBoardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [portals, setPortals] = useState<PortalItem[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [filters, setFilters] = useState<BoardFilters>(getInitialBoardFilters);

  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const effectiveFilters = { ...filters, search: debouncedSearch };
  const filtersRef = useRef(effectiveFilters);
  filtersRef.current = effectiveFilters;
  const hasLoadedRef = useRef(false);
  hasLoadedRef.current = hasLoaded;

  const fetchApplications = useCallback(async () => {
    try {
      setIsRefreshing(true);
      if (!hasLoadedRef.current) setIsLoading(true);
      const f = filtersRef.current;
      const params: Record<string, string> = {
        sortBy: "dateApplied",
        sortOrder: "desc",
      };
      // Every key here becomes a Prisma `where` clause server-side —
      // no client-side filtering of the result set.
      if (f.search) params.search = f.search;
      if (f.portalId) params.portalId = f.portalId;
      if (f.tagId) params.tagId = f.tagId;
      const [data, portalsRes, tagsRes] = await Promise.all([
        fetchAllApplications({ params }),
        fetch("/api/portals").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/tags").then((r) => (r.ok ? r.json() : [])),
      ]);
      setApplications(data);
      if (Array.isArray(portalsRes)) setPortals(portalsRes);
      if (Array.isArray(tagsRes)) setTags(tagsRes);
    } catch (err) {
      console.error("Error fetching applications for Kanban:", err);
    } finally {
      setHasLoaded(true);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const filtersKey = JSON.stringify(effectiveFilters);
  const lastFiltersKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastFiltersKey.current === filtersKey) return;
    lastFiltersKey.current = filtersKey;
    fetchApplications();
  }, [filtersKey, fetchApplications]);

  // Keep the URL shareable: /applications/board?search=&portalId=&tagId=
  const isFirstUrlSync = useRef(true);
  useEffect(() => {
    if (isFirstUrlSync.current) {
      isFirstUrlSync.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (effectiveFilters.search) params.set("search", effectiveFilters.search);
    if (effectiveFilters.portalId) params.set("portalId", effectiveFilters.portalId);
    if (effectiveFilters.tagId) params.set("tagId", effectiveFilters.tagId);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [filtersKey, effectiveFilters, router, pathname]);

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );

    try {
      await fetch(`/api/applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Error persisting status change:", err);
      fetchApplications();
    }
  };

  const hasActiveFilters = Boolean(filters.search || filters.portalId || filters.tagId);
  const clearFilters = () => setFilters({ ...filters, search: "", portalId: "", tagId: "" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-400" />
            <span>Application Pipeline Board</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Drag cards across pipeline stages. Status transitions and timestamps are saved automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchApplications}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsQuickAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Server-driven filter bar: search + portal + tag all become API query params */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border bg-card p-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search board by company, position, notes..."
            className="pl-8 pr-7"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: "" })}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.portalId}
            onValueChange={(v) =>
              setFilters({ ...filters, portalId: v === "__all" ? "" : v })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Portals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Portals</SelectItem>
              {portals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.tagId}
            onValueChange={(v) =>
              setFilters({ ...filters, tagId: v === "__all" ? "" : v })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-destructive hover:text-destructive shrink-0"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      {hasLoaded ? (
        <KanbanBoard
          applications={applications}
          onStatusChange={handleStatusChange}
          onOpenQuickAddWithStatus={() => setIsQuickAddOpen(true)}
        />
      ) : (
        <KanbanSkeleton />
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => fetchApplications()}
      />
    </div>
  );
}
