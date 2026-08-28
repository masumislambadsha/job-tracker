"use client";

import React from "react";
import { Search, X, ArrowUpDown } from "lucide-react";
import { STATUS_PIPELINE, JOB_TYPE_OPTIONS, JOB_NATURE_OPTIONS } from "@/lib/constants";
import { PortalItem } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value === "__all" ? "" : value });
  };

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
    <div className="space-y-2.5 rounded-lg border bg-card p-3">
      {/* Top Row: Search + Sort controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by company, position, notes, location..."
            className="pl-8 pr-7"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5">
          <Select
            value={filters.sortBy}
            onValueChange={(v) => onChange({ ...filters, sortBy: v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateApplied">Sort: Date Applied</SelectItem>
              <SelectItem value="company">Sort: Company</SelectItem>
              <SelectItem value="priority">Sort: Priority</SelectItem>
              <SelectItem value="followUpDate">Sort: Follow-up</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              onChange({
                ...filters,
                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
              })
            }
            title={`Order: ${filters.sortOrder === "asc" ? "Ascending" : "Descending"}`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns Row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 pt-2 border-t">
        <Select
          value={filters.status}
          onValueChange={(v) => update("status", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Statuses</SelectItem>
            {STATUS_PIPELINE.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.jobType}
          onValueChange={(v) => update("jobType", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Workplaces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Workplaces</SelectItem>
            {JOB_TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.jobNature}
          onValueChange={(v) => update("jobNature", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Types</SelectItem>
            {JOB_NATURE_OPTIONS.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.portalId}
          onValueChange={(v) => update("portalId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Portals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Portals</SelectItem>
            {portals.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority}
          onValueChange={(v) => update("priority", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Priorities</SelectItem>
            <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
            <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
            <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
            <SelectItem value="2">⭐⭐ (2)</SelectItem>
            <SelectItem value="1">⭐ (1)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.tag}
          onValueChange={(v) => update("tag", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Tags</SelectItem>
            {availableTags.map((t) => (
              <SelectItem key={t} value={t}>
                #{t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}