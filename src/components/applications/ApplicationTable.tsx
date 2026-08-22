"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApplicationItem, ApplicationStatus } from "@/lib/types";
import { STATUS_PIPELINE } from "@/lib/constants";
import {
  formatDate,
  formatRelativeDate,
  formatSalaryRange,
  getStatusConfig,
  isDateOverdue,
} from "@/lib/utils";
import { Badge } from "../ui/Badge";
import {
  ExternalLink,
  Star,
  Trash2,
  AlertCircle,
  Briefcase,
} from "lucide-react";

interface ApplicationTableProps {
  applications: ApplicationItem[];
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: ApplicationStatus) => void;
  onPriorityChange?: (id: string, newPriority: number) => void;
}

export function ApplicationTable({
  applications,
  onDelete,
  onStatusChange,
  onPriorityChange,
}: ApplicationTableProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>, app: ApplicationItem) => {
    e.stopPropagation();
    const newStatus = e.target.value as ApplicationStatus;
    if (newStatus === app.status) return;

    try {
      setUpdatingId(app.id);
      if (onStatusChange) {
        onStatusChange(app.id, newStatus);
      } else {
        await fetch(`/api/applications/${app.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        router.refresh();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrioritySelect = async (newPriority: number, app: ApplicationItem) => {
    try {
      setUpdatingId(app.id);
      if (onPriorityChange) {
        onPriorityChange(app.id, newPriority);
      } else {
        await fetch(`/api/applications/${app.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority: newPriority }),
        });
        router.refresh();
      }
    } catch (err) {
      console.error("Error updating priority:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string, company: string) => {
    e.stopPropagation();
    if (!confirm(`Delete application for ${company}?`)) return;

    try {
      if (onDelete) {
        onDelete(id);
      } else {
        await fetch(`/api/applications/${id}`, { method: "DELETE" });
        router.refresh();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950 p-12 text-center">
        <Briefcase className="h-8 w-8 text-zinc-600 mb-2" />
        <h3 className="text-xs font-semibold text-zinc-300">No applications found</h3>
        <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs">
          Try adjusting your search filters or click &quot;New Application&quot; to log a job.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-medium">
              <th className="sticky left-0 z-10 bg-zinc-900 px-3.5 py-2.5 font-medium min-w-[170px] shadow-[1px_0_0_0_#27272a]">
                Company
              </th>
              <th className="px-3 py-2.5 font-medium min-w-[150px]">Position</th>
              <th className="px-3 py-2.5 font-medium min-w-[140px]">Status</th>
              <th className="px-3 py-2.5 font-medium min-w-[100px] font-mono">Date</th>
              <th className="px-3 py-2.5 font-medium min-w-[120px]">Follow-up</th>
              <th className="px-3 py-2.5 font-medium min-w-[120px]">Source</th>
              <th className="px-3 py-2.5 font-medium min-w-[90px]">Priority</th>
              <th className="px-3 py-2.5 font-medium min-w-[110px] font-mono">Salary</th>
              <th className="px-3 py-2.5 font-medium text-right min-w-[60px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {applications.map((app) => {
              const statusConfig = getStatusConfig(app.status);
              const overdue = isDateOverdue(app.followUpDate, app.status);

              return (
                <tr
                  key={app.id}
                  onClick={() => router.push(`/applications/${app.id}`)}
                  className="group cursor-pointer hover:bg-zinc-900/50 transition-colors"
                >
                  {/* Sticky Company Column */}
                  <td className="sticky left-0 z-10 bg-zinc-950 group-hover:bg-zinc-900/90 px-3.5 py-2.5 shadow-[1px_0_0_0_#27272a]">
                    <span className="font-semibold text-zinc-100 group-hover:underline block truncate">
                      {app.company}
                    </span>
                    {app.companyLocation && (
                      <span className="text-[10px] text-zinc-500 block truncate">
                        {app.companyLocation}
                      </span>
                    )}
                  </td>

                  {/* Position */}
                  <td className="px-3 py-2.5 text-zinc-300">
                    <span className="truncate block max-w-[200px]">{app.position}</span>
                  </td>

                  {/* Status Inline Dropdown */}
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusSelect(e, app)}
                      disabled={updatingId === app.id}
                      className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-200 focus:border-zinc-600 focus:outline-none"
                    >
                      {STATUS_PIPELINE.map((s) => (
                        <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-200">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Date Applied */}
                  <td className="px-3 py-2.5 text-zinc-400 font-mono text-[11px]">
                    {formatDate(app.dateApplied, "yyyy-MM-dd")}
                  </td>

                  {/* Follow-up Date */}
                  <td className="px-3 py-2.5">
                    {app.followUpDate ? (
                      <span
                        className={`text-[11px] font-mono ${
                          overdue ? "text-red-400 font-bold" : "text-zinc-400"
                        }`}
                      >
                        {formatDate(app.followUpDate, "MMM d")}
                        {overdue && " (Overdue)"}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Portal */}
                  <td className="px-3 py-2.5 text-zinc-400 text-xs">
                    {app.portal?.name || app.howApplied || "—"}
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handlePrioritySelect(star, app)}
                          className="text-zinc-700 hover:text-zinc-300"
                        >
                          <Star
                            className={`h-3 w-3 ${
                              star <= (app.priority || 0)
                                ? "fill-zinc-300 text-zinc-300"
                                : "text-zinc-800"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Salary */}
                  <td className="px-3 py-2.5 text-zinc-400 font-mono text-[11px]">
                    {formatSalaryRange(app.salaryMin, app.salaryMax, app.currency || "USD")}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {app.jobLink && (
                        <a
                          href={app.jobLink}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1 text-zinc-500 hover:text-zinc-200"
                          title="Open job link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={(e) => handleDeleteClick(e, app.id, app.company)}
                        className="rounded p-1 text-zinc-500 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
