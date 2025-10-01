/**
 * Interactive UX Test - Test buttons, interactions, profile switching
 */

const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const screenshotDir = 'test-screenshots/ux-test-session';

    console.log('\n🎬 Starting Interactive UX Test\n');

    // Test 1: Main app initial state
    await page.goto('https://prealpha.crystalapp.org/index.html');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${screenshotDir}/05-initial-profile.png`, fullPage: true });
    console.log('✅ Screenshot 5: Initial profile');

    // Test 2: Click "Like" button
    await page.click('button:has-text("👍")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/06-after-like-click.png`, fullPage: true });
    console.log('✅ Screenshot 6: After like button');

    // Test 3: Next profile (should advance)
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/07-next-profile.png`, fullPage: true });
    console.log('✅ Screenshot 7: Next profile loaded');

    // Test 4: Click "Pass" button
    await page.click('button:has-text("👎")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/08-after-pass-click.png`, fullPage: true });
    console.log('✅ Screenshot 8: After pass button');

    // Test 5: Change mode to "Casual"
    await page.click('button:has-text("Casual")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/09-casual-mode.png`, fullPage: true });
    console.log('✅ Screenshot 9: Casual mode');

    // Test 6: Keyboard shortcut test (right arrow)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/10-keyboard-right-arrow.png`, fullPage: true });
    console.log('✅ Screenshot 10: After right arrow key');

    console.log('\n🎉 Interactive test complete!\n');

    await browser.close();
})();
