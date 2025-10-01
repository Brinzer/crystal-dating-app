const { chromium } = require('playwright');

(async () => {
  console.log('Testing complete Vosk transcription system...');

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--allow-file-access-from-files'
    ]
  });

  const context = await browser.newContext({
    permissions: ['microphone']
  });

  const page = await context.newPage();

  // Block Web Speech API to force Vosk
  await page.addInitScript(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });

  // Listen to all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`[BROWSER ERROR]:`, text);
    } else if (text.includes('Vosk') || text.includes('recogni')) {
      console.log(`[BROWSER ${type}]:`, text);
    }
  });

  // Navigate to deployed site
  console.log('Navigating to deployed site...');
  await page.goto('https://prealpha.crystalapp.org/onboarding.html', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  console.log('\n=== Initial State ===');
  const voiceReady = await page.evaluate(() => {
    return typeof window.Vosk !== 'undefined';
  });
  console.log('Vosk library loaded:', voiceReady);

  // Take initial screenshot
  await page.screenshot({ path: 'screenshots/vosk-transcription-1-ready.png' });

  console.log('\n=== Starting Voice Recording ===');
  await page.click('#voiceBtn');
  await page.waitForTimeout(5000); // Wait 5 seconds for model loading

  // Check recording state
  const isRecording = await page.evaluate(() => {
    return document.getElementById('voiceBtn').classList.contains('recording');
  });
  console.log('Recording active:', isRecording);

  // Take recording screenshot
  await page.screenshot({ path: 'screenshots/vosk-transcription-2-recording.png' });

  // Wait for auto-stop (10 seconds timeout)
  console.log('\n=== Waiting for recording to complete ===');
  await page.waitForTimeout(11000);

  // Check if recording stopped
  const recordingStopped = await page.evaluate(() => {
    return !document.getElementById('voiceBtn').classList.contains('recording');
  });
  console.log('Recording stopped:', recordingStopped);

  // Get Chris messages to see results
  const chrisMessages = await page.evaluate(() => {
    const messages = document.querySelectorAll('.message.chris .message-content');
    return Array.from(messages).map(el => el.textContent.trim());
  });

  console.log('\n=== Chris Messages ===');
  chrisMessages.forEach((msg, i) => {
    console.log(`${i + 1}. ${msg}`);
  });

  // Get user messages (if any transcription occurred)
  const userMessages = await page.evaluate(() => {
    const messages = document.querySelectorAll('.message.user .message-content');
    return Array.from(messages).map(el => el.textContent.trim());
  });

  if (userMessages.length > 0) {
    console.log('\n=== User Messages (Transcribed) ===');
    userMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg}`);
    });
  }

  // Take final screenshot
  await page.screenshot({ path: 'screenshots/vosk-transcription-3-complete.png' });

  console.log('\n=== Test Complete ===');
  await browser.close();
})();
