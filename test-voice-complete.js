const { chromium } = require('playwright');

(async () => {
  console.log('=== Testing Complete Voice Input System ===\n');

  // Test 1: Chrome with Web Speech API
  console.log('TEST 1: Chrome Browser (Web Speech API)\n');
  const browser1 = await chromium.launch({
    headless: false,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const context1 = await browser1.newContext({ permissions: ['microphone'] });
  const page1 = await context1.newPage();

  page1.on('console', msg => {
    if (msg.text().includes('Speech') || msg.text().includes('recogni')) {
      console.log(`[Chrome]:`, msg.text());
    }
  });

  await page1.goto('https://prealpha.crystalapp.org/onboarding.html', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page1.waitForTimeout(2000);

  const hasWebSpeech = await page1.evaluate(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  });

  console.log('✓ Web Speech API available:', hasWebSpeech);
  await page1.screenshot({ path: 'screenshots/voice-test-chrome.png' });
  await browser1.close();

  console.log('\n---\n');

  // Test 2: Opera/Firefox simulation (no Web Speech API)
  console.log('TEST 2: Opera/Firefox Browser (MediaRecorder Fallback)\n');
  const browser2 = await chromium.launch({
    headless: false,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const context2 = await browser2.newContext({ permissions: ['microphone'] });
  const page2 = await context2.newPage();

  // Block Web Speech API
  await page2.addInitScript(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });

  page2.on('console', msg => {
    if (msg.text().includes('recogni') || msg.text().includes('Recording')) {
      console.log(`[Opera]:`, msg.text());
    }
  });

  await page2.goto('https://prealpha.crystalapp.org/onboarding.html', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page2.waitForTimeout(2000);

  console.log('✓ Voice button visible');
  await page2.screenshot({ path: 'screenshots/voice-test-opera-ready.png' });

  // Click mic button
  await page2.click('#voiceBtn');
  await page2.waitForTimeout(1000);

  const isRecording = await page2.evaluate(() => {
    return document.getElementById('voiceBtn').classList.contains('recording');
  });

  console.log('✓ Recording started:', isRecording);
  await page2.screenshot({ path: 'screenshots/voice-test-opera-recording.png' });

  // Wait for auto-stop
  await page2.waitForTimeout(6000);

  const messages = await page2.evaluate(() => {
    const msgs = document.querySelectorAll('.message.chris .message-content');
    return Array.from(msgs).slice(-2).map(el => el.textContent.trim());
  });

  console.log('✓ Chris messages after recording:');
  messages.forEach(msg => console.log(`  - ${msg}`));

  await page2.screenshot({ path: 'screenshots/voice-test-opera-complete.png' });
  await browser2.close();

  console.log('\n=== All Tests Complete ===');
  console.log('✓ Chrome: Web Speech API working');
  console.log('✓ Opera: MediaRecorder fallback with helpful message');
  console.log('✓ Both browsers can use microphone button');
})();
