"use client";

import React from "react";
import { StatusHistoryItem } from "@/lib/types";
import { formatDate, formatRelativeDate, getStatusConfig } from "@/lib/utils";
import { Clock, ArrowRight, CheckCircle, ShieldAlert } from "lucide-react";

interface StatusHistoryTimelineProps {
  history?: StatusHistoryItem[];
}

export function StatusHistoryTimeline({ history = [] }: StatusHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground italic">
        No status history recorded yet.
      </div>
    );
  }

  // Sort ascending for chronological timeline flow
  const sorted = [...history].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {sorted.map((item, idx) => {
        const toConfig = getStatusConfig(item.toStatus);
        const fromConfig = item.fromStatus ? getStatusConfig(item.fromStatus) : null;
        const isLatest = idx === sorted.length - 1;

        return (
          <div key={item.id} className="relative group">
            {/* Timeline bullet dot */}
            <div
              className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                isLatest
                  ? "bg-primary border-primary text-primary-foreground shadow-sm"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  isLatest ? "bg-primary-foreground animate-ping" : "bg-muted-foreground"
                }`}
              />
            </div>

            {/* Event Card */}
            <div
              className={`rounded-xl border p-3.5 transition-all ${
                isLatest
                  ? "border-primary/40 bg-accent"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {fromConfig && (
                    <>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold border ${fromConfig.bgColor} ${fromConfig.color} ${fromConfig.borderColor}`}
                      >
                        {fromConfig.shortLabel}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </>
                  )}
                  <span
                    className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold border ${toConfig.bgColor} ${toConfig.color} ${toConfig.borderColor}`}
                  >
                    {toConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeDate(item.changedAt)}</span>
                </div>
              </div>

              <div className="mt-1.5 text-[11px] text-muted-foreground">
                Transition recorded on <span className="text-foreground">{formatDate(item.changedAt, "PPP 'at' p")}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}