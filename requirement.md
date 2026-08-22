# JobDesk — Product Requirements Document (PRD)

**Owner:** Masum Islam Badsha
**Version:** 1.0
**Status:** Ready for build
**Last updated:** August 21, 2026
**Target build tool:** AI coding agent (e.g., Antigravity)

> "JobDesk" is a placeholder name — rename freely, it doesn't affect any spec below.

---

## 1. Summary

JobDesk is a personal job-application tracking web app that replaces a Google Sheet with a purpose-built tool: a structured database of every application, multiple views (table, kanban, calendar, dashboard), a curated job-portal directory, resume-version management, and automatic follow-up reminders — built for one core user, architected cleanly enough to extend later.

## 2. Problem Statement

The current workflow is a Google Sheet copied from a course template. It works as a log but breaks down as a tool:

- **No reminders** — follow-ups get missed because nothing surfaces them
- **No structured status pipeline** — "Job Status" is a free-text cell, not a funnel you can analyze
- **No linked resume versions** — multiple resume variants exist (full-stack / frontend / ATS) but the sheet can't tell you which one went where
- **No visibility into which job portals actually produce responses**
- **Painful on mobile** — a spreadsheet with 11 columns is cramped on a phone screen
- **No single place** that holds both the applications already made *and* the portals still worth applying on

JobDesk fixes all five without adding busywork — logging a new application should take under 30 seconds.

## 3. Goals

| Goal | How we'll know |
|---|---|
| Never miss a follow-up | Every application with no response after N days surfaces on the dashboard automatically |
| See the funnel, not just a list | Dashboard shows Applied → Response → Interview → Offer conversion at a glance |
| Know which portals work | Response rate is tracked per portal/source, not just per application |
| Faster logging than the sheet | Quick-add flow: 4 required fields, under 30 seconds |
| Usable one-handed on a phone | Every view is fully responsive; table and kanban both work on a ~380px screen |
| Migrate cleanly | Existing Google Sheet imports in one pass, zero manual re-entry |

## 4. Non-Goals (v1)

Explicitly **not** building in the first version:
- Multi-tenant / team features — single-user tool with standard auth, not a SaaS product
- Browser extension for one-click capture — v2
- Gmail inbox auto-sync to detect status changes — v2 (architected so it can be added without a schema rewrite)
- AI-assisted parsing of pasted job descriptions — v2
- Native mobile app — responsive web only

## 5. Primary User

One persona: a self-taught full-stack developer (React/Next.js/Node) based in Dhaka, Bangladesh, applying to remote international roles, tracking roughly 10–30 active applications at a time, checking status on both desktop and phone throughout the day.

## 6. Core Feature Set

### 6.1 Applications (core object)

Full CRUD on job applications, with these fields:

| Field | Type | Notes |
|---|---|---|
| Company | text, required | |
| Position | text, required | |
| Date Applied | date, required | defaults to today |
| Status | enum, required | see §6.1.1 |
| Job Nature | enum | Full-time / Part-time / Contract / Internship |
| Job Type | enum | Remote / Onsite / Hybrid |
| Company Location | text | free text, e.g. "Remote — India" |
| Job Link | URL | validated |
| Source / Portal | relation → Portal | which board it came from |
| How Applied | enum | Portal / Referral / Direct Email / LinkedIn / WhatsApp / Other |
| Resume Version | relation → ResumeVersion | which resume was sent |
| Salary Range | min/max + currency | optional |
| Priority | 1–5 | optional, "how much I want this one" |
| Follow-up Date | date | drives reminders |
| Comments | long text | freeform notes |
| Tags | many-to-many | e.g. "dream-company", "cold-apply" |

**6.1.1 Status pipeline (enum)**

`Wishlist → Applied → OA/Assessment → Interview Scheduled → Interview Completed → Offer → Rejected / Ghosted / Withdrawn`

