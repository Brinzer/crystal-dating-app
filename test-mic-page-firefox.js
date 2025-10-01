const { firefox } = require('playwright');

(async () => {
  console.log('=== Testing mic-test.html in Firefox ===\n');

  const browser = await firefox.launch({
    headless: false,
    firefoxUserPrefs: {
      'media.navigator.permission.disabled': true,
      'permissions.default.microphone': 1
    }
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  page.on('console', msg => {
    console.log(`[Browser]:`, msg.text());
  });

  console.log('Opening mic-test.html...');
  await page.goto('https://prealpha.crystalapp.org/mic-test.html', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: 'screenshots/mic-test-1-loaded.png', fullPage: true });
  console.log('Screenshot: mic-test-1-loaded.png');

  // Switch to Server Transcription mode
  console.log('\nSwitching to Server Transcription mode...');
  await page.click('#serverBtn');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'screenshots/mic-test-2-server-mode.png', fullPage: true });
  console.log('Screenshot: mic-test-2-server-mode.png');

  // Click microphone
  console.log('\nClicking microphone button...');
  await page.click('#micBtn');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'screenshots/mic-test-3-recording.png', fullPage: true });
  console.log('Screenshot: mic-test-3-recording.png');

  // Wait for auto-stop and API response
  console.log('\nWaiting for recording to complete and API response...');
  await page.waitForTimeout(7000);

  await page.screenshot({ path: 'screenshots/mic-test-4-result.png', fullPage: true });
  console.log('Screenshot: mic-test-4-result.png');

  // Extract API response and logs
  const apiResponse = await page.textContent('#apiResponse');
  const logEntries = await page.evaluate(() => {
    const logs = document.querySelectorAll('.log-entry');
    return Array.from(logs).map(el => el.textContent);
  });

  console.log('\n=== API Response ===');
  console.log(apiResponse);

  console.log('\n=== Log Entries (last 10) ===');
  logEntries.slice(-10).forEach(log => console.log(log));

  await browser.close();
  console.log('\n✅ Test complete!');
})();
