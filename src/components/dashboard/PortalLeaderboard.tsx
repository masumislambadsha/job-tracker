"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardSummary } from "@/lib/types";

interface PortalLeaderboardProps {
  data: DashboardSummary["portalLeaderboard"];
}

export function PortalLeaderboard({ data }: PortalLeaderboardProps) {
  const [sortBy, setSortBy] = useState<"rate" | "count">("rate");

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "rate") {
      return b.responseRate - a.responseRate || b.appliedCount - a.appliedCount;
    }
    return b.appliedCount - a.appliedCount || b.responseRate - a.responseRate;
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Portal Conversion Leaderboard</CardTitle>
          <CardDescription>
            Performance and response rates by source portal
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy(sortBy === "rate" ? "count" : "rate")}
            className="rounded border bg-card px-2 py-1 text-[11px] text-foreground hover:bg-accent transition-colors"
          >
            Sort by: {sortBy === "rate" ? "Response %" : "Volume"}
          </button>
          <Link
            href="/portals"
            className="text-xs text-primary hover:underline font-medium"
          >
            All Portals →
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No applications linked to portals yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground">Portal</TableHead>
                <TableHead className="text-center text-muted-foreground">Tier</TableHead>
                <TableHead className="text-right font-mono text-muted-foreground">Applied</TableHead>
                <TableHead className="text-right font-mono text-muted-foreground">Responses</TableHead>
                <TableHead className="text-right font-mono text-muted-foreground">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, idx) => (
                <TableRow key={item.portalId} className="hover:bg-accent/50">
                  <TableCell className="font-medium text-foreground">
                    {idx + 1}. {item.portalName}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground font-mono text-[11px]">
                    {item.tier ? `T${item.tier}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {item.appliedCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {item.responseCount}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-foreground">
                    {item.responseRate}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}