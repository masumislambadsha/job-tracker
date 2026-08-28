"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DashboardSummary } from "@/lib/types";

interface WeeklyTrendChartProps {
  data: DashboardSummary["weeklyTrend"];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    return (
      <div className="rounded-md border bg-popover px-2.5 py-1.5 shadow-md text-popover-foreground">
        <p className="text-[11px] text-muted-foreground font-mono">
          Week: {point.range ?? point.week}
        </p>
        <p className="text-xs font-semibold mt-0.5">
          {point.count} {point.count === 1 ? "application" : "applications"}
        </p>
      </div>
    );
  }
  return null;
};

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  const totalInPeriod = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Application Volume</CardTitle>
          <CardDescription>
            Weekly (Fri–Thu) application cadence over the last 8 weeks
          </CardDescription>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {totalInPeriod} total
        </span>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="appPaceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="week"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--foreground))"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#appPaceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}