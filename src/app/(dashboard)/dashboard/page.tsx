import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { WeeklyTrendChart } from "@/components/dashboard/WeeklyTrendChart";
import { FollowUpAlerts } from "@/components/dashboard/FollowUpAlerts";
import { PortalLeaderboard } from "@/components/dashboard/PortalLeaderboard";
import { calculatePercentage } from "@/lib/utils";
import { RESPONSE_STATUSES } from "@/lib/constants";
import { subWeeks, startOfWeek, endOfWeek, isWithinInterval, format } from "date-fns";
import { DashboardSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getDashboardData(userId: string): Promise<DashboardSummary> {
  const applications = await prisma.application.findMany({
    where: { userId },
    include: {
      portal: true,
      resumeVersion: true,
      tags: { include: { tag: true } },
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
    orderBy: { dateApplied: "desc" },
  });

  const totalApplications = applications.length;

  const activeApplications = applications.filter(
    (a) => !["REJECTED", "GHOSTED", "WITHDRAWN"].includes(a.status)
  ).length;

  const interviewCount = applications.filter((a) =>
    ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER"].includes(a.status)
  ).length;

  const offerCount = applications.filter((a) => a.status === "OFFER").length;

  const appliedApps = applications.filter((a) => a.status !== "WISHLIST");
  const appliedCount = appliedApps.length;

  const responseApps = applications.filter((a) =>
    RESPONSE_STATUSES.includes(a.status)
  );
  const responseCount = responseApps.length;

  const overallResponseRate = calculatePercentage(responseCount, appliedCount);

  const funnel = {
    applied: appliedCount,
    responses: responseCount,
    interviews: interviewCount,
    offers: offerCount,
    conversionRates: {
      appliedToResponse: calculatePercentage(responseCount, appliedCount),
      responseToInterview: calculatePercentage(interviewCount, responseCount),
      interviewToOffer: calculatePercentage(offerCount, interviewCount),
      overall: calculatePercentage(offerCount, appliedCount),
    },
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next7DaysEnd = new Date(todayStart.getTime() + 7 * 86400000);

  const overdueFollowUps: any[] = [];
  const upcomingFollowUps: any[] = [];

  for (const app of applications) {
    if (!app.followUpDate) continue;
    if (["REJECTED", "GHOSTED", "WITHDRAWN", "OFFER"].includes(app.status)) continue;

    const fDate = new Date(app.followUpDate);
    if (fDate < todayStart) {
      overdueFollowUps.push(app);
    } else if (fDate <= next7DaysEnd) {
      upcomingFollowUps.push(app);
    }
  }

  overdueFollowUps.sort(
    (a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime()
  );
  upcomingFollowUps.sort(
    (a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime()
  );

  const weeklyTrend: { week: string; range?: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const targetDate = subWeeks(now, i);
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 5 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 5 });
    const weekLabel = format(weekStart, "MMM d");

    const count = applications.filter((a) => {
      const d = new Date(a.dateApplied);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    }).length;

    weeklyTrend.push({
      week: i === 0 ? `${weekLabel}+` : weekLabel,
      range: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`,
      count,
    });
  }

  let totalResponseDays = 0;
  let countedResponses = 0;

  for (const app of applications) {
    if (app.statusHistory && app.statusHistory.length > 1) {
      const appliedHistory = app.statusHistory.find(
        (h) => h.toStatus === "APPLIED" || h.fromStatus === null
      );
      const firstResponseHistory = app.statusHistory.find(
        (h) =>
          h.toStatus !== "WISHLIST" &&
          h.toStatus !== "APPLIED" &&
          h.toStatus !== "GHOSTED"
      );

      if (appliedHistory && firstResponseHistory) {
        const diffMs =
          new Date(firstResponseHistory.changedAt).getTime() -
          new Date(appliedHistory.changedAt).getTime();
        const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        totalResponseDays += diffDays;
        countedResponses++;
      }
    }
  }

  const averageDaysToResponse =
    countedResponses > 0 ? Math.round(totalResponseDays / countedResponses) : 6;

  const portals = await prisma.portal.findMany({
    where: { userId },
    include: {
      applications: {
        select: { id: true, status: true },
      },
    },
  });

  const portalLeaderboard = portals
    .map((portal) => {
      const apps = portal.applications;
      const appliedCount = apps.length;
      const responseCount = apps.filter(
        (a) => !["WISHLIST", "APPLIED", "GHOSTED"].includes(a.status)
      ).length;
      const responseRate = calculatePercentage(responseCount, appliedCount);

      return {
        portalId: portal.id,
        portalName: portal.name,
        appliedCount,
        responseCount,
        responseRate,
        tier: portal.tier,
      };
    })
    .filter((p) => p.appliedCount > 0)
    .sort((a, b) => b.responseRate - a.responseRate || b.appliedCount - a.appliedCount);

  return {
    totalApplications,
    activeApplications,
    interviewCount,
    offerCount,
    overallResponseRate,
    averageDaysToResponse,
    overdueFollowUps,
    upcomingFollowUps,
    funnel,
    weeklyTrend,
    portalLeaderboard,
  };
}

export default async function DashboardPage() {
  let user = await getCurrentUser();
  if (!user) user = await getOrCreateDefaultUser();

  const data = await getDashboardData(user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Application Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline analytics, callback rates, and pending follow-ups.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <MetricsOverview data={data} />

      {/* Main Grid: Funnel Chart & Weekly Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FunnelChart funnel={data.funnel} />
        <WeeklyTrendChart data={data.weeklyTrend} />
      </div>

      {/* Bottom Grid: Follow-up Alerts & Portal Leaderboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FollowUpAlerts
          overdue={data.overdueFollowUps}
          upcoming={data.upcomingFollowUps}
        />
        <PortalLeaderboard data={data.portalLeaderboard} />
      </div>
    </div>
  );
}
