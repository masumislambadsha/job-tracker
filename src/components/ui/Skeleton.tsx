import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded bg-zinc-800/70 skeleton-shimmer",
        className
      )}
      {...props}
    />
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-3 w-80 max-w-full" />
      </div>
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-[74px] rounded-md" />
        <Skeleton className="h-8 w-[104px] rounded-md" />
        <Skeleton className="h-8 w-[120px] rounded-md" />
      </div>
    </div>
  );
}

export function MetricsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3.5"
        >
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-2 h-5 w-10" />
          <Skeleton className="mt-1.5 h-2 w-14" />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({
  className,
  contentClassName,
}: {
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/40 p-4",
        className
      )}
    >
      <Skeleton className="h-3 w-28" />
      <div className={cn("mt-4", contentClassName)}>
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <MetricsGridSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelSkeleton contentClassName="h-56" />
        <PanelSkeleton contentClassName="h-56" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelSkeleton contentClassName="h-40" />
        <PanelSkeleton contentClassName="h-40" />
      </div>
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-6">
        <Skeleton className="h-7 rounded-md" />
        <Skeleton className="h-7 rounded-md" />
        <Skeleton className="h-7 hidden rounded-md lg:block" />
        <Skeleton className="h-7 hidden rounded-md md:block" />
        <Skeleton className="h-7 hidden rounded-md md:block" />
        <Skeleton className="h-7 hidden rounded-md md:block" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 9 }: { rows?: number }) {
  const widths = ["72%", "58%", "64%", "49%", "68%", "55%", "61%", "47%", "66%"];
  return (
    <div className="space-y-3">
      <FilterBarSkeleton />
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <div className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="hidden h-2.5 w-20 md:block" />
          <Skeleton className="hidden h-2.5 w-16 lg:block" />
          <Skeleton className="ml-auto h-2.5 w-14" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-4 px-3 py-2.5",
              i !== rows - 1 && "border-b border-zinc-800/60"
            )}
          >
            <Skeleton className="h-3.5 w-8 shrink-0" />
            <Skeleton
              className="h-3.5"
              style={{ width: widths[i % widths.length] }}
            />
            <Skeleton className="ml-auto h-4 w-16 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-12 shrink-0 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {[4, 3, 5, 2, 3, 1].map((cards, col) => (
        <div
          key={col}
          className="flex flex-col items-start rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-2.5"
        >
          <div className="mb-2 flex w-full items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3.5 w-5 rounded-sm" />
            </div>
          </div>
          <div className="w-full space-y-2">
            {Array.from({ length: cards }).map((_, i) => (
              <div
                key={i}
                className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5"
              >
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
                <div className="flex items-center gap-1.5 pt-0.5">
                  <Skeleton className="h-3.5 w-14 rounded-full" />
                  <Skeleton className="h-3.5 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  const eventCells = new Set([9, 11, 15, 18, 22, 25, 29, 32]);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6 lg:col-span-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2.5 w-44" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-14 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px border-b border-zinc-800/60 pb-2 pt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="mx-auto h-2.5 w-7" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 pt-2 sm:gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[84px] rounded-md border border-transparent p-1.5"
            >
              {eventCells.has(i) ? (
                <div className="space-y-1">
                  <Skeleton className="h-1.5 w-4 opacity-50" />
                  <Skeleton className="h-8 w-full rounded-sm" />
                </div>
              ) : (
                <Skeleton className="h-1.5 w-3 opacity-40" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <PanelSkeleton contentClassName="h-24" />
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <Skeleton className="h-3 w-24" />
          <div className="mt-4 space-y-2.5">
            {[80, 65, 72].map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-md border border-zinc-800/70 p-2"
              >
                <Skeleton className="h-6 w-6 shrink-0 rounded-sm" />
                <Skeleton
                  className="h-3"
                  style={{ width: `${w}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardsGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-3.5"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
              <Skeleton className="h-3.5 w-10 rounded-full" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 rounded border border-zinc-800/80 bg-zinc-950 p-2 text-center">
              <div className="space-y-1">
                <Skeleton className="mx-auto h-2 w-8" />
                <Skeleton className="mx-auto h-2.5 w-5" />
              </div>
              <div className="space-y-1">
                <Skeleton className="mx-auto h-2 w-8" />
                <Skeleton className="mx-auto h-2.5 w-5" />
              </div>
              <div className="space-y-1">
                <Skeleton className="mx-auto h-2 w-8" />
                <Skeleton className="mx-auto h-2.5 w-5" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2.5">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
            <Skeleton className="h-3 w-24" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <PanelSkeleton contentClassName="h-32" />
        </div>
        <div className="space-y-4">
          <PanelSkeleton contentClassName="h-36" />
          <PanelSkeleton contentClassName="h-48" />
        </div>
      </div>
    </div>
  );
}
