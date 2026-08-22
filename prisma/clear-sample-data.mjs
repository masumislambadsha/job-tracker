import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all sample applications and history...");

  await prisma.statusHistory.deleteMany({});
  await prisma.applicationTag.deleteMany({});
  await prisma.application.deleteMany({});

  const remainingApps = await prisma.application.count();
  const portalsCount = await prisma.portal.count();

  console.log(`✅ Cleared all applications. Remaining: ${remainingApps}`);
  console.log(`🌐 Verified portals preserved: ${portalsCount}`);
}

main()
  .catch((e) => {
    console.error("Error clearing sample data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
