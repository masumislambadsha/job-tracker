"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationItem } from "@/lib/types";
import { formatDate, formatRelativeDate, getStatusConfig } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface FollowUpAlertsProps {
  overdue: ApplicationItem[];
  upcoming: ApplicationItem[];
}

export function FollowUpAlerts({ overdue, upcoming }: FollowUpAlertsProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleQuickExtend = async (appId: string) => {
    try {
      setUpdatingId(appId);
      const newFollowUp = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpDate: newFollowUp }),
      });
      router.refresh();
    } catch (err) {
      console.error("Error extending follow-up:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickStatus = async (appId: string, newStatus: string) => {
    try {
      setUpdatingId(appId);
      await fetch(`/api/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Follow-ups & Reminders</CardTitle>
          <CardDescription>
            Applications requiring follow-up action or upcoming check-ins
          </CardDescription>
        </div>
        {overdue.length > 0 && (
          <Badge variant="destructive">
            {overdue.length} Overdue
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Overdue Section */}
        {overdue.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-destructive block">
              Overdue ({overdue.length})
            </span>

            <div className="space-y-2">
              {overdue.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/30"
                >
                  <div>
                    <Link
                      href={`/applications/${app.id}`}
                      className="font-semibold text-foreground hover:underline text-xs"
                    >
                      {app.company}
                    </Link>
                    <span className="text-muted-foreground text-xs mx-1.5">·</span>
                    <span className="text-muted-foreground text-xs">{app.position}</span>
                    <p className="text-[10px] text-destructive font-mono mt-0.5">
                      Due {formatRelativeDate(app.followUpDate)} ({formatDate(app.followUpDate)})
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingId === app.id}
                      onClick={() => handleQuickExtend(app.id)}
                    >
                      +7 Days
                    </Button>
                    <Button
                      size="sm"
                      disabled={updatingId === app.id}
                      onClick={() => handleQuickStatus(app.id, "INTERVIEW_SCHEDULED")}
                    >
                      Interview
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Section */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground block">
            Upcoming (Next 7 Days)
          </span>

          {upcoming.length === 0 && overdue.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              No pending or overdue follow-ups.
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No upcoming follow-ups in the next 7 days.</p>
          ) : (
            <div className="space-y-1.5">
              {upcoming.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-2 rounded-md bg-card border"
                >
                  <div>
                    <Link
                      href={`/applications/${app.id}`}
                      className="font-medium text-foreground hover:underline text-xs"
                    >
                      {app.company} — <span className="text-muted-foreground">{app.position}</span>
                    </Link>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {formatRelativeDate(app.followUpDate)}
                    </p>
                  </div>
                  <Badge variant="secondary">{getStatusConfig(app.status).shortLabel}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}