"use client";

import React, { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/applications/KanbanBoard";
import { Button } from "@/components/ui/button";
import { QuickAddModal } from "@/components/applications/QuickAddModal";
import { KanbanSkeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw, Layers } from "lucide-react";
import { ApplicationItem, ApplicationStatus } from "@/lib/types";

export default function KanbanBoardPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      setIsRefreshing(true);
      if (!hasLoaded) setIsLoading(true);
      const res = await fetch("/api/applications?sortBy=dateApplied&sortOrder=desc");
      const data = await res.json();
      if (Array.isArray(data)) {
        setApplications(data);
      }
    } catch (err) {
      console.error("Error fetching applications for Kanban:", err);
    } finally {
      setHasLoaded(true);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

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
