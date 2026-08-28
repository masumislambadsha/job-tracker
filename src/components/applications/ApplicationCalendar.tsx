"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isPast,
  parseISO,
} from "date-fns";
import { ApplicationItem } from "@/lib/types";
import { getStatusConfig, isDateOverdue } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  AlertCircle,
} from "lucide-react";

interface ApplicationCalendarProps {
  applications: ApplicationItem[];
}

export function ApplicationCalendar({ applications }: ApplicationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Map applications to dates (by followUpDate or dateApplied)
  const getEventsForDay = (day: Date) => {
    return applications.filter((app) => {
      if (app.followUpDate) {
        const fDate = new Date(app.followUpDate);
        if (isSameDay(fDate, day)) return true;
      }
      return false;
    });
  };

  const selectedDayEvents = getEventsForDay(selectedDay);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Calendar Grid (3 Cols on Desktop) */}
      <Card className="lg:col-span-3 border p-4 sm:p-6">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between pb-5 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-foreground border border-border">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
              <p className="text-xs text-muted-foreground">Scheduled follow-ups and interview milestones</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCurrentMonth(new Date())}
              className="text-xs h-8 px-3"
            >
              Today
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-px pt-4 text-center text-xs font-semibold text-muted-foreground border-b pb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isSelected = isSameDay(day, selectedDay);
            const today = isToday(day);
            const events = getEventsForDay(day);
            const hasOverdue = events.some((e) => isDateOverdue(e.followUpDate, e.status));

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                  !isCurrentMonth
                    ? "opacity-30 border-transparent bg-muted/20"
                    : isSelected
                    ? "border-primary bg-accent shadow-sm"
                    : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                      today
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isSelected
                        ? "text-foreground font-bold"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {hasOverdue && (
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" title="Overdue follow-up" />
                  )}
                </div>

                {/* Day events pills */}
                <div className="space-y-1 mt-1 w-full overflow-hidden">
                  {events.slice(0, 2).map((evt) => {
                    const overdue = isDateOverdue(evt.followUpDate, evt.status);
                    return (
                      <div
                        key={evt.id}
                        className={`truncate rounded px-1.5 py-0.2 text-[9px] font-semibold border ${
                          overdue
                            ? "bg-destructive/20 text-destructive border-destructive/40"
                            : "bg-primary/15 text-foreground border-primary/30"
                        }`}
                      >
                        {evt.company}
                      </div>
                    );
                  })}
                  {events.length > 2 && (
                    <span className="text-[9px] text-muted-foreground pl-1">
                      +{events.length - 2} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Agenda Sidebar */}
      <Card className="border p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="pb-3 border-b">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-foreground" />
              <span>Agenda for {format(selectedDay, "MMMM d, yyyy")}</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isToday(selectedDay)
                ? "Today's scheduled follow-ups"
                : `${selectedDayEvents.length} application milestone(s)`}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                <p>No follow-ups or milestones scheduled for this date.</p>
              </div>
            ) : (
              selectedDayEvents.map((app) => {
                const statusConf = getStatusConfig(app.status);
                const overdue = isDateOverdue(app.followUpDate, app.status);

                return (
                  <div
                    key={app.id}
                    className={`p-3 rounded-xl border space-y-2 transition-colors ${
                      overdue
                        ? "bg-destructive/10 border-destructive/40"
                        : "bg-card border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/applications/${app.id}`}
                          className="font-bold text-xs text-foreground hover:text-primary"
                        >
                          {app.company}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">{app.position}</p>
                      </div>

                      <Badge
                        variant={overdue ? "destructive" : "secondary"}
                      >
                        {statusConf.shortLabel}
                      </Badge>
                    </div>

                    {overdue && (
                      <p className="text-[10px] font-bold text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Action Required: Follow-up is overdue</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t">
                      <span className="text-muted-foreground">
                        Applied: {format(new Date(app.dateApplied), "MMM d")}
                      </span>
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t text-[11px] text-muted-foreground">
          💡 Clicking dates updates the selected agenda.
        </div>
      </Card>
    </div>
  );
}