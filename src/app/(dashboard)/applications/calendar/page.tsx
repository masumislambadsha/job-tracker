"use client";

import React, { useState, useEffect } from "react";
import { ApplicationCalendar } from "@/components/applications/ApplicationCalendar";
import { Button } from "@/components/ui/button";
import { QuickAddModal } from "@/components/applications/QuickAddModal";
import { CalendarSkeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw, CalendarDays } from "lucide-react";
import { ApplicationItem } from "@/lib/types";

export default function CalendarPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      setIsRefreshing(true);
      if (!hasLoaded) setIsLoading(true);
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (Array.isArray(data)) {
        setApplications(data);
      }
    } catch (err) {
      console.error("Error fetching applications for calendar:", err);
    } finally {
      setHasLoaded(true);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-indigo-400" />
            <span>Follow-up & Interview Calendar</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Visual calendar schedule for all follow-up reminders and scheduled interview dates.
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

      {/* Calendar Component */}
      {hasLoaded ? (
        <ApplicationCalendar applications={applications} />
      ) : (
        <CalendarSkeleton />
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
