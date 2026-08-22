import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isPast, isToday, isTomorrow, formatDistanceToNow, parseISO } from "date-fns";
import { STATUS_PIPELINE } from "./constants";
import { ApplicationStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | Date | null, formatStr: string = "MMM d, yyyy"): string {
  if (!dateString) return "—";
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(date, formatStr);
  } catch {
    return "Invalid date";
  }
}

export function formatRelativeDate(dateString?: string | Date | null): string {
  if (!dateString) return "—";
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "—";
  }
}

export function isDateOverdue(dateString?: string | Date | null, status?: string): boolean {
  if (!dateString) return false;
  // Terminal statuses are not overdue
  if (status === "REJECTED" || status === "GHOSTED" || status === "WITHDRAWN" || status === "OFFER") {
    return false;
  }
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return isPast(date) && !isToday(date);
  } catch {
    return false;
  }
}

export function formatCurrency(
  amount?: number | null,
  currency: string = "USD",
  maximumFractionDigits: number = 0
): string {
  if (amount === undefined || amount === null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits,
    }).format(amount);
  } catch {
    return `${currency || "$"} ${amount.toLocaleString()}`;
  }
}

export function formatSalaryRange(
  min?: number | null,
  max?: number | null,
  currency: string = "USD"
): string {
  if (!min && !max) return "—";
  if (min && max) {
    return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
  }
  if (min) return `From ${formatCurrency(min, currency)}`;
  if (max) return `Up to ${formatCurrency(max, currency)}`;
  return "—";
}

export function getStatusConfig(status: ApplicationStatus | string) {
  const found = STATUS_PIPELINE.find((s) => s.id === status);
  if (found) return found;
  return {
    id: status as ApplicationStatus,
    label: status.replace(/_/g, " "),
    shortLabel: status.replace(/_/g, " "),
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    columnOrder: 99,
  };
}

export function calculatePercentage(part: number, total: number): number {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
}
