"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./KanbanCard";
import { ApplicationItem } from "@/lib/types";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
  id: string;
  label: string;
  applications: ApplicationItem[];
  onAddClick?: () => void;
}

export function KanbanColumn({
  id,
  label,
  applications,
  onAddClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { status: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border transition-colors min-w-[240px] w-full flex-1 bg-card/50 p-2.5 ${
        isOver ? "border-primary bg-accent/60" : "border-border"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-foreground">{label}</h3>
          <span className="rounded bg-secondary px-1.5 py-0 text-[10px] font-mono text-muted-foreground">
            {applications.length}
          </span>
        </div>

        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title={`Add to ${label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)] min-h-[100px]">
        {applications.map((app) => (
          <KanbanCard key={app.id} application={app} />
        ))}

        {applications.length === 0 && (
          <div className="flex h-16 items-center justify-center rounded border border-dashed border-border text-center text-[11px] text-muted-foreground">
            Empty
          </div>
        )}
      </div>
    </div>
  );
}