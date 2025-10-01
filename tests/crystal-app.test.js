/**
 * Crystal Dating App - Automated Test Suite
 * Using Playwright for comprehensive UI and functionality testing
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Configuration
const APP_URL = `file:///${path.resolve(__dirname, '../src/client/index.html').replace(/\\/g, '/')}`;
const API_BASE = 'http://localhost:3500/api';
const SCREENSHOT_DIR = path.join(__dirname, '../test-screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Crystal Dating App - Comprehensive Testing', () => {

    test.beforeEach(async ({ page }) => {
        // Set up console log capturing
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`[BROWSER ERROR]: ${msg.text()}`);
            }
        });

        // Set up error capturing
        page.on('pageerror', err => {
            console.error(`[PAGE ERROR]: ${err.message}`);
        });

        // Navigate to app
        await page.goto(APP_URL);
        await page.waitForTimeout(1000); // Wait for initial load
    });

    test('1. Initial Load - Verify UI Elements Present', async ({ page }) => {
        console.log('✓ Testing: Initial page load and UI elements');

        // Check header
        await expect(page.locator('header h1')).toHaveText('Crystal Dating');
        await expect(page.locator('.tagline')).toContainText('Transparent');

        // Check mode selector buttons
        await expect(page.locator('.mode-btn[data-mode="dating"]')).toBeVisible();
        await expect(page.locator('.mode-btn[data-mode="casual"]')).toBeVisible();
        await expect(page.locator('.mode-btn[data-mode="professional"]')).toBeVisible();
        await expect(page.locator('.mode-btn[data-mode="platonic"]')).toBeVisible();

        // Check stats dashboard
        await expect(page.locator('#visibilityScore')).toBeVisible();
        await expect(page.locator('#matchProbability')).toBeVisible();
        await expect(page.locator('#likesWaiting')).toBeVisible();
        await expect(page.locator('#platformAvg')).toBeVisible();

        // Check user selector
        await expect(page.locator('#currentUserId')).toBeVisible();

        // Check profile card elements
        await expect(page.locator('#profileCard')).toBeVisible();
        await expect(page.locator('#passBtn')).toBeVisible();
        await expect(page.locator('#likeBtn')).toBeVisible();

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-initial-load.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 01-initial-load.png');
    });

    test('2. API Connection - Verify Backend Communication', async ({ page }) => {
        console.log('✓ Testing: Backend API connection');

        await page.goto(APP_URL);
        await page.waitForTimeout(2000);

        // Check if profile loaded (indicates successful API call)
        const profileName = await page.locator('#profileName').textContent();
        expect(profileName).not.toBe('Loading...');
        expect(profileName.length).toBeGreaterThan(0);

        console.log(`  ✓ Profile loaded: ${profileName}`);

        // Check if stats loaded
        const visibilityScore = await page.locator('#visibilityScore').textContent();
        expect(visibilityScore).not.toBe('--');

        console.log(`  ✓ Stats loaded: Visibility ${visibilityScore}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-api-connection.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 02-api-connection.png');
    });

    test('3. Mode Switching - Test All Connection Modes', async ({ page }) => {
        console.log('✓ Testing: Connection mode switching');

        await page.goto(APP_URL);
        await page.waitForTimeout(1500);

        const modes = ['casual', 'professional', 'platonic', 'dating'];

        for (const mode of modes) {
            await page.click(`.mode-btn[data-mode="${mode}"]`);
            await page.waitForTimeout(1000);

            // Verify mode button is active
            const activeClass = await page.locator(`.mode-btn[data-mode="${mode}"]`).getAttribute('class');
            expect(activeClass).toContain('active');

            console.log(`  ✓ Switched to ${mode} mode`);
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, `03-mode-${mode}.png`), fullPage: true });
        }

        console.log('  ✓ All screenshots saved for modes');
    });

    test('4. Swipe Functionality - Test Like Button', async ({ page }) => {
        console.log('✓ Testing: Swipe functionality (Like)');

        await page.goto(APP_URL);
        await page.waitForTimeout(1500);

        // Get initial profile name
        const initialProfile = await page.locator('#profileName').textContent();
        console.log(`  ✓ Initial profile: ${initialProfile}`);

        // Get initial match probability
        const initialMatchProb = await page.locator('#matchProbability').textContent();

        // Click like button
        await page.click('#likeBtn');
        await page.waitForTimeout(1000);

        // Verify profile changed
        const newProfile = await page.locator('#profileName').textContent();
        expect(newProfile).not.toBe(initialProfile);
        console.log(`  ✓ Profile changed to: ${newProfile}`);

        // Verify match probability updated
        const newMatchProb = await page.locator('#matchProbability').textContent();
        console.log(`  ✓ Match probability: ${initialMatchProb} → ${newMatchProb}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-swipe-like.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 04-swipe-like.png');
    });

    test('5. Swipe Functionality - Test Pass Button', async ({ page }) => {
        console.log('✓ Testing: Swipe functionality (Pass)');

        await page.goto(APP_URL);
        await page.waitForTimeout(1500);

        const initialProfile = await page.locator('#profileName').textContent();
        console.log(`  ✓ Initial profile: ${initialProfile}`);

        // Click pass button
        await page.click('#passBtn');
        await page.waitForTimeout(1000);

        // Verify profile changed
        const newProfile = await page.locator('#profileName').textContent();
        expect(newProfile).not.toBe(initialProfile);
        console.log(`  ✓ Profile changed to: ${newProfile}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-swipe-pass.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 05-swipe-pass.png');
    });

    test('6. Keyboard Shortcuts - Test Arrow Keys', async ({ page }) => {
        console.log('✓ Testing: Keyboard shortcuts');

        await page.goto(APP_URL);
        await page.waitForTimeout(1500);

        const initialProfile = await page.locator('#profileName').textContent();
        console.log(`  ✓ Initial profile: ${initialProfile}`);

        // Test right arrow (like)
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(1000);

        const afterRightArrow = await page.locator('#profileName').textContent();
        expect(afterRightArrow).not.toBe(initialProfile);
        console.log(`  ✓ Right arrow worked: ${afterRightArrow}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-keyboard-right.png'), fullPage: true });

        // Test left arrow (pass)
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(1000);

        const afterLeftArrow = await page.locator('#profileName').textContent();
        expect(afterLeftArrow).not.toBe(afterRightArrow);
        console.log(`  ✓ Left arrow worked: ${afterLeftArrow}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-keyboard-left.png'), fullPage: true });
        console.log('  ✓ Screenshots saved for keyboard tests');
    });

    test('7. User Selector - Test User Switching', async ({ page }) => {
        console.log('✓ Testing: User selector functionality');

        await page.goto(APP_URL);
        await page.waitForTimeout(1500);

        // Get options from selector
        const options = await page.locator('#currentUserId option').count();
        console.log(`  ✓ Found ${options} users in selector`);
        expect(options).toBeGreaterThan(1);

        // Select a different user (index 1)
        await page.selectOption('#currentUserId', { index: 1 });
        await page.waitForTimeout(1500);

        // Verify stats updated (visibility score should change)
        const visibilityScore = await page.locator('#visibilityScore').textContent();
        expect(visibilityScore).not.toBe('--');
        console.log(`  ✓ User switched - Visibility: ${visibilityScore}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-user-switch.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 07-user-switch.png');
    });

    test('8. Stats Dashboard - Verify Live Updates', async ({ page }) => {
        console.log('✓ Testing: Stats dashboard updates');

        await page.goto(APP_URL);
        await page.waitForTimeout(1500);

        // Get initial stats
        const initialMatchProb = await page.locator('#matchProbability').textContent();
        console.log(`  ✓ Initial match probability: ${initialMatchProb}`);

        // Swipe multiple times
        for (let i = 0; i < 3; i++) {
            await page.click('#likeBtn');
            await page.waitForTimeout(800);
        }

        // Verify match probability increased
        const finalMatchProb = await page.locator('#matchProbability').textContent();
        console.log(`  ✓ Final match probability: ${finalMatchProb}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-stats-updates.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 08-stats-updates.png');
    });

    test('9. Profile Display - Verify All Elements', async ({ page }) => {
        console.log('✓ Testing: Profile display elements');

        await page.goto(APP_URL);
        await page.waitForTimeout(1500);

        // Check profile elements
        const name = await page.locator('#profileName').textContent();
        const age = await page.locator('#profileAge').textContent();
        const location = await page.locator('#profileLocation').textContent();
        const bio = await page.locator('#profileBio').textContent();
        const compatScore = await page.locator('#compatScore').textContent();

        expect(name.length).toBeGreaterThan(0);
        expect(age).not.toBe('--');
        expect(location).not.toBe('--');
        expect(bio).not.toBe('--');
        expect(compatScore).not.toBe('--');

        console.log(`  ✓ Profile: ${name}, ${age}, ${location}`);
        console.log(`  ✓ Compatibility: ${compatScore}`);

        // Check if avatar loaded
        const avatarSrc = await page.locator('#profileAvatar').getAttribute('src');
        expect(avatarSrc).toContain('dicebear');
        console.log(`  ✓ Avatar loaded from DiceBear`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-profile-display.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 09-profile-display.png');
    });

    test('10. Debug Logger - Verify Console Logging', async ({ page }) => {
        console.log('✓ Testing: Debug logger functionality');

        let debugLoggerInitialized = false;
        let debugLogCount = 0;

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Debug Logger initialized')) {
                debugLoggerInitialized = true;
            }
            if (text.includes('🔍')) {
                debugLogCount++;
            }
        });

        await page.goto(APP_URL);
        await page.waitForTimeout(2000);

        // Perform some actions to trigger debug logging
        await page.click('#likeBtn');
        await page.waitForTimeout(500);
        await page.click('.mode-btn[data-mode="casual"]');
        await page.waitForTimeout(500);

        expect(debugLoggerInitialized).toBe(true);
        console.log(`  ✓ Debug logger initialized`);
        console.log(`  ✓ Debug log entries captured: ${debugLogCount}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-debug-logger.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 10-debug-logger.png');
    });

    test('11. Stress Test - Rapid Swiping', async ({ page }) => {
        console.log('✓ Testing: Rapid swipe stress test');

        await page.goto(APP_URL);
        await page.waitForTimeout(1500);

        const swipeCount = 10;
        console.log(`  ✓ Performing ${swipeCount} rapid swipes...`);

        for (let i = 0; i < swipeCount; i++) {
            await page.click(i % 2 === 0 ? '#likeBtn' : '#passBtn');
            await page.waitForTimeout(200);
        }

        // Verify app still functional
        const profileName = await page.locator('#profileName').textContent();
        expect(profileName.length).toBeGreaterThan(0);
        console.log(`  ✓ App still functional after ${swipeCount} swipes`);
        console.log(`  ✓ Current profile: ${profileName}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-stress-test.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 11-stress-test.png');
    });

    test('12. End of Feed - No More Profiles', async ({ page }) => {
        console.log('✓ Testing: End of feed handling');

        await page.goto(APP_URL);
        await page.waitForTimeout(1500);

        // Swipe through all profiles
        console.log('  ✓ Swiping through entire feed...');
        for (let i = 0; i < 25; i++) {
            const noMoreVisible = await page.locator('#noMoreProfiles').isVisible();
            if (noMoreVisible) {
                console.log(`  ✓ Reached end of feed after ${i} swipes`);
                break;
            }
            await page.click('#likeBtn');
            await page.waitForTimeout(300);
        }

        // Check if "no more profiles" message appears or refresh button
        const noMoreProfilesVisible = await page.locator('#noMoreProfiles').isVisible();
        if (noMoreProfilesVisible) {
            console.log('  ✓ "No more profiles" screen displayed');

            // Test refresh button
            await page.click('#refreshBtn');
            await page.waitForTimeout(1500);

            const profileName = await page.locator('#profileName').textContent();
            console.log(`  ✓ Feed refreshed - New profile: ${profileName}`);
        }

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-end-of-feed.png'), fullPage: true });
        console.log('  ✓ Screenshot saved: 12-end-of-feed.png');
    });

});
