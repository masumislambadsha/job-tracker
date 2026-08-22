export type ApplicationStatus =
  | "WISHLIST"
  | "APPLIED"
  | "OA_ASSESSMENT"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "OFFER"
  | "REJECTED"
  | "GHOSTED"
  | "WITHDRAWN";

export type JobNature = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
export type JobType = "REMOTE" | "ONSITE" | "HYBRID";
export type PortalTier = 1 | 2 | 3;

export interface ApplicationTagData {
  id: string;
  name: string;
  color?: string | null;
}

export interface StatusHistoryItem {
  id: string;
  applicationId: string;
  fromStatus?: string | null;
  toStatus: string;
  changedAt: string | Date;
}

export interface ApplicationItem {
  id: string;
  userId: string;
  company: string;
  position: string;
  dateApplied: string;
  status: ApplicationStatus;
  jobNature?: JobNature | null;
  jobType?: JobType | null;
  companyLocation?: string | null;
  jobLink?: string | null;
  portalId?: string | null;
  portal?: {
    id: string;
    name: string;
    url: string;
    tier?: number | null;
  } | null;
  howApplied?: string | null;
  resumeVersionId?: string | null;
  resumeVersion?: {
    id: string;
    label: string;
    url: string;
  } | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  priority?: number | null;
  followUpDate?: string | null;
  comments?: string | null;
  tags?: {
    tag: ApplicationTagData;
  }[];
  statusHistory?: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PortalItem {
  id: string;
  userId: string;
  name: string;
  url: string;
  tier?: number | null;
  notes?: string | null;
  lastCheckedAt?: string | null;
  applicationsCount?: number;
  responsesCount?: number;
  responseRate?: number;
}

export interface ResumeVersionItem {
  id: string;
  userId: string;
  label: string;
  url: string;
  createdAt: string;
  applicationsCount?: number;
  callbacksCount?: number;
  callbackRate?: number;
}

export interface DashboardSummary {
  totalApplications: number;
  activeApplications: number;
  interviewCount: number;
  offerCount: number;
  overallResponseRate: number;
  averageDaysToResponse: number;
  overdueFollowUps: ApplicationItem[];
  upcomingFollowUps: ApplicationItem[];
  funnel: {
    applied: number;
    responses: number;
    interviews: number;
    offers: number;
    conversionRates: {
      appliedToResponse: number;
      responseToInterview: number;
      interviewToOffer: number;
      overall: number;
    };
  };
  weeklyTrend: {
    week: string;
    count: number;
  }[];
  portalLeaderboard: {
    portalId: string;
    portalName: string;
    appliedCount: number;
    responseCount: number;
    responseRate: number;
    tier?: number | null;
  }[];
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
}
