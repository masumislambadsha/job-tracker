"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ApplicationCalendar } from "@/components/applications/ApplicationCalendar";
import { Button } from "@/components/ui/button";
import { QuickAddModal } from "@/components/applications/QuickAddModal";
import { CalendarSkeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw, CalendarDays } from "lucide-react";
import { ApplicationItem } from "@/lib/types";
import { fetchAllApplications } from "@/lib/fetch-applications";

export default function CalendarPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const monthRef = useRef(currentMonth);
  monthRef.current = currentMonth;
  const hasLoadedRef = useRef(false);
  hasLoadedRef.current = hasLoaded;

  // Server-scoped fetch: only follow-ups in the visible grid window
  // (month ± leading/trailing week days) are requested via
  // ?followUpFrom=&followUpTo=. Day cells + agenda then slice this
  // month-sized set, which is trivial compared to pulling all rows.
  const fetchApplications = useCallback(async (month?: Date) => {
    try {
      setIsRefreshing(true);
      const target = month ?? monthRef.current;
      const gridStart = startOfWeek(startOfMonth(target), { weekStartsOn: 0 });
      const gridEnd = endOfWeek(endOfMonth(target), { weekStartsOn: 0 });
      const data = await fetchAllApplications({
        params: {
          hasFollowUp: "true",
          followUpFrom: format(gridStart, "yyyy-MM-dd"),
          followUpTo: format(gridEnd, "yyyy-MM-dd"),
          sortBy: "followUpDate",
          sortOrder: "asc",
        },
      });
      setApplications(data);
    } catch (err) {
      console.error("Error fetching applications for calendar:", err);
    } finally {
      setHasLoaded(true);
      setIsRefreshing(false);
    }
  }, []);

  const monthKey = format(currentMonth, "yyyy-MM");
  const lastMonthKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastMonthKey.current === monthKey) return;
    lastMonthKey.current = monthKey;
    fetchApplications(currentMonth);
  }, [monthKey, currentMonth, fetchApplications]);

  const handleRefresh = () => fetchApplications();

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
            onClick={handleRefresh}
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
        <ApplicationCalendar
          applications={applications}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
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
