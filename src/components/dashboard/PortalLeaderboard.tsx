"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
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
    <Card className="h-full bg-zinc-900/50 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Portal Conversion Leaderboard</CardTitle>
          <CardDescription>
            Performance and response rates by source portal
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy(sortBy === "rate" ? "count" : "rate")}
            className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Sort by: {sortBy === "rate" ? "Response %" : "Volume"}
          </button>
          <Link
            href="/portals"
            className="text-xs text-zinc-400 hover:text-zinc-200 font-medium"
          >
            All Portals →
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No applications linked to portals yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <th className="pb-2 font-medium">Portal</th>
                  <th className="pb-2 font-medium text-center">Tier</th>
                  <th className="pb-2 font-medium text-right font-mono">Applied</th>
                  <th className="pb-2 font-medium text-right font-mono">Responses</th>
                  <th className="pb-2 font-medium text-right font-mono">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sortedData.map((item, idx) => (
                  <tr key={item.portalId} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2 font-medium text-zinc-200">
                      {idx + 1}. {item.portalName}
                    </td>
                    <td className="py-2 text-center text-zinc-400 font-mono text-[11px]">
                      {item.tier ? `T${item.tier}` : "—"}
                    </td>
                    <td className="py-2 text-right font-mono text-zinc-300">
                      {item.appliedCount}
                    </td>
                    <td className="py-2 text-right font-mono text-zinc-300">
                      {item.responseCount}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold text-zinc-100">
                      {item.responseRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
