"use client";

import React, { useState, useEffect } from "react";
import { ApplicationTable } from "@/components/applications/ApplicationTable";
import { ApplicationFilterBar } from "@/components/applications/ApplicationFilterBar";
import { Button } from "@/components/ui/button";
import { QuickAddModal } from "@/components/applications/QuickAddModal";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Plus, Download, RefreshCw } from "lucide-react";
import { ApplicationItem, ApplicationStatus, PortalItem } from "@/lib/types";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [portals, setPortals] = useState<PortalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      if (!hasLoaded) setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.jobType) params.set("jobType", filters.jobType);
      if (filters.jobNature) params.set("jobNature", filters.jobNature);
      if (filters.portalId) params.set("portalId", filters.portalId);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      params.set("sortBy", filters.sortBy);
      params.set("sortOrder", filters.sortOrder);

      const [appsRes, portalsRes] = await Promise.all([
        fetch(`/api/applications?${params.toString()}`),
        fetch("/api/portals"),
      ]);

      const [appsData, portalsData] = await Promise.all([
        appsRes.json(),
        portalsRes.json(),
      ]);

      if (Array.isArray(appsData)) setApplications(appsData);
      if (Array.isArray(portalsData)) setPortals(portalsData);
    } catch (err) {
      console.error("Error fetching table data:", err);
    } finally {
      setHasLoaded(true);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

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
    try {
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete error:", err);
      fetchData();
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
              {hasLoaded ? applications.length : "…"}
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
            onClick={fetchData}
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
        />
      ) : (
        <TableSkeleton />
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
