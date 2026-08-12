const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({
    include: { users: true, locations: true }
  });

  console.log('=== BUSINESSES IN DATABASE ===');
  for (const b of businesses) {
    console.log(`Business: ${b.name} (ID: ${b.id}, RFC: ${b.rfc}, Plan: ${b.plan})`);
    console.log(`Enabled Modules: ${JSON.stringify(b.enabledModules)}`);
    console.log(`Users (${b.users.length}):`);
    for (const u of b.users) {
      console.log(`  - ${u.email} | Name: ${u.name} | Role: ${u.role} | Active: ${u.active}`);
    }
    console.log('---');
  }

  const allUsers = await prisma.user.findMany({ where: { businessId: null } });
  if (allUsers.length > 0) {
    console.log('=== GLOBAL USERS (No Business ID) ===');
    for (const u of allUsers) {
      console.log(`  - ${u.email} | Name: ${u.name} | Role: ${u.role}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
