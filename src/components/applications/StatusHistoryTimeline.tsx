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
      <div className="py-6 text-center text-xs text-slate-500 italic">
        No status history recorded yet.
      </div>
    );
  }

  // Sort ascending for chronological timeline flow
  const sorted = [...history].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
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
                  ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-500/30"
                  : "bg-slate-900 border-slate-700 text-slate-400"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  isLatest ? "bg-white animate-ping" : "bg-slate-400"
                }`}
              />
            </div>

            {/* Event Card */}
            <div
              className={`rounded-xl border p-3.5 transition-all ${
                isLatest
                  ? "border-indigo-500/40 bg-indigo-950/20"
                  : "border-slate-800 bg-slate-900/60"
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
                      <ArrowRight className="h-3 w-3 text-slate-500" />
                    </>
                  )}
                  <span
                    className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold border ${toConfig.bgColor} ${toConfig.color} ${toConfig.borderColor}`}
                  >
                    {toConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span>{formatRelativeDate(item.changedAt)}</span>
                </div>
              </div>

              <div className="mt-1.5 text-[11px] text-slate-400">
                Transition recorded on <span className="text-slate-300">{formatDate(item.changedAt, "PPP 'at' p")}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
