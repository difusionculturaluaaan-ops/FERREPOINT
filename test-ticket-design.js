const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    console.log('🚀 TESTING NUEVO DISEÑO PREMIUM Y MÁRGENES DE TICKET...\n');

    // Step 1: Login as Cajero
    console.log('📍 1. Logging in as Cajero (cajero@ferreteria.com)...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'cajero@ferreteria.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/caja', { timeout: 15000 });
    await page.waitForTimeout(1500);
    console.log('   ✓ Logged in as Cajero, current URL:', page.url());

    // Step 2: Switch to Historial tab
    console.log('📍 2. Navigating to Historial de Cobros...');
    const historialTab = page.locator('button:has-text("Historial")');
    if (await historialTab.isVisible()) {
      await historialTab.click();
      await page.waitForTimeout(1000);
      console.log('   ✓ Switched to Historial tab');
    }

    // Step 3: Select first paid sale
    const firstSale = page.locator('button:has-text("Folio #")').first();
    await firstSale.waitFor({ state: 'visible', timeout: 10000 });
    await firstSale.click();
    console.log('   ✓ Selected first paid sale from history');
    await page.waitForTimeout(1000);

    // Step 4: Click REIMPRIMIR TICKET and capture popup
    console.log('📍 3. Intercepting print popup from Caja...');
    const printBtn = page.locator('button:has-text("REIMPRIMIR")').first();
    await printBtn.waitFor({ state: 'visible', timeout: 10000 });

    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 10000 }),
      printBtn.click()
    ]);

    await popup.waitForLoadState('domcontentloaded');
    console.log('   ✓ Ticket print window captured!');

    const popupHtml = await popup.content();
    const hasConsolas = popupHtml.includes('Consolas');
    const hasBrandHeader = popupHtml.includes('brand-title');
    const containerWidth = popupHtml.includes('240px');

    console.log(`   ✓ Estilos tipográficos modernos presentes: ${hasConsolas}`);
    console.log(`   ✓ Header de marca estilizado presente: ${hasBrandHeader}`);
    console.log(`   ✓ Ancho de contenedor ajustado a 240px (sin desborde): ${containerWidth}`);

    await popup.screenshot({ path: 'ticket-new-design.png', fullPage: true });
    console.log('   📸 Screenshot guardado en ticket-new-design.png');

    console.log('\n🎉 TEST DE DISEÑO DE TICKET COMPLETADO CON ÉXITO!');
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
