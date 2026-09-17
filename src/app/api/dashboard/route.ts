import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { calculatePercentage } from "@/lib/utils";
import { RESPONSE_STATUSES } from "@/lib/constants";
import { format, subWeeks, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

const TERMINAL_STATUSES = ["REJECTED", "GHOSTED", "WITHDRAWN"];
const NO_RESPONSE_STATUSES = ["WISHLIST", "APPLIED", "GHOSTED"];

const FOLLOW_UP_SELECT = {
  id: true,
  company: true,
  position: true,
  status: true,
  followUpDate: true,
} as const;

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next7DaysEnd = new Date(todayStart.getTime() + 7 * 86400000);

    // ── 1. Funnel & KPI counts (indexed, DB-side) ─────────────────────────
    const [
      totalApplications,
      activeCount,
      interviewCount,
      offerCount,
      appliedCount,
      responseCount,
    ] = await Promise.all([
      prisma.application.count({ where: { userId: user.id } }),
      prisma.application.count({
        where: { userId: user.id, status: { notIn: TERMINAL_STATUSES } },
      }),
      prisma.application.count({
        where: {
          userId: user.id,
          status: { in: ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER"] },
        },
      }),
      prisma.application.count({
        where: { userId: user.id, status: "OFFER" },
      }),
      prisma.application.count({
        where: { userId: user.id, status: { not: "WISHLIST" } },
      }),
      prisma.application.count({
        where: { userId: user.id, status: { in: RESPONSE_STATUSES } },
      }),
    ]);

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

    // ── 2. Weekly Application Trend (last 8 weeks, single lean query) ─────
    const trendStart = startOfWeek(subWeeks(now, 7), { weekStartsOn: 5 });
    const appliedDates = await prisma.application.findMany({
      where: { userId: user.id, dateApplied: { gte: trendStart } },
      select: { dateApplied: true },
    });

    const weeklyTrend: { week: string; range?: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const targetDate = subWeeks(now, i);
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 5 });
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 5 });
      const weekLabel = format(weekStart, "MMM d");

      const count = appliedDates.filter(({ dateApplied }) =>
        isWithinInterval(new Date(dateApplied), { start: weekStart, end: weekEnd })
      ).length;

      weeklyTrend.push({
        week: i === 0 ? `${weekLabel}+` : weekLabel,
        range: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`,
        count,
      });
    }

    // ── 3. Overdue & Upcoming Follow-ups (indexed, capped) ────────────────
    const [overdueFollowUps, upcomingFollowUps] = await Promise.all([
      prisma.application.findMany({
        where: {
          userId: user.id,
          followUpDate: { not: null, lt: todayStart },
          status: { notIn: [...TERMINAL_STATUSES, "OFFER"] },
        },
        orderBy: [{ followUpDate: "asc" }, { id: "asc" }],
        select: FOLLOW_UP_SELECT,
      }),
      prisma.application.findMany({
        where: {
          userId: user.id,
          followUpDate: { not: null, gte: todayStart, lte: next7DaysEnd },
          status: { notIn: [...TERMINAL_STATUSES, "OFFER"] },
        },
        orderBy: [{ followUpDate: "asc" }, { id: "asc" }],
        select: FOLLOW_UP_SELECT,
      }),
    ]);

    // ── 4. Average Days to First Response ─────────────────────────────────
    // Only apps that ever reached a non-pending status are considered (a
    // small subset), so fetching their full history here is cheap while
    // keeping the calculation identical to the previous in-memory version.
    const respondedApps = await prisma.application.findMany({
      where: {
        userId: user.id,
        statusHistory: { some: { toStatus: { notIn: NO_RESPONSE_STATUSES } } },
      },
      select: {
        id: true,
        statusHistory: {
          orderBy: { changedAt: "asc" },
          select: { fromStatus: true, toStatus: true, changedAt: true },
        },
      },
    });

    let totalResponseDays = 0;
    let countedResponses = 0;

    for (const app of respondedApps) {
      if (app.statusHistory.length <= 1) continue;

      const appliedHistory = app.statusHistory.find(
        (h) => h.toStatus === "APPLIED" || h.fromStatus === null
      );
      const firstResponse = app.statusHistory.find(
        (h) =>
          h.toStatus !== "WISHLIST" &&
          h.toStatus !== "APPLIED" &&
          h.toStatus !== "GHOSTED"
      );

      if (!appliedHistory || !firstResponse) continue;

      const diffMs =
        new Date(firstResponse.changedAt).getTime() -
        new Date(appliedHistory.changedAt).getTime();
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      totalResponseDays += diffDays;
      countedResponses++;
    }

    const averageDaysToResponse =
      countedResponses > 0 ? Math.round(totalResponseDays / countedResponses) : 6;

    // ── 5. Portal Leaderboard (portal-scoped, unchanged) ──────────────────
    const portals = await prisma.portal.findMany({
      where: { userId: user.id },
      include: {
        applications: {
          select: { id: true, status: true },
        },
      },
    });

    const portalLeaderboard = portals
      .map((portal) => {
        const apps = portal.applications;
        const applied = apps.length;
        const responses = apps.filter(
          (a) => !["WISHLIST", "APPLIED", "GHOSTED"].includes(a.status)
        ).length;
        const responseRate = calculatePercentage(responses, applied);

        return {
          portalId: portal.id,
          portalName: portal.name,
          appliedCount: applied,
          responseCount: responses,
          responseRate,
          tier: portal.tier,
        };
      })
      .filter((p) => p.appliedCount > 0)
      .sort((a, b) => b.responseRate - a.responseRate || b.appliedCount - a.appliedCount);

    return NextResponse.json({
      totalApplications,
      activeApplications: activeCount,
      interviewCount,
      offerCount,
      overallResponseRate,
      averageDaysToResponse,
      overdueFollowUps,
      upcomingFollowUps,
      funnel,
      weeklyTrend,
      portalLeaderboard,
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate dashboard analytics" },
      { status: 500 }
    );
  }
}