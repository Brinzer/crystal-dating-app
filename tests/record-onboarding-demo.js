/**
 * Full Onboarding Experience Video Recording
 * Simulates a complete user journey through Chris Openheart onboarding
 */

const { chromium } = require('playwright');
const path = require('path');

const ONBOARDING_URL = 'http://localhost:3500/onboarding.html';
const VIDEO_PATH = path.join(__dirname, '../videos/onboarding-full-demo.webm');

// Realistic user responses for a complete profile
const USER_RESPONSES = {
    name: "Alex Rivera",
    age: "28",
    gender: "Male",
    city: "San Francisco",
    state: "California",
    ageRange: "25 to 32",
    genderPreference: "Women",
    occupation: "Software Engineer",
    education: "Bachelor's in Computer Science",
    interests: "hiking, photography, cooking, traveling, music",
    activityLevel: "active - I love outdoor adventures",
    drinking: "social drinker",
    smoking: "no, I don't smoke",
    bio: "Love exploring new hiking trails and trying out new restaurants. Looking for someone who enjoys both adventure and cozy nights in. Always up for spontaneous road trips!"
};

async function recordOnboarding() {
    console.log('\n🎥 Starting Full Onboarding Demo Recording...\n');

    // Launch browser with video recording
    const browser = await chromium.launch({
        headless: false, // Show browser so we can see the demo
        slowMo: 800 // Slow down actions for visibility (800ms between actions)
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        recordVideo: {
            dir: path.dirname(VIDEO_PATH),
            size: { width: 1280, height: 900 }
        }
    });

    const page = await context.newPage();

    try {
        console.log('📍 Navigating to onboarding page...');
        await page.goto(ONBOARDING_URL);
        await page.waitForLoadState('networkidle');

        console.log('⏳ Waiting for Chris to greet user...');
        // Wait for initial greeting messages
        await page.waitForSelector('.message.chris', { timeout: 5000 });
        await page.waitForTimeout(3000); // Let user see the greeting

        console.log('👤 Starting conversation flow...\n');

        // Question 1: Name
        console.log('  Q1: Name');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.name);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 2: Age
        console.log('  Q2: Age');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.age);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 3: Gender
        console.log('  Q3: Gender');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.gender);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 4: City
        console.log('  Q4: City');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.city);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 5: State
        console.log('  Q5: State');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.state);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 6: Age range preference
        console.log('  Q6: Age Range Preference');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.ageRange);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 7: Gender preference
        console.log('  Q7: Gender Preference');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.genderPreference);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 8: Occupation
        console.log('  Q8: Occupation');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.occupation);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 9: Education
        console.log('  Q9: Education');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.education);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 10: Interests
        console.log('  Q10: Interests');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.interests);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 11: Activity level
        console.log('  Q11: Activity Level');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.activityLevel);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 12: Drinking
        console.log('  Q12: Drinking Habits');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.drinking);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 13: Smoking
        console.log('  Q13: Smoking Status');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.smoking);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(2000);

        // Question 14: Bio
        console.log('  Q14: Bio');
        await page.waitForTimeout(2000);
        await page.fill('#userInput', USER_RESPONSES.bio);
        await page.waitForTimeout(1000);
        await page.click('#sendBtn');
        await page.waitForTimeout(3000);

        // Check progress
        const progress = await page.locator('#progressPercent').textContent();
        console.log(`\n✅ Onboarding complete! Progress: ${progress}%`);

        // Wait for completion message and any redirect
        await page.waitForTimeout(5000);

        console.log('\n📹 Recording complete! Processing video...');

    } catch (error) {
        console.error('\n❌ Error during recording:', error.message);
        throw error;
    } finally {
        // Close context to finish video recording
        await context.close();
        await browser.close();

        // Get the actual video path (Playwright generates unique names)
        console.log('\n✨ Video saved!');
        console.log(`📁 Location: ${path.dirname(VIDEO_PATH)}`);
        console.log('🎬 Look for files named like: <hash>-<timestamp>.webm\n');
    }
}

// Run the recording
recordOnboarding().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
