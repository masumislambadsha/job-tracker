"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Plus,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "../ui/Button";
import { UserSession } from "@/lib/types";

interface HeaderProps {
  user: UserSession | null;
  onOpenQuickAdd: () => void;
  overdueCount?: number;
}

export function Header({ user, onOpenQuickAdd, overdueCount = 0 }: HeaderProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block w-72">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search applications..."
            onFocus={() => router.push("/applications")}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 pl-8 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onOpenQuickAdd}
          size="sm"
          variant="primary"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          <span>Add Job</span>
        </Button>

        {/* Notifications */}
        <Link
          href="/dashboard"
          className="relative rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
          title={overdueCount > 0 ? `${overdueCount} follow-ups overdue` : "No overdue follow-ups"}
        >
          <Bell className="h-4 w-4" />
          {overdueCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Link>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 rounded-md p-1 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-300 text-[11px] font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-zinc-800 bg-zinc-900 shadow-lg p-1 z-50">
                <div className="px-2.5 py-2 border-b border-zinc-800">
                  <p className="text-xs font-medium text-zinc-200">{user?.name || "Masum Badsha"}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user?.email || "badsha@jobdesk.app"}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-zinc-800">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
