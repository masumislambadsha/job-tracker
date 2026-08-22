import { ApplicationStatus, JobNature, JobType } from "./types";

export const STATUS_PIPELINE: {
  id: ApplicationStatus;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  columnOrder: number;
  isTerminal?: boolean;
}[] = [
  {
    id: "WISHLIST",
    label: "Wishlist",
    shortLabel: "Wishlist",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    columnOrder: 1,
  },
  {
    id: "APPLIED",
    label: "Applied",
    shortLabel: "Applied",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    columnOrder: 2,
  },
  {
    id: "OA_ASSESSMENT",
    label: "OA / Assessment",
    shortLabel: "Assessment",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    columnOrder: 3,
  },
  {
    id: "INTERVIEW_SCHEDULED",
    label: "Interview Scheduled",
    shortLabel: "Interview",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    columnOrder: 4,
  },
  {
    id: "INTERVIEW_COMPLETED",
    label: "Interview Completed",
    shortLabel: "Done",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    columnOrder: 5,
  },
  {
    id: "OFFER",
    label: "Offer Received",
    shortLabel: "Offer",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    columnOrder: 6,
  },
  {
    id: "REJECTED",
    label: "Rejected",
    shortLabel: "Rejected",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    columnOrder: 7,
    isTerminal: true,
  },
  {
    id: "GHOSTED",
    label: "Ghosted / No Reply",
    shortLabel: "Ghosted",
    color: "text-zinc-500",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/30",
    columnOrder: 8,
    isTerminal: true,
  },
  {
    id: "WITHDRAWN",
    label: "Withdrawn",
    shortLabel: "Withdrawn",
    color: "text-neutral-400",
    bgColor: "bg-neutral-500/10",
    borderColor: "border-neutral-500/30",
    columnOrder: 9,
    isTerminal: true,
  },
];

export const JOB_NATURE_OPTIONS: { id: JobNature; label: string }[] = [
  { id: "FULL_TIME", label: "Full-time" },
  { id: "PART_TIME", label: "Part-time" },
  { id: "CONTRACT", label: "Contract" },
  { id: "INTERNSHIP", label: "Internship" },
];

export const JOB_TYPE_OPTIONS: { id: JobType; label: string }[] = [
  { id: "REMOTE", label: "Remote" },
  { id: "HYBRID", label: "Hybrid" },
  { id: "ONSITE", label: "Onsite" },
];

export const HOW_APPLIED_OPTIONS = [
  "Portal",
  "Referral",
  "Direct Email",
  "LinkedIn",
  "WhatsApp",
  "Company Career Site",
  "Other",
];

export const CURRENCIES = ["USD", "EUR", "GBP", "BDT", "CAD", "AUD", "SGD", "INR"];

export const PORTAL_TIER_CONFIG = {
  1: {
    label: "Tier 1 — Daily Check",
    color: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    description: "High volume / curated remote dev jobs. Check every morning.",
  },
  2: {
    label: "Tier 2 — Weekly Sweep",
    color: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    description: "Solid niche tech job boards. Check 2-3 times per week.",
  },
  3: {
    label: "Tier 3 — Reference / Specialized",
    color: "text-slate-400",
    badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    description: "Framework-specific or low-frequency boards.",
  },
};

