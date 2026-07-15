const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Starting test: Order Creation Flow\n');

    // Step 1: Navigate to login
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ Login page loaded\n');

    // Step 2: Fill login form
    console.log('📍 Step 2: Filling login credentials...');
    await page.fill('input[type="email"]', 'vendedor@ferreteria.com');
    await page.fill('input[type="password"]', 'password123');
    console.log('✅ Credentials filled\n');

    // Step 3: Click login button
    console.log('📍 Step 3: Clicking login button...');
    await page.click('button:has-text("Iniciar Sesión")');

    // Wait for redirect to /pos
    await page.waitForURL('**/pos', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✅ Redirected to /pos\n');

    // Step 4: Add products to cart
    console.log('📍 Step 4: Adding 3 products to cart...');
    const addButtons = await page.locator('button:has-text("+ Agregar")').all();
    console.log(`   Found ${addButtons.length} products available`);

    for (let i = 0; i < 3 && i < addButtons.length; i++) {
      await addButtons[i].click();
      await page.waitForTimeout(300);
      console.log(`   ✓ Added product ${i + 1}`);
    }
    console.log('✅ Products added to cart\n');

    // Step 5: Scroll to form
    console.log('📍 Step 5: Scrolling to order form...');
    const formSection = await page.locator('text=Nombre del Cliente');
    await formSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    console.log('✅ Form visible\n');

    // Step 6: Fill form
    console.log('📍 Step 6: Filling order form...');

    // Nombre
    await page.fill('input[name="clientName"]', 'Juan Test');
    console.log('   ✓ Nombre filled');

    // Teléfono
    await page.fill('input[name="clientPhone"]', '5551234567');
    console.log('   ✓ Teléfono filled');

    // Tipo Entrega
    await page.selectOption('select[name="deliveryType"]', 'domicilio');
    console.log('   ✓ Tipo Entrega selected');

    await page.waitForTimeout(500);

    // Dirección
    await page.fill('input[name="clientAddress"]', 'Calle Test 123');
    console.log('   ✓ Dirección filled');

    console.log('✅ Form completed\n');

    // Step 7: Click "GENERAR ORDEN"
    console.log('📍 Step 7: Clicking "✓ GENERAR ORDEN" button...');
    await page.click('button:has-text("GENERAR ORDEN")');

    // Wait for success message
    await page.waitForSelector('text=Orden creada exitosamente', { timeout: 5000 });
    await page.waitForTimeout(1000);
    console.log('✅ Success overlay appeared\n');

    // Step 8: Capture folio
    console.log('📍 Step 8: Capturing order folio...');
    const successText = await page.textContent('text=Orden creada exitosamente');
    console.log(`   Success message: "${successText}"`);

    const folioMatch = await page.textContent('text=/Folio: #/');
    console.log(`   Folio: ${folioMatch}\n`);

    console.log('═══════════════════════════════════════════════');
    console.log('✅ TEST PASSED: Order creation successful!');
    console.log('═══════════════════════════════════════════════\n');

    // Take screenshot
    await page.screenshot({ path: '/tmp/order-success.png' });
    console.log('📸 Screenshot saved to /tmp/order-success.png\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(`Error: ${error.message}\n`);

    // Take error screenshot
    await page.screenshot({ path: '/tmp/order-error.png' });
    console.log('📸 Error screenshot saved to /tmp/order-error.png');

    process.exit(1);
  } finally {
    await browser.close();
  }
})();
