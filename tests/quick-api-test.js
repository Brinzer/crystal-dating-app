/**
 * Quick API Test - Check if main app loads data properly
 */

const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Listen for console messages
    page.on('console', msg => {
        console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
    });

    // Listen for network errors
    page.on('requestfailed', request => {
        console.log(`❌ FAILED: ${request.url()} - ${request.failure().errorText}`);
    });

    // Navigate to main app
    console.log('\n🔍 Testing Main App API Calls...\n');
    await page.goto('https://prealpha.crystalapp.org/index.html');

    // Wait for page to load
    await page.waitForTimeout(5000);

    // Check if profile loaded
    const profileName = await page.textContent('#profileName');
    console.log(`\n📊 Profile Name: ${profileName}`);

    // Check if stats loaded
    const visibilityScore = await page.textContent('.stats-number');
    console.log(`📊 Visibility Score: ${visibilityScore}`);

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/api-test-result.png', fullPage: true });

    console.log('\n✅ Test complete - screenshot saved\n');

    await browser.close();
})();
