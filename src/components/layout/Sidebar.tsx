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
import { Button } from "@/components/ui/button";

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

  const renderNavLink = (item: (typeof navigation)[number], showBadge: boolean) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          item.current
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={cn("h-4 w-4", item.current ? "text-foreground" : "text-muted-foreground")} />
          <span>{item.name}</span>
        </div>
        {showBadge && item.badge !== undefined && (
          <span className="rounded-full bg-destructive/15 border border-destructive/30 px-1.5 py-0 text-[10px] font-semibold text-destructive">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col fixed inset-y-0 z-30 border-r bg-background">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xs">
            <Briefcase className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">JobDesk</span>
        </Link>
      </div>

      {/* Quick Add CTA */}
      <div className="px-3 py-3">
        <Button onClick={onOpenQuickAdd} className="w-full justify-center gap-1.5 h-8 text-sm font-medium">
          <Plus className="h-3.5 w-3.5" />
          <span>New Application</span>
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-0.5 px-2 py-1 overflow-y-auto">
        <div className="px-2 pb-1.5 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {navigation.slice(0, 4).map((item) => renderNavLink(item, true))}

        <div className="px-2 pb-1.5 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resources
        </div>
        {navigation.slice(4).map((item) => renderNavLink(item, false))}
      </nav>
    </aside>
  );
}