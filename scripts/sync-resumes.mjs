import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ACTUAL_RESUMES = [
  {
    label: "Next.js Developer Resume",
    url: "/resumes/nextjs_developer.pdf",
    filename: "nextjs_developer.pdf",
  },
  {
    label: "React Developer Resume",
    url: "/resumes/react_developer.pdf",
    filename: "react_developer.pdf",
  },
  {
    label: "Frontend Developer Resume",
    url: "/resumes/frontend_developer.pdf",
    filename: "frontend_developer.pdf",
  },
  {
    label: "Full-Stack Developer Resume",
    url: "/resumes/full_stack_developer.pdf",
    filename: "full_stack_developer.pdf",
  },
  {
    label: "MERN Developer Resume",
    url: "/resumes/mern_developer.pdf",
    filename: "mern_developer.pdf",
  },
  {
    label: "Software Developer Resume",
    url: "/resumes/software_developer.pdf",
    filename: "software_developer.pdf",
  },
  {
    label: "Web Developer Resume",
    url: "/resumes/web_developer.pdf",
    filename: "web_developer.pdf",
  },
];

async function main() {
  console.log("📄 Registering your 7 actual PDF resumes in MongoDB...");

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("User not found.");
    process.exit(1);
  }

  // Clear any existing demo resume versions
  await prisma.resumeVersion.deleteMany({ where: { userId: user.id } });

  for (const item of ACTUAL_RESUMES) {
    const created = await prisma.resumeVersion.create({
      data: {
        userId: user.id,
        label: item.label,
        url: item.url,
      },
    });
    console.log(`✅ Registered: ${created.label} (${created.url})`);
  }

  const count = await prisma.resumeVersion.count();
  console.log(`🎉 Total Resume Versions in MongoDB: ${count}`);
}

main()
  .catch((e) => {
    console.error("Error registering resumes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
