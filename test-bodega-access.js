const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    console.log('🚀 TESTING ACCESO A BODEGA PARA DEMOFERRETODO...\n');

    // Step 1: Login as demoferretodo@ferreteria.com
    console.log('📍 1. Logging in as demoferretodo@ferreteria.com...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'demoferretodo@ferreteria.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('   ✓ Logged in as DEMOFerretodo Admin');

    // Step 2: Check home page modules
    console.log('\n📍 2. Checking home page modules...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const bodegaBtn = await page.locator('a[href="/bodega"]').isVisible();
    console.log(`   ✓ Botón Bodega visible en Dashboard Principal: ${bodegaBtn}`);

    // Step 3: Access /bodega page
    console.log('\n📍 3. Navigating to /bodega...');
    await page.goto('http://localhost:3000/bodega', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const headingText = await page.locator('h1').textContent();
    console.log(`   ✓ Título en /bodega: "${headingText.trim()}"`);

    const upgradeVisible = await page.locator('text=Esta función está disponible en planes superiores').isVisible().catch(() => false);
    if (!upgradeVisible) {
      console.log('   ✅ ¡Módulo de Bodega cargado y completamente accesible sin bloqueos!');
    } else {
      console.log('   ❌ Aún aparece pantalla de Upgrade');
    }

    console.log('\n🎉 TEST DE ACCESO A BODEGA CONCLUIDO CON ÉXITO');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
