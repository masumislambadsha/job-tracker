"use client";

import React from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationItem } from "@/lib/types";
import { formatDate, formatSalaryRange, isDateOverdue } from "@/lib/utils";
import { GripVertical, Clock, Star } from "lucide-react";

interface KanbanCardProps {
  application: ApplicationItem;
}

export function KanbanCard({ application }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  const overdue = isDateOverdue(application.followUpDate, application.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-md border bg-card p-3 shadow-sm transition-colors ${
        isDragging
          ? "border-primary bg-accent shadow-md"
          : "border-border hover:border-muted-foreground/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground p-0.5"
            title="Drag card"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <Link
            href={`/applications/${application.id}`}
            className="font-semibold text-xs text-foreground hover:underline truncate"
          >
            {application.company}
          </Link>
        </div>

        {application.priority ? (
          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-foreground text-foreground" />
            {application.priority}
          </span>
        ) : null}
      </div>

      {/* Position */}
      <p className="mt-1 text-xs text-muted-foreground pl-5 line-clamp-1">
        {application.position}
      </p>

      {/* Bottom Info */}
      <div className="mt-2 pl-5 flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1.5 border-t">
        <span>{formatDate(application.dateApplied, "MMM d")}</span>

        {application.followUpDate && (
          <span className={overdue ? "text-destructive font-semibold" : "text-muted-foreground"}>
            {overdue ? "Overdue" : `Follow-up: ${formatDate(application.followUpDate, "MMM d")}`}
          </span>
        )}
      </div>
    </div>
  );
}