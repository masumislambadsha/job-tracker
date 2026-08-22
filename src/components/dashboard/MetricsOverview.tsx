"use client";

import React from "react";
import { Card } from "../ui/Card";
import { DashboardSummary } from "@/lib/types";

interface MetricsOverviewProps {
  data: DashboardSummary;
}

export function MetricsOverview({ data }: MetricsOverviewProps) {
  const metrics = [
    {
      title: "Total Applications",
      value: data.totalApplications,
      description: "Applications tracked",
    },
    {
      title: "Active Pipeline",
      value: data.activeApplications,
      description: "In progress",
    },
    {
      title: "Interviews",
      value: data.interviewCount,
      description: "Scheduled / done",
    },
    {
      title: "Offers",
      value: data.offerCount,
      description: "Offers received",
    },
    {
      title: "Response Rate",
      value: `${data.overallResponseRate}%`,
      description: "Conversion rate",
    },
    {
      title: "Avg Response Time",
      value: `${data.averageDaysToResponse}d`,
      description: "Days to first reply",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((metric) => (
        <Card key={metric.title} className="p-3.5 bg-zinc-900/50 border-zinc-800">
          <span className="text-[11px] font-medium text-zinc-400 block">{metric.title}</span>
          <div className="mt-1">
            <span className="text-xl font-semibold tracking-tight text-zinc-100">{metric.value}</span>
            <p className="text-[10px] text-zinc-500 mt-0.5">{metric.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
