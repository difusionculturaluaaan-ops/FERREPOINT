const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { email: { in: ['vendedor@ferreteria.com', 'cajero@ferreteria.com'] } }
    });

    console.log('Users:\n');
    users.forEach(u => {
      console.log(`${u.email}:`);
      console.log(`  businessId: ${u.businessId}`);
      console.log(`  role: ${u.role}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
