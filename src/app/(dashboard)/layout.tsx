import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = await getCurrentUser();
  if (!user) {
    user = await getOrCreateDefaultUser();
  }

  return <AppShell user={user}>{children}</AppShell>;
}
