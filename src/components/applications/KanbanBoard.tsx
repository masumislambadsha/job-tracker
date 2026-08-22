"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { ApplicationItem, ApplicationStatus } from "@/lib/types";
import { Tabs } from "../ui/Tabs";

interface KanbanBoardProps {
  applications: ApplicationItem[];
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onOpenQuickAddWithStatus?: (status: string) => void;
}

const KANBAN_STAGES = [
  { id: "WISHLIST", label: "Wishlist", statuses: ["WISHLIST"] },
  { id: "APPLIED", label: "Applied", statuses: ["APPLIED"] },
  { id: "OA_ASSESSMENT", label: "Assessment / OA", statuses: ["OA_ASSESSMENT"] },
  { id: "INTERVIEW_SCHEDULED", label: "Interview", statuses: ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED"] },
  { id: "OFFER", label: "Offer", statuses: ["OFFER"] },
  { id: "REJECTED", label: "Closed / Rejected", statuses: ["REJECTED", "GHOSTED", "WITHDRAWN"] },
];

export function KanbanBoard({
  applications,
  onStatusChange,
  onOpenQuickAddWithStatus,
}: KanbanBoardProps) {
  const [activeApplication, setActiveApplication] = useState<ApplicationItem | null>(null);
  const [mobileActiveStage, setMobileActiveStage] = useState<string>("APPLIED");

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const app = applications.find((a) => a.id === active.id);
    if (app) {
      setActiveApplication(app);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApplication(null);

    if (!over) return;

    const appId = active.id as string;
    const targetStageId = over.id as string;

    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const targetStage = KANBAN_STAGES.find((s) => s.id === targetStageId);
    if (!targetStage) return;

    const newStatus = targetStage.statuses[0] as ApplicationStatus;

    if (app.status !== newStatus) {
      onStatusChange(appId, newStatus);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Stage Switcher */}
      <div className="block lg:hidden overflow-x-auto pb-1">
        <Tabs
          tabs={KANBAN_STAGES.map((stage) => ({
            id: stage.id,
            label: stage.label,
            count: applications.filter((a) => stage.statuses.includes(a.status)).length,
          }))}
          activeTab={mobileActiveStage}
          onChange={setMobileActiveStage}
          className="w-max"
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Desktop Kanban */}
        <div className="hidden lg:grid grid-cols-6 gap-3 items-start">
          {KANBAN_STAGES.map((stage) => {
            const stageApps = applications.filter((a) => stage.statuses.includes(a.status));
            return (
              <KanbanColumn
                key={stage.id}
                id={stage.id}
                label={stage.label}
                applications={stageApps}
                onAddClick={() => onOpenQuickAddWithStatus?.(stage.statuses[0])}
              />
            );
          })}
        </div>

        {/* Mobile Kanban */}
        <div className="block lg:hidden">
          {KANBAN_STAGES.filter((s) => s.id === mobileActiveStage).map((stage) => {
            const stageApps = applications.filter((a) => stage.statuses.includes(a.status));
            return (
              <KanbanColumn
                key={stage.id}
                id={stage.id}
                label={stage.label}
                applications={stageApps}
                onAddClick={() => onOpenQuickAddWithStatus?.(stage.statuses[0])}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeApplication ? (
            <div className="opacity-90">
              <KanbanCard application={activeApplication} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
