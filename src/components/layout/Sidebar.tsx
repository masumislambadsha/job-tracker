"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TableProperties,
  KanbanSquare,
  CalendarDays,
  Globe2,
  FileText,
  Settings,
  Plus,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";

interface SidebarProps {
  onOpenQuickAdd: () => void;
  overdueCount?: number;
}

export function Sidebar({ onOpenQuickAdd, overdueCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "Applications",
      href: "/applications",
      icon: TableProperties,
      current: pathname === "/applications",
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    {
      name: "Pipeline Board",
      href: "/applications/board",
      icon: KanbanSquare,
      current: pathname === "/applications/board",
    },
    {
      name: "Calendar",
      href: "/applications/calendar",
      icon: CalendarDays,
      current: pathname === "/applications/calendar",
    },
    {
      name: "Job Portals",
      href: "/portals",
      icon: Globe2,
      current: pathname === "/portals",
    },
    {
      name: "Resume Versions",
      href: "/resumes",
      icon: FileText,
      current: pathname === "/resumes",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      current: pathname === "/settings",
    },
  ];

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col fixed inset-y-0 z-30 border-r border-zinc-800 bg-zinc-950">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-100 text-zinc-900 font-bold text-xs">
            <Briefcase className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">JobDesk</span>
        </Link>
      </div>

      {/* Quick Add CTA */}
      <div className="px-3 py-3">
        <Button
          onClick={onOpenQuickAdd}
          variant="primary"
          className="w-full justify-center gap-1.5 h-8 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Application</span>
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-0.5 px-2 py-1 overflow-y-auto">
        <div className="px-2 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Workspace
        </div>
        {navigation.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                item.current
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("h-4 w-4", item.current ? "text-zinc-100" : "text-zinc-400")} />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span className="rounded bg-red-950/80 border border-red-800/40 px-1.5 py-0 text-[10px] font-semibold text-red-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="px-2 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Resources
        </div>
        {navigation.slice(4).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                item.current
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("h-4 w-4", item.current ? "text-zinc-100" : "text-zinc-400")} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