export const SEED_PORTALS: {
  name: string;
  url: string;
  tier: number;
  notes: string;
}[] = [
  // Tier 1 — check daily
  {
    name: "React Jobs",
    url: "https://reactjobs.io/",
    tier: 1,
    notes: "Specialized in React, Next.js, and frontend remote engineering roles.",
  },
  {
    name: "Hacker News 'Who is Hiring'",
    url: "https://news.ycombinator.com/submitted?id=whoishiring",
    tier: 1,
    notes: "Monthly thread posted on the 1st of every month. Direct engineering team contacts.",
  },
  {
    name: "Working Nomads",
    url: "https://www.workingnomads.com/",
    tier: 1,
    notes: "Curated 100% remote software engineering jobs across global timezones.",
  },
  {
    name: "Dynamite Jobs",
    url: "https://dynamitejobs.com/",
    tier: 1,
    notes: "Verified remote-first company postings with clear compensation ranges.",
  },
  {
    name: "VueJobs",
    url: "https://vuejobs.com/",
    tier: 1,
    notes: "Dedicated Vue / Nuxt / Full-stack positions and remote roles.",
  },

  // Tier 2 — weekly sweep
  {
    name: "Jobspresso",
    url: "https://jobspresso.co/",
    tier: 2,
    notes: "Expertly curated remote tech careers in startups and established tech firms.",
  },
  {
    name: "JustRemote",
    url: "https://justremote.co/",
    tier: 2,
    notes: "Search hidden remote jobs and full-stack developer opportunities globally.",
  },
  {
    name: "NoDesk",
    url: "https://nodesk.co/",
    tier: 2,
    notes: "Digital nomad & international remote developer listings and resources.",
  },
  {
    name: "Gun.io",
    url: "https://gun.io/",
    tier: 2,
    notes: "Vetted freelance & full-time developer placements with top tier clients.",
  },
  {
    name: "Underdog.io",
    url: "https://underdog.io/",
    tier: 2,
    notes: "Direct candidate batch matching with high-growth US & European tech startups.",
  },
  {
    name: "Jobgether",
    url: "https://jobgether.com/",
    tier: 2,
    notes: "Aggregator for flexible and telecommuting dev jobs across Europe & Asia.",
  },
  {
    name: "Landing.jobs",
    url: "https://landing.jobs/",
    tier: 2,
    notes: "European tech jobs hub with strong remote-friendly and relocation openings.",
  },
  {
    name: "EU Remote Jobs",
    url: "https://euremotejobs.com/",
    tier: 2,
    notes: "Timezone-friendly remote developer jobs within EU/UK and nearby zones.",
  },
  {
    name: "RemoteYeah",
    url: "https://remoteyeah.com/",
    tier: 2,
    notes: "Curated software engineering vacancies without timezone discrimination.",
  },
  {
    name: "Remote Rocketship",
    url: "https://www.remoterocketship.com/",
    tier: 2,
    notes: "Automated engine scraping remote postings directly from company career sites.",
  },

  // Tier 3 — low priority / reference
  {
    name: "DailyRemote",
    url: "https://dailyremote.com/",
    tier: 3,
    notes: "Daily feed of software developer, QA, and DevOps remote openings.",
  },
  {
    name: "Braintrust",
    url: "https://www.usebraintrust.com/",
    tier: 3,
    notes: "Decentralized talent network connecting elite tech contractors with enterprise.",
  },
  {
    name: "Virtual Vocations",
    url: "https://www.virtualvocations.com/",
    tier: 3,
    notes: "Hand-screened telecommute job database with tech category filtering.",
  },
  {
    name: "SkipTheDrive",
    url: "https://www.skipthedrive.com/",
    tier: 3,
    notes: "Free remote work directory with software development listings.",
  },
  {
    name: "Authentic Jobs",
    url: "https://authenticjobs.com/",
    tier: 3,
    notes: "Design and full-stack engineering job board for web professionals.",
  },
  {
    name: "Larajobs",
    url: "https://larajobs.com/",
    tier: 3,
    notes: "Official Laravel and full-stack PHP / modern web ecosystem jobs.",
  },
  {
    name: "Rails Job Board",
    url: "https://jobs.rubyonrails.org/",
    tier: 3,
    notes: "Official Ruby on Rails community board with remote-first teams.",
  },
  {
    name: "Django Job Board",
    url: "https://www.djangoproject.com/community/jobs/",
    tier: 3,
    notes: "Official Django Software Foundation remote Python / Django listings.",
  },
  {
    name: "WordPress Jobs",
    url: "https://jobs.wordpress.net/",
    tier: 3,
    notes: "Core WordPress, headless CMS, and plugin engineering opportunities.",
  },
];
