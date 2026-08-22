import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔌 Testing connection to MongoDB Atlas cluster...");
  const startTime = Date.now();

  try {
    // Attempt connecting and running a quick query
    await prisma.$connect();
    const duration = Date.now() - startTime;
    console.log(`✅ MongoDB Connection Successful! (Ping response: ${duration}ms)`);

    const userCount = await prisma.user.count();
    const portalCount = await prisma.portal.count();
    const appCount = await prisma.application.count();

    console.log(`📊 Current Database Stats:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Portals: ${portalCount}`);
    console.log(`   - Applications: ${appCount}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