Every status change is recorded in a `StatusHistory` log (timestamped) — this is what powers the funnel chart, so it isn't optional.

### 6.2 Views

- **Table view** (default) — sortable, filterable, inline-editable, mirrors the old spreadsheet feel
- **Kanban board** — columns = status stages; dragging a card updates status + writes to StatusHistory
- **Calendar view** — follow-up and interview dates plotted; overdue follow-ups highlighted
- **Dashboard** — see §6.4

### 6.3 Job Portal Directory

A first-class object, not just a text field. Pre-seeded with 24 verified portals (Appendix A), each with:
- Name, URL, Tier (1/2/3), short note
- "Last checked" timestamp (manually updated when visited)
- Response rate — auto-computed from linked applications (responses ÷ applications sent)
- Custom portals can be added freely

Applications reference a Portal via the Source field, which is what powers the response-rate-per-portal dashboard stat.

### 6.4 Dashboard / Analytics

- Funnel chart: Applied → Response → Interview → Offer (counts + conversion %)
- Applications-per-week trend line
- Response rate by portal (table, sorted highest first)
- Upcoming follow-ups (next 7 days) and overdue follow-ups (flagged)
- Average days-to-first-response

### 6.5 Resume Version Management

- Store multiple named resume versions (e.g. "Full-Stack v3", "Frontend ATS-optimized")
- Each version is a link (Google Drive, matching current habit) or an uploaded file
- Each application links to the version actually sent, enabling "which resume gets the most callbacks" analysis

### 6.6 Reminders

- Auto follow-up reminder N days after `Date Applied` with no status change (N configurable, default 7)
- Interview reminders (day-of and day-before)
- In-app dashboard alerts in v1; email reminders are a fast-follow, not a blocker for MVP

### 6.7 Import / Export

- CSV import with a column mapper pre-configured for the existing tracker's exact columns (see Appendix B), so the current sheet imports in one pass
- CSV export at any time — no lock-in

### 6.8 Search & Filters

Full-text search across Company/Position/Comments; filters by Status, Job Type, Job Nature, Portal, Tag, and date range — combinable.

### 6.9 Auth & Settings

- Email/password + optional OAuth (Google/GitHub) via Auth.js, matching existing stack experience
- Settings: reminder cadence, default currency, theme (light/dark, default dark)

## 7. User Stories (with acceptance criteria)

**US-1 — Quick add**
As a user, I want to log a new application in under 30 seconds so I don't skip logging real applications.
- [ ] Persistent "+ Add" button visible from every view
- [ ] Required fields only: Company, Position, Date Applied (defaults today), Status (defaults "Applied")
- [ ] All other fields collapsed under "More details" by default
- [ ] Appears instantly in table/kanban (optimistic UI, no full page reload)

**US-2 — Move a card, get history for free**
As a user, when I drag a kanban card to a new status, I want that change timestamped automatically.
- [ ] Drag-and-drop updates `status` and appends a `StatusHistory` row in the same transaction
- [ ] Detail view shows a chronological status timeline

**US-3 — See what's overdue**
As a user, I want overdue follow-ups surfaced without checking manually.
- [ ] Dashboard has an "Overdue" section, sorted oldest first
- [ ] An application with `followUpDate < today` and status still "Applied" is visually flagged

**US-4 — Know which portals are worth my time**
As a user, I want to see response rate per portal so I stop wasting time on dead boards.
- [ ] Dashboard table: Portal | Applications sent | Responses | Response rate %
- [ ] Sortable by response rate

**US-5 — Migrate without re-typing**
As a user, I want to import my existing Google Sheet in one shot.
- [ ] CSV upload with pre-mapped columns matching the current tracker
- [ ] Preview + confirm step before committing rows
- [ ] Duplicate detection on (Company + Position + Date Applied)

**US-6 — Works on my phone, one-handed**
As a user, I want the table and kanban to be usable on a ~380px screen.
- [ ] Table view: horizontal scroll with sticky first column (Company)
- [ ] Kanban: single column visible at a time with a tab/swipe switcher, not all columns squeezed in

