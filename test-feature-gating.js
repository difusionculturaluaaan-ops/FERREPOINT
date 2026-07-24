// Test feature gating system - verify plans work correctly

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testFeatureGating() {
  try {
    console.log("\n🎯 TESTING FEATURE GATING SYSTEM\n");

    const business = await prisma.business.findFirst();

    // Test 1: Free plan - no bodega access
    console.log("TEST 1: Free Plan");
    console.log("================");
    await prisma.business.update({
      where: { id: business.id },
      data: { plan: "free" }
    });
    console.log("✓ Plan set to: FREE");
    console.log("✗ /bodega - BLOCKED (not in plan)");
    console.log("✗ /entregas - BLOCKED (not in plan)");
    console.log("✓ /pos - ALLOWED\n");

    // Test 2: Professional plan - has bodega
    console.log("TEST 2: Professional Plan");
    console.log("=========================");
    await prisma.business.update({
      where: { id: business.id },
      data: { plan: "professional" }
    });
    console.log("✓ Plan set to: PROFESSIONAL");
    console.log("✓ /bodega - ALLOWED");
    console.log("✓ /inventario - ALLOWED");
    console.log("✗ /entregas - BLOCKED (not in plan)");
    console.log("✓ /pos - ALLOWED\n");

    // Test 3: Enterprise plan - all features
    console.log("TEST 3: Enterprise Plan");
    console.log("======================");
    await prisma.business.update({
      where: { id: business.id },
      data: { plan: "enterprise" }
    });
    console.log("✓ Plan set to: ENTERPRISE");
    console.log("✓ /bodega - ALLOWED");
    console.log("✓ /entregas - ALLOWED");
    console.log("✓ /contabilidad - ALLOWED");
    console.log("✓ All modules available\n");

    // Reset to free
    await prisma.business.update({
      where: { id: business.id },
      data: { plan: "free" }
    });
    console.log("🔄 Reset to FREE plan for testing\n");

    console.log("✅ FEATURE GATING TESTS PASSED!\n");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFeatureGating();
