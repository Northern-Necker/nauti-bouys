// Test different D-ID endpoints to understand plan limitations
async function testDIDPlans() {
  const DID_API_KEY = 'bWV0b3JiZXJ0QGdtYWlsLmNvbQ:JAn6hh4wQ2TFoOAl-GD4F';
  const DID_BASE_URL = 'https://api.d-id.com';

  console.log('🧪 Testing D-ID Plan Capabilities...');

  try {
    // Test 1: Regular talks endpoint (should work on most plans)
    console.log('\n📡 Test 1: Regular talks endpoint...');
    
    const talksResponse = await fetch(`${DID_BASE_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg',
        script: {
          type: 'text',
          input: 'Hello, this is a test message.',
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-JennyNeural'
          }
        }
      })
    });

    console.log('Talks Response Status:', talksResponse.status);
    const talksText = await talksResponse.text();
    console.log('Talks Response:', talksText.substring(0, 200) + '...');

    // Test 2: Check what endpoints are available
    console.log('\n📡 Test 2: Testing clips endpoint...');
    
    const clipsResponse = await fetch(`${DID_BASE_URL}/clips`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`
      }
    });

    console.log('Clips Response Status:', clipsResponse.status);
    
    // Test 3: Try clips streaming instead of talks streaming
    console.log('\n📡 Test 3: Testing clips streaming...');
    
    const clipsStreamResponse = await fetch(`${DID_BASE_URL}/clips/streams`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        presenter_id: 'amy-jcwCkr1grs',
        driver_id: 'uM00QMwJ9x'
      })
    });

    console.log('Clips Stream Response Status:', clipsStreamResponse.status);
    const clipsStreamText = await clipsStreamResponse.text();
    console.log('Clips Stream Response:', clipsStreamText.substring(0, 200) + '...');

    // Test 4: Check account info
    console.log('\n📡 Test 4: Account information...');
    
    const accountResponse = await fetch(`${DID_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`
      }
    });

    console.log('Account Response Status:', accountResponse.status);
    if (accountResponse.ok) {
      const accountText = await accountResponse.text();
      console.log('Account Info:', accountText);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testDIDPlans();
