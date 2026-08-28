"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TableProperties,
  KanbanSquare,
  Globe2,
  CalendarDays,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "Table",
      href: "/applications",
      icon: TableProperties,
      current: pathname === "/applications",
    },
    {
      name: "Kanban",
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
      name: "Portals",
      href: "/portals",
      icon: Globe2,
      current: pathname === "/portals",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t bg-background/90 px-2 backdrop-blur-xl md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl p-1.5 min-w-[56px] transition-colors",
              item.current
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", item.current && "text-foreground")} />
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}