// Script to test plan gating system
// Shows how plans work and how to change them

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPlans() {
  try {
    console.log('🎯 TESTING PLAN SYSTEM\n');

    // Get the business
    const business = await prisma.business.findFirst();

    console.log('📊 Current Business:');
    console.log(`  Name: ${business.name}`);
    console.log(`  Current Plan: ${business.plan}`);
    console.log('');

    // Show what each plan includes
    const plans = {
      free: ['pos'],
      professional: ['pos', 'bodega', 'inventario', 'reportes'],
      enterprise: ['pos', 'bodega', 'inventario', 'reportes', 'entregas', 'contabilidad', 'facturacion']
    };

    console.log('📋 AVAILABLE PLANS:\n');
    Object.entries(plans).forEach(([plan, modules]) => {
      const isCurrent = plan === business.plan;
      const marker = isCurrent ? '✅' : '  ';
      console.log(`${marker} ${plan.toUpperCase()}`);
      console.log(`   Modules: ${modules.join(', ')}`);
      console.log('');
    });

    // Example: Upgrade to professional
    console.log('🚀 EXAMPLE: Upgrading to Professional...');
    const upgraded = await prisma.business.update({
      where: { id: business.id },
      data: { plan: 'professional' }
    });

    console.log(`✅ Business upgraded to: ${upgraded.plan}`);
    console.log(`   Now has access to: ${plans['professional'].join(', ')}`);
    console.log('');

    // Change back to free (for testing)
    await prisma.business.update({
      where: { id: business.id },
      data: { plan: 'free' }
    });
    console.log('🔄 Reset to free plan for testing');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPlans();