## 8. Data Model

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  applications Application[]
  portals      Portal[]
  resumes      ResumeVersion[]
  tags         Tag[]
}

model Application {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  company         String
  position        String
  dateApplied     DateTime
  status          Status    @default(APPLIED)
  jobNature       JobNature?
  jobType         JobType?
  companyLocation String?
  jobLink         String?
  portalId        String?
  portal          Portal?   @relation(fields: [portalId], references: [id])
  howApplied      String?
  resumeVersionId String?
  resumeVersion   ResumeVersion? @relation(fields: [resumeVersionId], references: [id])
  salaryMin       Int?
  salaryMax       Int?
  currency        String?   @default("USD")
  priority        Int?
  followUpDate    DateTime?
  comments        String?
  tags            ApplicationTag[]
  statusHistory   StatusHistory[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId, status])
  @@index([userId, followUpDate])
}

model StatusHistory {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  fromStatus    Status?
  toStatus      Status
  changedAt     DateTime    @default(now())
}

model Portal {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  name          String
  url           String
  tier          Int?
  notes         String?
  lastCheckedAt DateTime?
  applications  Application[]
}

model ResumeVersion {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  label        String
  url          String
  createdAt    DateTime @default(now())
  applications Application[]
}

model Tag {
  id           String @id @default(cuid())
  userId       String
  user         User   @relation(fields: [userId], references: [id])
  name         String
  color        String?
  applications ApplicationTag[]
}

model ApplicationTag {
  applicationId String
  tagId         String
  application   Application @relation(fields: [applicationId], references: [id])
  tag           Tag         @relation(fields: [tagId], references: [id])
  @@id([applicationId, tagId])
}

enum Status {
  WISHLIST
  APPLIED
  OA_ASSESSMENT
  INTERVIEW_SCHEDULED
  INTERVIEW_COMPLETED
  OFFER
  REJECTED
  GHOSTED
  WITHDRAWN
}

enum JobNature {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERNSHIP
}

