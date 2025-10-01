const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  console.log('Testing transcription API endpoint...\n');

  // Create a simple test audio file (empty WebM for testing)
  const testAudio = Buffer.from([
    0x1a, 0x45, 0xdf, 0xa3, // EBML header
    0x00, 0x00, 0x00, 0x20  // Minimal WebM structure
  ]);

  const formData = new FormData();
  formData.append('audio', testAudio, {
    filename: 'test.webm',
    contentType: 'audio/webm'
  });

  try {
    console.log('Sending request to deployed API...');
    const response = await fetch('https://prealpha.crystalapp.org/api/transcribe', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ SUCCESS: Transcription endpoint working!');
    } else {
      console.log('\n❌ FAILED:', result.error || result.message);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
})();
