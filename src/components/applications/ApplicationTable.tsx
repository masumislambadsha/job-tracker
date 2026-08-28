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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const handleStatusSelect = async (newStatus: ApplicationStatus, app: ApplicationItem) => {
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

  const handleDeleteClick = async (id: string, company: string) => {
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
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Briefcase className="h-8 w-8 text-muted-foreground mb-2" />
        <h3 className="text-sm font-semibold">No applications found</h3>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
          Try adjusting your search filters or click &quot;New Application&quot; to log a job.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border bg-muted/50">
            <TableHead className="sticky left-0 z-10 bg-muted/50 min-w-[170px]">Company</TableHead>
            <TableHead className="min-w-[150px]">Position</TableHead>
            <TableHead className="min-w-[140px]">Status</TableHead>
            <TableHead className="min-w-[100px] font-mono">Date</TableHead>
            <TableHead className="min-w-[120px]">Follow-up</TableHead>
            <TableHead className="min-w-[120px]">Source</TableHead>
            <TableHead className="min-w-[90px]">Priority</TableHead>
            <TableHead className="min-w-[110px] font-mono">Salary</TableHead>
            <TableHead className="text-right min-w-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => {
            const statusConfig = getStatusConfig(app.status);
            const overdue = isDateOverdue(app.followUpDate, app.status);

            return (
              <TableRow
                key={app.id}
                onClick={() => router.push(`/applications/${app.id}`)}
                className="cursor-pointer hover:bg-accent/50"
              >
                {/* Sticky Company Column */}
                <TableCell className="sticky left-0 z-10 bg-card group-hover:bg-accent/90 font-semibold">
                  <span className="block truncate text-foreground group-hover:underline">
                    {app.company}
                  </span>
                  {app.companyLocation && (
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {app.companyLocation}
                    </span>
                  )}
                </TableCell>

                {/* Position */}
                <TableCell className="text-muted-foreground">
                  <span className="truncate block max-w-[200px]">{app.position}</span>
                </TableCell>

                {/* Status Inline Dropdown */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={app.status}
                    onValueChange={(v) => handleStatusSelect(v as ApplicationStatus, app)}
                    disabled={updatingId === app.id}
                  >
                    <SelectTrigger className="h-7 w-[150px] text-[11px] font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_PIPELINE.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Date Applied */}
                <TableCell className="text-muted-foreground font-mono text-[11px]">
                  {formatDate(app.dateApplied, "yyyy-MM-dd")}
                </TableCell>

                {/* Follow-up Date */}
                <TableCell>
                  {app.followUpDate ? (
                    <span
                      className={cn(
                        "text-[11px] font-mono",
                        overdue ? "text-destructive font-bold" : "text-muted-foreground"
                      )}
                    >
                      {formatDate(app.followUpDate, "MMM d")}
                      {overdue && " (Overdue)"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                {/* Portal */}
                <TableCell className="text-muted-foreground text-xs">
                  {app.portal?.name || app.howApplied || "—"}
                </TableCell>

                {/* Priority */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handlePrioritySelect(star, app)}
                        className="text-muted-foreground/30 hover:text-foreground"
                      >
                        <Star
                          className={cn(
                            "h-3 w-3",
                            star <= (app.priority || 0)
                              ? "fill-foreground text-foreground"
                              : ""
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </TableCell>

                {/* Salary */}
                <TableCell className="text-muted-foreground font-mono text-[11px]">
                  {formatSalaryRange(app.salaryMin, app.salaryMax, app.currency || "USD")}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {app.jobLink && (
                      <a
                        href={app.jobLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                        title="Open job link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteClick(app.id, app.company)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}