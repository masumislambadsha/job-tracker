"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ApplicationTable } from "@/components/applications/ApplicationTable";
import { ApplicationFilterBar } from "@/components/applications/ApplicationFilterBar";
import { Button } from "@/components/ui/button";
import { QuickAddModal } from "@/components/applications/QuickAddModal";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Plus, Download, RefreshCw } from "lucide-react";
import { ApplicationItem, ApplicationStatus, PortalItem } from "@/lib/types";

const PAGE_SIZE = 20;

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [portals, setPortals] = useState<PortalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    jobType: "",
    jobNature: "",
    portalId: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "dateApplied",
    sortOrder: "desc" as "asc" | "desc",
  });

  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const effectiveFilters = { ...filters, search: debouncedSearch };

  const filtersRef = useRef(effectiveFilters);
  filtersRef.current = effectiveFilters;
  const hasLoadedRef = useRef(false);
  hasLoadedRef.current = hasLoaded;

  const fetchData = useCallback(
    async (cursor?: string, isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else if (!hasLoadedRef.current) {
          setIsLoading(true);
        } else if (cursor) {
          setIsLoadingMore(true);
        }

        const f = filtersRef.current;
        const params = new URLSearchParams();
        if (f.search) params.set("search", f.search);
        if (f.status) params.set("status", f.status);
        if (f.jobType) params.set("jobType", f.jobType);
        if (f.jobNature) params.set("jobNature", f.jobNature);
        if (f.portalId) params.set("portalId", f.portalId);
        if (f.dateFrom) params.set("dateFrom", f.dateFrom);
        if (f.dateTo) params.set("dateTo", f.dateTo);
        params.set("sortBy", f.sortBy);
        params.set("sortOrder", f.sortOrder);
        params.set("pageSize", String(PAGE_SIZE));
        if (cursor) params.set("cursor", cursor);

        const [appsRes, portalsRes] = await Promise.all([
          fetch(`/api/applications?${params.toString()}`),
          fetch("/api/portals"),
        ]);

        const [appsData, portalsData] = await Promise.all([
          appsRes.json(),
          portalsRes.json(),
        ]);

        if (appsData && Array.isArray(appsData.data)) {
          setTotal(appsData.total ?? 0);
          setNextCursor(appsData.nextCursor ?? null);
          setApplications((prev) =>
            cursor ? prev.concat(appsData.data) : appsData.data
          );
        }
        if (Array.isArray(portalsData)) setPortals(portalsData);
      } catch (err) {
        console.error("Error fetching table data:", err);
      } finally {
        setHasLoaded(true);
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  const filtersKey = JSON.stringify(effectiveFilters);
  const lastFiltersKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastFiltersKey.current === filtersKey) return;
    lastFiltersKey.current = filtersKey;
    setNextCursor(null);
    setApplications([]);
    fetchData();
  }, [filtersKey, fetchData]);

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
      console.error("Status update error:", err);
      fetchData();
    }
  };

  const handlePriorityChange = async (id: string, newPriority: number) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, priority: newPriority } : app))
    );

    try {
      await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
    } catch (err) {
      console.error("Priority update error:", err);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
    // If the last visible row was deleted but more rows exist, backfill.
    if (applications.length === 1 && nextCursor) {
      fetchData(nextCursor);
    }
    try {
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete error:", err);
      fetchData();
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchData(nextCursor);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Applications</h1>
            <span
              className="inline-flex items-center rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums"
              title="Applications matching current filters"
            >
              {hasLoaded ? total : "…"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Browse, filter, and inline-edit all your job applications in spreadsheet format.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchData(undefined, true)}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <a href="/api/export" download>
            <Button size="sm" variant="secondary">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </a>

          <Button
            size="sm"
            onClick={() => setIsQuickAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <ApplicationFilterBar
        filters={filters}
        onChange={setFilters}
        portals={portals}
      />

      {/* Table Content */}
      {hasLoaded ? (
        <ApplicationTable
          applications={applications}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onLoadMore={handleLoadMore}
          hasMore={Boolean(nextCursor)}
          isLoadingMore={isLoadingMore}
          total={total}
        />
      ) : (
        <TableSkeleton />
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => fetchData(undefined, true)}
      />
    </div>
  );
}
