"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
          <CardDescription>
            Application conversion rates across pipeline stages
          </CardDescription>
        </div>
        <span className="rounded border bg-card px-2 py-0.5 text-xs font-medium text-foreground">
          {funnel.conversionRates.overall}% Overall Conversion
        </span>
      </CardHeader>

      <CardContent className="pt-3 space-y-3.5">
        {stages.map((stage) => (
          <div key={stage.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{stage.name}</span>
                {stage.conversionRate !== undefined && (
                  <span className="text-[11px] text-muted-foreground">
                    ({stage.conversionRate}% {stage.conversionLabel})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="font-semibold text-foreground">{stage.count}</span>
                <span className="text-muted-foreground text-[10px]">({stage.pctOfTotal}%)</span>
              </div>
            </div>

            {/* Clean Progress Bar */}
            <Progress value={Math.max(stage.pctOfTotal, stage.count > 0 ? 3 : 0)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}