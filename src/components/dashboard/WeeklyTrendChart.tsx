"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 shadow-md">
        <p className="text-[11px] text-zinc-400 font-mono">Week: {label}</p>
        <p className="text-xs font-semibold text-zinc-100 mt-0.5">
          {payload[0].value} {payload[0].value === 1 ? "application" : "applications"}
        </p>
      </div>
    );
  }
  return null;
};

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  const totalInPeriod = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="h-full bg-zinc-900/50 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Application Volume</CardTitle>
          <CardDescription>
            Weekly application cadence over the last 8 weeks
          </CardDescription>
        </div>
        <span className="text-xs font-mono text-zinc-400">
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
                  <stop offset="5%" stopColor="#e4e4e7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#e4e4e7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="week"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#e4e4e7"
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
