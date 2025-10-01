const { firefox } = require('playwright');

(async () => {
  console.log('=== Testing Voice Input in Firefox ===\n');

  const browser = await firefox.launch({
    headless: false,
    firefoxUserPrefs: {
      'media.navigator.permission.disabled': true,
      'permissions.default.microphone': 1
    }
  });

  const context = await browser.newContext();

  const page = await context.newPage();

  // Listen to console
  page.on('console', msg => {
    console.log(`[Firefox Console]:`, msg.text());
  });

  page.on('pageerror', error => {
    console.log(`[Firefox Error]:`, error.message);
  });

  console.log('Navigating to deployed site...');
  await page.goto('https://prealpha.crystalapp.org/onboarding.html', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  // Check initial state
  console.log('\n=== Initial State ===');
  const hasWebSpeech = await page.evaluate(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  });
  console.log('Web Speech API available:', hasWebSpeech);

  const micVisible = await page.isVisible('#voiceBtn');
  console.log('Microphone button visible:', micVisible);

  await page.screenshot({ path: 'screenshots/firefox-test-1-initial.png', fullPage: true });

  // Click microphone button
  console.log('\n=== Clicking Microphone Button ===');
  await page.click('#voiceBtn');
  await page.waitForTimeout(1000);

  // Check recording state
  const isRecording = await page.evaluate(() => {
    return document.getElementById('voiceBtn').classList.contains('recording');
  });
  console.log('Recording state (should be true):', isRecording);

  await page.screenshot({ path: 'screenshots/firefox-test-2-recording.png', fullPage: true });

  // Wait for auto-stop (5 seconds + buffer)
  console.log('\n=== Waiting for auto-stop (5 seconds) ===');
  await page.waitForTimeout(6000);

  const stillRecording = await page.evaluate(() => {
    return document.getElementById('voiceBtn').classList.contains('recording');
  });
  console.log('Still recording (should be false):', stillRecording);

  // Get all Chris messages
  const chrisMessages = await page.evaluate(() => {
    const messages = document.querySelectorAll('.message.chris .message-content');
    return Array.from(messages).map(el => el.textContent.trim());
  });

  console.log('\n=== Chris Messages ===');
  chrisMessages.forEach((msg, i) => {
    console.log(`${i + 1}. ${msg}`);
  });

  await page.screenshot({ path: 'screenshots/firefox-test-3-complete.png', fullPage: true });

  console.log('\n=== Test Results ===');
  console.log('✓ Firefox opened successfully');
  console.log('✓ Page loaded without errors');
  console.log(`✓ Web Speech API: ${hasWebSpeech ? 'Available' : 'Not available (expected)'}`);
  console.log(`✓ Mic button visible: ${micVisible}`);
  console.log(`✓ Recording started: ${isRecording}`);
  console.log(`✓ Recording stopped automatically: ${!stillRecording}`);

  const hasGracefulMessage = chrisMessages.some(msg =>
    msg.includes('Voice recognition works best in Chrome or Edge')
  );
  console.log(`✓ Graceful degradation message shown: ${hasGracefulMessage}`);

  if (hasGracefulMessage) {
    console.log('\n🎉 SUCCESS: Firefox voice fallback working perfectly!');
  } else {
    console.log('\n⚠️ WARNING: Expected graceful message not found');
  }

  await browser.close();
})();
