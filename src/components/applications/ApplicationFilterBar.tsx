"use client";

import React from "react";
import { Search, X, ArrowUpDown } from "lucide-react";
import { STATUS_PIPELINE, JOB_TYPE_OPTIONS, JOB_NATURE_OPTIONS } from "@/lib/constants";
import { PortalItem } from "@/lib/types";

interface FilterState {
  search: string;
  status: string;
  jobType: string;
  jobNature: string;
  portalId: string;
  priority: string;
  tag: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface ApplicationFilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  portals: PortalItem[];
  availableTags: string[];
}

export function ApplicationFilterBar({
  filters,
  onChange,
  portals,
  availableTags,
}: ApplicationFilterBarProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.jobType) ||
    Boolean(filters.jobNature) ||
    Boolean(filters.portalId) ||
    Boolean(filters.priority) ||
    Boolean(filters.tag);

  const resetFilters = () => {
    onChange({
      ...filters,
      search: "",
      status: "",
      jobType: "",
      jobNature: "",
      portalId: "",
      priority: "",
      tag: "",
    });
  };

  return (
    <div className="space-y-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      {/* Top Row: Search + Sort controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by company, position, notes, location..."
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 pl-8 pr-7 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5">
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
          >
            <option value="dateApplied">Sort: Date Applied</option>
            <option value="company">Sort: Company</option>
            <option value="priority">Sort: Priority</option>
            <option value="followUpDate">Sort: Follow-up</option>
          </select>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...filters,
                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
              })
            }
            className="flex items-center justify-center h-8 w-8 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title={`Order: ${filters.sortOrder === "asc" ? "Ascending" : "Descending"}`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns Row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 pt-2 border-t border-zinc-800/80">
        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {STATUS_PIPELINE.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Job Type */}
        <select
          value={filters.jobType}
          onChange={(e) => onChange({ ...filters, jobType: e.target.value })}
          className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
        >
          <option value="">All Workplaces</option>
          {JOB_TYPE_OPTIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Job Nature */}
        <select
          value={filters.jobNature}
          onChange={(e) => onChange({ ...filters, jobNature: e.target.value })}
          className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
        >
          <option value="">All Types</option>
          {JOB_NATURE_OPTIONS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>

        {/* Portal */}
        <select
          value={filters.portalId}
          onChange={(e) => onChange({ ...filters, portalId: e.target.value })}
          className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
        >
          <option value="">All Portals</option>
          {portals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value })}
          className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="5">⭐⭐⭐⭐⭐ (5)</option>
          <option value="4">⭐⭐⭐⭐ (4)</option>
          <option value="3">⭐⭐⭐ (3)</option>
          <option value="2">⭐⭐ (2)</option>
          <option value="1">⭐ (1)</option>
        </select>

        {/* Tag */}
        <select
          value={filters.tag}
          onChange={(e) => onChange({ ...filters, tag: e.target.value })}
          className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
        >
          <option value="">All Tags</option>
          {availableTags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
