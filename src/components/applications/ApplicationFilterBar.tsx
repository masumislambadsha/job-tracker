"use client";

import React from "react";
import { format } from "date-fns";
import { Search, X, ArrowUpDown, CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { STATUS_PIPELINE, JOB_TYPE_OPTIONS, JOB_NATURE_OPTIONS } from "@/lib/constants";
import { PortalItem } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface ApplicationFilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  portals: PortalItem[];
}

export function ApplicationFilterBar({
  filters,
  onChange,
  portals,
}: ApplicationFilterBarProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.jobType) ||
    Boolean(filters.jobNature) ||
    Boolean(filters.portalId) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo);

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
      dateFrom: "",
      dateTo: "",
    });
  };

  const dateRange: DateRange | undefined =
    filters.dateFrom && filters.dateTo
      ? { from: new Date(filters.dateFrom), to: new Date(filters.dateTo) }
      : filters.dateFrom
        ? { from: new Date(filters.dateFrom) }
        : undefined;

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onChange({
      ...filters,
      dateFrom: range?.from ? format(range.from, "yyyy-MM-dd") : "",
      dateTo: range?.to ? format(range.to, "yyyy-MM-dd") : "",
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 pt-2 border-t">
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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-range"
              variant="outline"
              className="justify-start text-left font-normal w-full data-[empty=true]:text-muted-foreground"
              data-empty={!dateRange?.from}
            >
              <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d")} -{" "}
                    {format(dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                <span className="truncate">Date Applied</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}