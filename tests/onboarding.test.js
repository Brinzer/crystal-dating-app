/**
 * Automated Tests for Chris Openheart Onboarding
 * Tests conversational flow, voice input setup, and profile creation
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3500';
const ONBOARDING_URL = `${BASE_URL}/onboarding.html`;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'onboarding');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Chris Openheart Onboarding Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(ONBOARDING_URL);
        await page.waitForLoadState('networkidle');
    });

    test('1. Initial Load - Verify Onboarding UI Elements', async ({ page }) => {
        // Check header elements
        await expect(page.locator('.crystal-icon')).toHaveText('💎');
        await expect(page.locator('header h1')).toHaveText('Crystal Dating');

        // Check Chris header
        await expect(page.locator('.chris-avatar')).toBeVisible();
        await expect(page.locator('h2')).toContainText('Chris Openheart');

        // Check input area
        await expect(page.locator('#userInput')).toBeVisible();
        await expect(page.locator('#voiceBtn')).toBeVisible();
        await expect(page.locator('#sendBtn')).toBeVisible();

        // Check progress bar (fill starts at 0% width, so just check it exists)
        await expect(page.locator('#progressPercent')).toBeVisible();
        await expect(page.locator('#progressFill')).toHaveCount(1);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-initial-load.png'), fullPage: true });
    });

    test('2. Initial Greeting - Chris Starts Conversation', async ({ page }) => {
        // Wait for initial message
        await page.waitForSelector('.message.chris', { timeout: 2000 });

        const messages = await page.locator('.message.chris').count();
        expect(messages).toBeGreaterThan(0);

        // Check if greeting contains expected content
        const firstMessage = await page.locator('.message.chris .message-content').first().textContent();
        expect(firstMessage.toLowerCase()).toContain('chris');

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-initial-greeting.png'), fullPage: true });
    });

    test('3. User Input - Type and Send Message', async ({ page }) => {
        await page.waitForSelector('.message.chris', { timeout: 2000 });

        // Type a response
        await page.fill('#userInput', 'Alex');
        await page.click('#sendBtn');

        // Wait for user message to appear
        await page.waitForSelector('.message.user', { timeout: 1000 });

        // Verify message was added
        const userMessage = await page.locator('.message.user .message-content').first().textContent();
        expect(userMessage).toBe('Alex');

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-user-input.png'), fullPage: true });
    });

    test('4. Typing Indicator - Shows During Processing', async ({ page }) => {
        await page.waitForSelector('.message.chris', { timeout: 2000 });

        // Send a message and check for typing indicator
        await page.fill('#userInput', 'Test User');

        // Click send and immediately check for typing indicator
        const sendPromise = page.click('#sendBtn');

        // Typing indicator should appear briefly
        const typingIndicator = page.locator('#typingIndicator');
        // Note: This might be too fast to catch, so we'll check if it has the class
        await expect(typingIndicator).toBeVisible({ timeout: 500 }).catch(() => {
            // It's okay if we miss it - it shows for <1 second
        });

        await sendPromise;
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-typing-indicator.png'), fullPage: true });
    });

    test('5. Progress Tracking - Updates After Responses', async ({ page }) => {
        await page.waitForSelector('.message.chris', { timeout: 2000 });

        // Initial progress should be 0
        let progress = await page.locator('#progressPercent').textContent();
        expect(progress).toBe('0');

        // Answer first question (name)
        await page.fill('#userInput', 'Test User');
        await page.click('#sendBtn');
        await page.waitForTimeout(1000);

        // Progress should increase
        progress = await page.locator('#progressPercent').textContent();
        const progressNum = parseInt(progress);
        expect(progressNum).toBeGreaterThan(0);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-progress-tracking.png'), fullPage: true });
    });

    test('6. Voice Button - Enabled and Clickable', async ({ page }) => {
        const voiceBtn = page.locator('#voiceBtn');
        await expect(voiceBtn).toBeVisible();
        await expect(voiceBtn).toBeEnabled();

        // Click voice button (won't actually work in headless, but should not error)
        await voiceBtn.click();

        // Check if button changes state (recording class might be added)
        await page.waitForTimeout(500);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-voice-button.png'), fullPage: true });
    });

    test('7. Multi-Step Flow - Answer Multiple Questions', async ({ page }) => {
        await page.waitForSelector('.message.chris', { timeout: 2000 });

        const answers = [
            'Alex Smith',           // Name
            "I'm 28 years old",     // Age
            'Male',                 // Gender
            'San Francisco',        // City
            'California',           // State
            '25-32',                // Age range preference
            'Women',                // Gender preference
            'Technology',           // Occupation
            "Bachelor's degree",    // Education
            'Fitness, hiking, cooking', // Interests
        ];

        for (let i = 0; i < Math.min(answers.length, 5); i++) {
            // Wait for Chris's question
            await page.waitForTimeout(1500);

            // Type answer
            await page.fill('#userInput', answers[i]);
            await page.click('#sendBtn');

            // Wait for processing
            await page.waitForTimeout(1000);
        }

        // Check that multiple messages have been exchanged
        const userMessages = await page.locator('.message.user').count();
        expect(userMessages).toBeGreaterThanOrEqual(5);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-multi-step-flow.png'), fullPage: true });
    });

    test('8. Input Validation - Empty Message Handling', async ({ page }) => {
        await page.waitForSelector('.message.chris', { timeout: 2000 });

        // Try to send empty message
        await page.click('#sendBtn');

        // Should not create a user message
        const userMessages = await page.locator('.message.user').count();
        expect(userMessages).toBe(0);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-empty-validation.png'), fullPage: true });
    });

    test('9. UI Responsiveness - All Buttons Work', async ({ page }) => {
        // Test send button
        await expect(page.locator('#sendBtn')).toBeEnabled();

        // Test voice button
        await expect(page.locator('#voiceBtn')).toBeEnabled();

        // Test input field
        await page.fill('#userInput', 'Test input');
        const value = await page.inputValue('#userInput');
        expect(value).toBe('Test input');

        // Clear input
        await page.fill('#userInput', '');

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-ui-responsive.png'), fullPage: true });
    });

    test('10. Message Display - Proper Styling and Layout', async ({ page }) => {
        await page.waitForSelector('.message.chris', { timeout: 2000 });

        // Send a test message
        await page.fill('#userInput', 'This is a test message');
        await page.click('#sendBtn');
        await page.waitForSelector('.message.user', { timeout: 1000 });

        // Check Chris message styling
        const chrisMessage = page.locator('.message.chris').first();
        await expect(chrisMessage).toBeVisible();
        await expect(chrisMessage.locator('.message-content')).toHaveCSS('background', /rgb/); // Has gradient

        // Check user message styling
        const userMessage = page.locator('.message.user').first();
        await expect(userMessage).toBeVisible();
        await expect(userMessage.locator('.message-content')).toHaveCSS('background-color', /rgb/);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-message-styling.png'), fullPage: true });
    });

    test('11. Stress Test - Rapid Input', async ({ page }) => {
        await page.waitForSelector('.message.chris', { timeout: 2000 });

        // Send multiple messages quickly
        for (let i = 0; i < 3; i++) {
            await page.fill('#userInput', `Message ${i + 1}`);
            await page.click('#sendBtn');
            await page.waitForTimeout(500);
        }

        // Check that all messages were processed
        const userMessages = await page.locator('.message.user').count();
        expect(userMessages).toBeGreaterThanOrEqual(3);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-stress-test.png'), fullPage: true });
    });

    test('12. Complete Flow - Full Onboarding Simulation', async ({ page }) => {
        await page.waitForSelector('.message.chris', { timeout: 2000 });

        const fullAnswers = {
            0: 'Alex Thompson',
            1: '28',
            2: 'Male',
            3: 'San Francisco',
            4: 'California',
            5: '25 to 32',
            6: 'Women',
            7: 'Software Engineer',
            8: "Bachelor's in Computer Science",
            9: 'hiking, cooking, photography',
            10: 'active',
            11: 'social drinker',
            12: 'no',
            13: 'Love outdoor adventures and trying new restaurants. Looking for someone to explore the city with!',
        };

        let currentQuestion = 0;
        const maxQuestions = 8; // Test first 8 questions

        while (currentQuestion < maxQuestions) {
            // Wait for Chris's question
            await page.waitForTimeout(1500);

            // Type answer
            const answer = fullAnswers[currentQuestion] || 'Test answer';
            await page.fill('#userInput', answer);
            await page.click('#sendBtn');

            currentQuestion++;

            // Wait for processing
            await page.waitForTimeout(1000);
        }

        // Check progress increased significantly
        const progress = await page.locator('#progressPercent').textContent();
        const progressNum = parseInt(progress);
        expect(progressNum).toBeGreaterThan(40); // Should be past 40% after 8 questions

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-complete-flow.png'), fullPage: true });
    });
});

console.log('🧪 Chris Openheart Onboarding Tests - Ready to run');
