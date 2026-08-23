import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getOrCreateDefaultUser } from "@/lib/auth";
import { calculatePercentage, isDateOverdue } from "@/lib/utils";
import { RESPONSE_STATUSES } from "@/lib/constants";
import { format, subWeeks, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) user = await getOrCreateDefaultUser();

    // 1. Fetch all user applications with relations
    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        portal: true,
        resumeVersion: true,
        tags: { include: { tag: true } },
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
      orderBy: { dateApplied: "desc" },
    });

    const totalApplications = applications.length;

    // Active applications (not terminal)
    const activeApplications = applications.filter(
      (a) => !["REJECTED", "GHOSTED", "WITHDRAWN"].includes(a.status)
    ).length;

    const interviewCount = applications.filter((a) =>
      ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER"].includes(a.status)
    ).length;

    const offerCount = applications.filter((a) => a.status === "OFFER").length;

    // 2. Funnel metrics
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

    // 3. Overdue & Upcoming Follow-ups
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next7DaysEnd = new Date(todayStart.getTime() + 7 * 86400000);

    const overdueFollowUps: any[] = [];
    const upcomingFollowUps: any[] = [];

    for (const app of applications) {
      if (!app.followUpDate) continue;
      // Skip terminal applications
      if (["REJECTED", "GHOSTED", "WITHDRAWN", "OFFER"].includes(app.status)) continue;

      const fDate = new Date(app.followUpDate);
      if (fDate < todayStart) {
        overdueFollowUps.push(app);
      } else if (fDate <= next7DaysEnd) {
        upcomingFollowUps.push(app);
      }
    }

    // Sort overdue by oldest first
    overdueFollowUps.sort(
      (a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime()
    );
    // Sort upcoming by soonest first
    upcomingFollowUps.sort(
      (a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime()
    );

    // 4. Weekly Application Trend (Last 8 weeks)
    const weeklyTrend: { week: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const targetDate = subWeeks(now, i);
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
      const weekLabel = format(weekStart, "MMM d");

      const count = applications.filter((a) => {
        const d = new Date(a.dateApplied);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      }).length;

      weeklyTrend.push({ week: weekLabel, count });
    }

    // 5. Average Days to First Response
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

    // 6. Portal Leaderboard
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate dashboard analytics" },
      { status: 500 }
    );
  }
}
