"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { ArrowRight } from "lucide-react";
import { DashboardSummary } from "@/lib/types";

interface FunnelChartProps {
  funnel: DashboardSummary["funnel"];
}

export function FunnelChart({ funnel }: FunnelChartProps) {
  const stages = [
    {
      name: "Applied",
      count: funnel.applied,
      pctOfTotal: 100,
    },
    {
      name: "Responses",
      count: funnel.responses,
      conversionRate: funnel.conversionRates.appliedToResponse,
      conversionLabel: "of applied",
      pctOfTotal: funnel.applied > 0 ? Math.round((funnel.responses / funnel.applied) * 100) : 0,
    },
    {
      name: "Interviews",
      count: funnel.interviews,
      conversionRate: funnel.conversionRates.responseToInterview,
      conversionLabel: "of responses",
      pctOfTotal: funnel.applied > 0 ? Math.round((funnel.interviews / funnel.applied) * 100) : 0,
    },
    {
      name: "Offers",
      count: funnel.offers,
      conversionRate: funnel.conversionRates.interviewToOffer,
      conversionLabel: "of interviews",
      pctOfTotal: funnel.applied > 0 ? Math.round((funnel.offers / funnel.applied) * 100) : 0,
    },
  ];

  return (
    <Card className="h-full bg-zinc-900/50 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            Application conversion rates across pipeline stages
          </CardDescription>
        </div>
        <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-300">
          {funnel.conversionRates.overall}% Overall Conversion
        </span>
      </CardHeader>

      <CardContent className="pt-3 space-y-3.5">
        {stages.map((stage) => (
          <div key={stage.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-zinc-200">{stage.name}</span>
                {stage.conversionRate !== undefined && (
                  <span className="text-[11px] text-zinc-500">
                    ({stage.conversionRate}% {stage.conversionLabel})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="font-semibold text-zinc-100">{stage.count}</span>
                <span className="text-zinc-500 text-[10px]">({stage.pctOfTotal}%)</span>
              </div>
            </div>

            {/* Clean Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded bg-zinc-800/80">
              <div
                className="h-full bg-zinc-200 dark:bg-zinc-300 transition-all duration-300"
                style={{ width: `${Math.max(stage.pctOfTotal, stage.count > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
