const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const cajero = await prisma.user.findFirst({
      where: { email: 'cajero@ferreteria.com' }
    });

    const orden = await prisma.sale.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    console.log('Cajero businessId:', cajero?.businessId);
    console.log('Orden businessId:', orden?.businessId);
    console.log('Match:', cajero?.businessId === orden?.businessId);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