enum JobType {
  REMOTE
  ONSITE
  HYBRID
}
```

## 9. API / Server Actions

Prefer Next.js Server Actions for mutations (matches the RentNest frontend pattern), with Route Handlers for anything needing external access (CSV export, future integrations):

- `getApplications(filters)` / `createApplication()` / `updateApplication(id)` / `deleteApplication(id)` / `updateApplicationStatus(id, status)`
- `getPortals()` / `createPortal()` / `updatePortal(id)`
- `getResumeVersions()` / `createResumeVersion()`
- `getDashboardSummary()` — funnel counts, response rates, overdue list
- `POST /api/import` — CSV upload + mapping
- `GET /api/export` — CSV download

## 10. Information Architecture

```
/login, /register
/dashboard              → analytics (default landing after login)
/applications           → table view
/applications/board     → kanban
/applications/calendar  → calendar
/applications/[id]      → detail + edit
/portals                → directory
/resumes                → version manager
/settings               → profile, reminders, export
```

## 11. Recommended Tech Stack

Chosen to match tools already known, so any agent-generated code stays fully readable and editable:

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Forms/validation | React Hook Form + Zod |
| Data fetching/state | TanStack Query (server state) + Zustand (light UI state) |
| Drag & drop | @dnd-kit (kanban) |
| Charts | Recharts (dashboard) |
| ORM / DB | Prisma + PostgreSQL (Supabase or Neon) |
| Auth | Auth.js (credentials + optional Google/GitHub OAuth) |
| File/resume storage | Cloudinary, or plain Drive links (matches current habit) |
| Email (reminders, fast-follow) | Resend |
| Deployment | Vercel |

## 12. Non-Functional Requirements

- **Security:** bcrypt password hashing, Auth.js sessions, Zod validation on every mutation, CSRF-safe Server Actions, rate-limited auth routes
- **Performance:** optimistic UI on create/update/status-change; paginated table queries; indexed lookups on `(userId, status)` and `(userId, followUpDate)`
- **Accessibility:** semantic HTML, full keyboard navigation, WCAG AA contrast, visible focus states
- **Reliability:** error boundaries with user-facing retry; scheduled DB backups (provider-level, e.g. Supabase/Neon automatic backups)
- **Responsiveness:** every view usable down to ~360px width

## 13. MVP Definition of Done

- [ ] Auth working (register/login/logout)
- [ ] Full CRUD on applications, all fields from §6.1
- [ ] Table + Kanban views both functional; status change updates both and writes StatusHistory
- [ ] Dashboard: funnel chart, overdue follow-ups, response rate by portal
- [ ] Portal directory pre-seeded with Appendix A, CRUD on custom portals
- [ ] Resume version manager, linkable per application
- [ ] CSV import matching the existing sheet's columns, with preview + duplicate detection
- [ ] CSV export
- [ ] Fully responsive on mobile
- [ ] Deployed on Vercel with a working production URL

## 14. Phase 2 (post-MVP)

- Email reminders (Resend) in addition to in-app alerts
- Browser extension: one-click "add this job" from a LinkedIn/Indeed posting
- Gmail inbox scanning to auto-detect status-change emails (rejection / interview-invite keywords)
- AI paste-and-parse: paste a job description, auto-fill Company/Position/Job Type
- Google Calendar sync for interview dates

## 15. Assumptions & Open Questions

- Assuming a single active user for MVP; schema is multi-user-ready without a rewrite if that changes later
- Follow-up reminder default of 7 days — adjustable in Settings
- Resume storage defaults to Drive links (zero migration cost from current habit); file upload via Cloudinary is a drop-in swap later if needed

---

## Appendix A — Seed Data: Job Portal Directory (24 verified)

**Tier 1 — check daily**
1. React Jobs — https://reactjobs.io/
2. Hacker News "Who is Hiring" — https://news.ycombinator.com/submitted?id=whoishiring
3. Working Nomads — https://www.workingnomads.com/
4. Dynamite Jobs — https://dynamitejobs.com/
5. VueJobs — https://vuejobs.com/

**Tier 2 — weekly sweep**
6. Jobspresso — https://jobspresso.co/
7. JustRemote — https://justremote.co/
8. NoDesk — https://nodesk.co/
9. Gun.io — https://gun.io/
10. Underdog.io — https://underdog.io/
11. Jobgether — https://jobgether.com/
12. Landing.jobs — https://landing.jobs/
13. EU Remote Jobs — https://euremotejobs.com/
14. RemoteYeah — https://remoteyeah.com/
15. Remote Rocketship — https://www.remoterocketship.com/

**Tier 3 — low priority / reference**
16. DailyRemote — https://dailyremote.com/
17. Braintrust — https://www.usebraintrust.com/
18. Virtual Vocations — https://www.virtualvocations.com/
19. SkipTheDrive — https://www.skipthedrive.com/
20. Authentic Jobs — https://authenticjobs.com/
21. Larajobs — https://larajobs.com/
22. Rails Job Board — https://jobs.rubyonrails.org/
23. Django Job Board — https://www.djangoproject.com/community/jobs/
24. WordPress Jobs — https://jobs.wordpress.net/

## Appendix B — CSV Import Column Mapping

| Existing sheet column | Maps to |
|---|---|
| Date | `dateApplied` |
| Company | `company` |
| Position | `position` |
| Resume Drive | `resumeVersion.url` (creates a version if new) |
| Job Nature | `jobNature` |
| Job Type | `jobType` |
| Company Location | `companyLocation` |
| Job Link | `jobLink` |
| Job Status | `status` (mapped to enum) |
| How Applied | `howApplied` |
| Comments | `comments` |

---

*End of PRD.*
