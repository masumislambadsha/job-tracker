"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, Plus, LogOut, User, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserSession } from "@/lib/types";

interface HeaderProps {
  user: UserSession | null;
  onOpenQuickAdd: () => void;
  overdueCount?: number;
}

export function Header({ user, onOpenQuickAdd, overdueCount = 0 }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

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
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b bg-background px-4 sm:px-6">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block w-72">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search applications..."
            onFocus={() => router.push("/applications")}
            className="pl-8 text-xs"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={onOpenQuickAdd} size="sm">
          <Plus className="h-3.5 w-3.5" />
          <span>Add Job</span>
        </Button>

        {/* Notifications */}
        <Link
          href="/dashboard"
          className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={overdueCount > 0 ? `${overdueCount} follow-ups overdue` : "No overdue follow-ups"}
        >
          <Bell className="h-4 w-4" />
          {overdueCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Link>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-1.5 rounded-md p-1 text-foreground hover:bg-accent"
            >
              <Avatar className="h-6 w-6 rounded">
                <AvatarFallback className="text-[11px] font-bold bg-secondary">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium text-foreground">{user?.name || "Masum Badsha"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "badsha@jobdesk.app"}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="h-3.5 w-3.5" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive"
            >
              {isLoggingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}