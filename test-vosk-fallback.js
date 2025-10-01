const { chromium } = require('playwright');

(async () => {
  console.log('Starting Vosk fallback test (simulating Opera browser)...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const context = await browser.newContext({
    permissions: ['microphone']
  });

  const page = await context.newPage();

  // Block Web Speech API to simulate Opera
  await page.addInitScript(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });

  // Listen to console logs
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  // Navigate to deployed site
  console.log('Navigating to deployed site...');
  await page.goto('https://prealpha.crystalapp.org/onboarding.html', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(2000);

  // Check initial state
  const hasVoiceBtn = await page.isVisible('#voiceBtn');
  console.log('Voice button visible:', hasVoiceBtn);

  // Take initial screenshot
  await page.screenshot({ path: 'screenshots/vosk-test-1-initial.png' });
  console.log('Screenshot saved: vosk-test-1-initial.png');

  // Click voice button
  console.log('Clicking voice button...');
  await page.click('#voiceBtn');
  await page.waitForTimeout(2000);

  // Check if recording
  const isRecording = await page.evaluate(() => {
    const btn = document.getElementById('voiceBtn');
    return btn ? btn.classList.contains('recording') : false;
  });
  console.log('Recording state:', isRecording);

  // Take recording screenshot
  await page.screenshot({ path: 'screenshots/vosk-test-2-recording.png' });
  console.log('Screenshot saved: vosk-test-2-recording.png');

  // Check messages
  const messages = await page.evaluate(() => {
    const msgElements = document.querySelectorAll('.message.chris .message-content');
    return Array.from(msgElements).map(el => el.textContent.trim());
  });
  console.log('Chris messages:', messages);

  // Wait a bit more to see any errors
  await page.waitForTimeout(3000);

  await browser.close();
  console.log('Test complete!');
})();
