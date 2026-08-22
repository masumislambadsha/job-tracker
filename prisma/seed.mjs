import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PORTALS = [
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

async function main() {
  console.log("🌱 Starting JobDesk Database Seeding...");

  // 1. Create or find default user
  const email = "badsha@jobdesk.app";
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash("password123", 10);
    user = await prisma.user.create({
      data: {
        name: "Masum Islam Badsha",
        email,
        passwordHash,
      },
    });
    console.log(`👤 Created user: ${user.name} (${user.email})`);
  } else {
    console.log(`👤 Found existing user: ${user.name} (${user.email})`);
  }

  // 2. Seed 24 Portals (Appendix A)
  console.log("🌐 Seeding verified job portals...");
  const portalMap = new Map();

  for (const portalData of SEED_PORTALS) {
    const existing = await prisma.portal.findFirst({
      where: { userId: user.id, name: portalData.name },
    });

    if (existing) {
      portalMap.set(portalData.name, existing.id);
    } else {
      const created = await prisma.portal.create({
        data: {
          userId: user.id,
          name: portalData.name,
          url: portalData.url,
          tier: portalData.tier,
          notes: portalData.notes,
          lastCheckedAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 86400000)),
        },
      });
      portalMap.set(portalData.name, created.id);
    }
  }
  console.log(`✅ Seeded ${portalMap.size} portals.`);

  // 3. Seed Resume Versions
  console.log("📄 Seeding resume versions...");
  const resumeVersions = [
    {
      label: "Full-Stack v3 (React & Node.js)",
      url: "https://drive.google.com/file/d/demo-fullstack-resume/view",
    },
    {
      label: "Frontend Engineer (ATS-Optimized)",
      url: "https://drive.google.com/file/d/demo-frontend-ats/view",
    },
    {
      label: "Next.js / TypeScript Specialist",
      url: "https://drive.google.com/file/d/demo-nextjs-resume/view",
    },
  ];

  const resumeMap = new Map();
  for (const res of resumeVersions) {
    const existing = await prisma.resumeVersion.findFirst({
      where: { userId: user.id, label: res.label },
    });
    if (existing) {
      resumeMap.set(res.label, existing.id);
    } else {
      const created = await prisma.resumeVersion.create({
        data: {
          userId: user.id,
          label: res.label,
          url: res.url,
        },
      });
      resumeMap.set(res.label, created.id);
    }
  }
  console.log(`✅ Seeded ${resumeMap.size} resume versions.`);

  // 4. Seed Tags
  console.log("🏷️ Seeding tags...");
  const sampleTags = [
    { name: "dream-company", color: "#ec4899" },
    { name: "cold-apply", color: "#64748b" },
    { name: "high-salary", color: "#10b981" },
    { name: "referral", color: "#6366f1" },
    { name: "react-specialist", color: "#38bdf8" },
    { name: "remote-eu", color: "#f59e0b" },
  ];

  const tagMap = new Map();
  for (const tag of sampleTags) {
    const existing = await prisma.tag.findFirst({
      where: { userId: user.id, name: tag.name },
    });
    if (existing) {
      tagMap.set(tag.name, existing.id);
    } else {
      const created = await prisma.tag.create({
        data: {
          userId: user.id,
          name: tag.name,
          color: tag.color,
        },
      });
      tagMap.set(tag.name, created.id);
    }
  }
  console.log(`✅ Seeded ${tagMap.size} tags.`);

  // 5. Seed Realistic Applications if none exist
  const existingApps = await prisma.application.count({ where: { userId: user.id } });
  if (existingApps === 0) {
    console.log("💼 Seeding initial realistic applications...");

    const fullstackResumeId = resumeMap.get("Full-Stack v3 (React & Node.js)");
    const frontendResumeId = resumeMap.get("Frontend Engineer (ATS-Optimized)");
    const nextjsResumeId = resumeMap.get("Next.js / TypeScript Specialist");

    const sampleApplications = [
      {
        company: "Vercel",
        position: "Senior Frontend Engineer (Next.js)",
        dateApplied: new Date(Date.now() - 14 * 86400000),
        status: "INTERVIEW_SCHEDULED",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — Global",
        jobLink: "https://vercel.com/careers",
        portalId: portalMap.get("React Jobs"),
        howApplied: "Portal",
        resumeVersionId: nextjsResumeId,
        salaryMin: 140000,
        salaryMax: 180000,
        currency: "USD",
        priority: 5,
        followUpDate: new Date(Date.now() + 2 * 86400000),
        comments: "Round 2 Technical Interview scheduled with Engineering Lead.",
        tags: ["dream-company", "react-specialist", "high-salary"],
        history: [
          { from: null, to: "APPLIED", daysAgo: 14 },
          { from: "APPLIED", to: "OA_ASSESSMENT", daysAgo: 10 },
          { from: "OA_ASSESSMENT", to: "INTERVIEW_SCHEDULED", daysAgo: 3 },
        ],
      },
      {
        company: "Supabase",
        position: "Full-Stack Cloud Developer",
        dateApplied: new Date(Date.now() - 21 * 86400000),
        status: "OFFER",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — APAC / Global",
        jobLink: "https://supabase.com/careers",
        portalId: portalMap.get("Hacker News 'Who is Hiring'"),
        howApplied: "Direct Email",
        resumeVersionId: fullstackResumeId,
        salaryMin: 130000,
        salaryMax: 160000,
        currency: "USD",
        priority: 5,
        followUpDate: new Date(Date.now() + 5 * 86400000),
        comments: "Official offer received! Reviewing equity package & healthcare details.",
        tags: ["dream-company", "high-salary"],
        history: [
          { from: null, to: "APPLIED", daysAgo: 21 },
          { from: "APPLIED", to: "INTERVIEW_SCHEDULED", daysAgo: 15 },
          { from: "INTERVIEW_SCHEDULED", to: "INTERVIEW_COMPLETED", daysAgo: 7 },
          { from: "INTERVIEW_COMPLETED", to: "OFFER", daysAgo: 2 },
        ],
      },
      {
        company: "GitLab",
        position: "Full Stack Engineer, Ecosystem",
        dateApplied: new Date(Date.now() - 8 * 86400000),
        status: "OA_ASSESSMENT",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — Worldwide",
        jobLink: "https://about.gitlab.com/jobs",
        portalId: portalMap.get("Working Nomads"),
        howApplied: "Portal",
        resumeVersionId: fullstackResumeId,
        salaryMin: 110000,
        salaryMax: 145000,
        currency: "USD",
        priority: 4,
        followUpDate: new Date(Date.now() + 1 * 86400000),
        comments: "Take-home code challenge received. 48 hours to complete.",
        tags: ["cold-apply"],
        history: [
          { from: null, to: "APPLIED", daysAgo: 8 },
          { from: "APPLIED", to: "OA_ASSESSMENT", daysAgo: 2 },
        ],
      },
      {
        company: "Automattic",
        position: "JavaScript / React Developer",
        dateApplied: new Date(Date.now() - 18 * 86400000),
        status: "INTERVIEW_COMPLETED",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — Anywhere",
        jobLink: "https://automattic.com/work-with-us",
        portalId: portalMap.get("WordPress Jobs"),
        howApplied: "Portal",
        resumeVersionId: frontendResumeId,
        salaryMin: 95000,
        salaryMax: 130000,
        currency: "USD",
        priority: 4,
        followUpDate: new Date(Date.now() + 3 * 86400000),
        comments: "Completed trial project & final chat with team. Waiting on feedback.",
        tags: ["react-specialist"],
        history: [
          { from: null, to: "APPLIED", daysAgo: 18 },
          { from: "APPLIED", to: "INTERVIEW_SCHEDULED", daysAgo: 12 },
          { from: "INTERVIEW_SCHEDULED", to: "INTERVIEW_COMPLETED", daysAgo: 3 },
        ],
      },
      {
        company: "Stripe",
        position: "Frontend Infrastructure Engineer",
        dateApplied: new Date(Date.now() - 25 * 86400000),
        status: "REJECTED",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — US/EU",
        jobLink: "https://stripe.com/jobs",
        portalId: portalMap.get("Dynamite Jobs"),
        howApplied: "Referral",
        resumeVersionId: nextjsResumeId,
        salaryMin: 150000,
        salaryMax: 190000,
        currency: "USD",
        priority: 5,
        followUpDate: null,
        comments: "Received polite rejection after initial resume screen.",
        tags: ["referral", "dream-company"],
        history: [
          { from: null, to: "APPLIED", daysAgo: 25 },
          { from: "APPLIED", to: "REJECTED", daysAgo: 18 },
        ],
      },
      {
        company: "Remote.com",
        position: "Full-Stack Engineer (Node / React)",
        dateApplied: new Date(Date.now() - 12 * 86400000),
        status: "APPLIED",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — Global",
        jobLink: "https://remote.com/careers",
        portalId: portalMap.get("JustRemote"),
        howApplied: "Portal",
        resumeVersionId: fullstackResumeId,
        salaryMin: 100000,
        salaryMax: 135000,
        currency: "USD",
        priority: 3,
        // Overdue follow-up for testing!
        followUpDate: new Date(Date.now() - 3 * 86400000),
        comments: "Applied via JustRemote. Need to send a polite follow-up on LinkedIn.",
        tags: ["cold-apply"],
        history: [{ from: null, to: "APPLIED", daysAgo: 12 }],
      },
      {
        company: "Shopify",
        position: "Staff React Engineer",
        dateApplied: new Date(Date.now() - 16 * 86400000),
        status: "APPLIED",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — Americas/Europe",
        jobLink: "https://shopify.com/careers",
        portalId: portalMap.get("Jobspresso"),
        howApplied: "Portal",
        resumeVersionId: frontendResumeId,
        salaryMin: 135000,
        salaryMax: 175000,
        currency: "USD",
        priority: 4,
        // Another overdue follow-up
        followUpDate: new Date(Date.now() - 5 * 86400000),
        comments: "Follow-up overdue by 5 days. Sent note to hiring manager.",
        tags: ["react-specialist"],
        history: [{ from: null, to: "APPLIED", daysAgo: 16 }],
      },
      {
        company: "Linear",
        position: "Product Engineer (Web & Desktop)",
        dateApplied: new Date(Date.now() - 2 * 86400000),
        status: "APPLIED",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — Worldwide",
        jobLink: "https://linear.app/careers",
        portalId: portalMap.get("React Jobs"),
        howApplied: "Portal",
        resumeVersionId: nextjsResumeId,
        salaryMin: 140000,
        salaryMax: 180000,
        currency: "USD",
        priority: 5,
        followUpDate: new Date(Date.now() + 5 * 86400000),
        comments: "Applied with portfolio and custom cover note.",
        tags: ["dream-company"],
        history: [{ from: null, to: "APPLIED", daysAgo: 2 }],
      },
      {
        company: "Raycast",
        position: "Frontend Extensions Engineer",
        dateApplied: new Date(Date.now() - 1 * 86400000),
        status: "WISHLIST",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — London/EU",
        jobLink: "https://raycast.com/careers",
        portalId: portalMap.get("EU Remote Jobs"),
        howApplied: "Other",
        resumeVersionId: frontendResumeId,
        salaryMin: 110000,
        salaryMax: 140000,
        currency: "EUR",
        priority: 5,
        followUpDate: new Date(Date.now() + 2 * 86400000),
        comments: "Polishing Raycast extension demo before submitting application.",
        tags: ["dream-company", "remote-eu"],
        history: [{ from: null, to: "WISHLIST", daysAgo: 1 }],
      },
      {
        company: "HashiCorp",
        position: "UI Engineer, Cloud Console",
        dateApplied: new Date(Date.now() - 40 * 86400000),
        status: "GHOSTED",
        jobNature: "FULL_TIME",
        jobType: "REMOTE",
        companyLocation: "Remote — Global",
        jobLink: "https://hashicorp.com/jobs",
        portalId: portalMap.get("NoDesk"),
        howApplied: "Portal",
        resumeVersionId: fullstackResumeId,
        salaryMin: 120000,
        salaryMax: 150000,
        currency: "USD",
        priority: 3,
        followUpDate: null,
        comments: "No response after 40 days and two follow-ups. Marked as ghosted.",
        tags: ["cold-apply"],
        history: [
          { from: null, to: "APPLIED", daysAgo: 40 },
          { from: "APPLIED", to: "GHOSTED", daysAgo: 15 },
        ],
      },
    ];

    for (const appData of sampleApplications) {
      const app = await prisma.application.create({
        data: {
          userId: user.id,
          company: appData.company,
          position: appData.position,
          dateApplied: appData.dateApplied,
          status: appData.status,
          jobNature: appData.jobNature,
          jobType: appData.jobType,
          companyLocation: appData.companyLocation,
          jobLink: appData.jobLink,
          portalId: appData.portalId || null,
          howApplied: appData.howApplied,
          resumeVersionId: appData.resumeVersionId || null,
          salaryMin: appData.salaryMin,
          salaryMax: appData.salaryMax,
          currency: appData.currency,
          priority: appData.priority,
          followUpDate: appData.followUpDate,
          comments: appData.comments,
        },
      });

      // Add status history
      for (const hist of appData.history) {
        await prisma.statusHistory.create({
          data: {
            applicationId: app.id,
            fromStatus: hist.from,
            toStatus: hist.to,
            changedAt: new Date(Date.now() - hist.daysAgo * 86400000),
          },
        });
      }

      // Link tags
      for (const tagName of appData.tags) {
        const tagId = tagMap.get(tagName);
        if (tagId) {
          await prisma.applicationTag.create({
            data: {
              applicationId: app.id,
              tagId,
            },
          });
        }
      }
    }
    console.log(`✅ Seeded ${sampleApplications.length} sample applications.`);
  }

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
