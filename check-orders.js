// Quick check: Are orders being saved to the database?

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('Checking orders in database...\n');

    // Get all businesses
    const businesses = await prisma.business.findMany();
    console.log(`Found ${businesses.length} businesses:\n`);

    for (const biz of businesses) {
      console.log(`Business: ${biz.name} (${biz.id})`);

      // Get all orders for this business
      const orders = await prisma.sale.findMany({
        where: { businessId: biz.id },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`  Total orders: ${orders.length}`);

      // Show pending orders
      const pending = orders.filter(o => o.status === 'pendiente');
      console.log(`  Pending orders: ${pending.length}`);

      if (pending.length > 0) {
        console.log(`  Recent pending:`);
        pending.slice(0, 3).forEach(o => {
          console.log(`    - Folio: ${o.folio}, Status: ${o.status}, LocationId: ${o.locationId}`);
        });
      }

      console.log('');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
