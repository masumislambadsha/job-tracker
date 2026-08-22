"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { QuickAddModal } from "../applications/QuickAddModal";
import { UserSession } from "@/lib/types";

interface AppShellProps {
  user: UserSession | null;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  // Fetch count of overdue follow-ups
  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data?.overdueFollowUps && Array.isArray(data.overdueFollowUps)) {
          setOverdueCount(data.overdueFollowUps.length);
        }
      })
      .catch((err) => console.error("Error loading dashboard metrics:", err));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      {/* Desktop Sidebar */}
      <Sidebar
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        overdueCount={overdueCount}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-60">
        <Header
          user={user}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          overdueCount={overdueCount}
        />

        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Persistent Global Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
}
