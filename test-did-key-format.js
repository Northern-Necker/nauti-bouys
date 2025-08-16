// Test D-ID API key format and basic functionality
async function testDIDKeyFormat() {
  // Your current API key
  const DID_API_KEY = 'bWV0b3JiZXJ0QGdtYWlsLmNvbQ:JAn6hh4wQ2TFoOAl-GD4F';
  const DID_BASE_URL = 'https://api.d-id.com';

  console.log('🔑 Testing D-ID API Key Format...');
  console.log('API Key:', DID_API_KEY);
  
  // Decode the base64 part to check format
  try {
    const [email, key] = DID_API_KEY.split(':');
    console.log('Email (base64):', email);
    console.log('Key:', key);
    
    // Decode email
    const decodedEmail = atob(email);
    console.log('Decoded Email:', decodedEmail);
  } catch (e) {
    console.log('Key decode error:', e.message);
  }

  try {
    // Test 1: Credits endpoint (this worked before)
    console.log('\n📡 Test 1: Credits endpoint...');
    
    const creditsResponse = await fetch(`${DID_BASE_URL}/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`
      }
    });

    console.log('Credits Status:', creditsResponse.status);
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.text();
      console.log('Credits Response:', creditsData.substring(0, 200) + '...');
    } else {
      const creditsError = await creditsResponse.text();
      console.log('Credits Error:', creditsError);
    }

    // Test 2: Try streaming with a safe avatar URL
    console.log('\n📡 Test 2: Streaming with safe avatar...');
    
    const streamResponse = await fetch(`${DID_BASE_URL}/talks/streams`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg'
      })
    });

    console.log('Stream Status:', streamResponse.status);
    const streamText = await streamResponse.text();
    console.log('Stream Response:', streamText);

    // Test 3: Try with clips endpoint (might be more reliable)
    console.log('\n📡 Test 3: Testing clips endpoint...');
    
    const clipsResponse = await fetch(`${DID_BASE_URL}/clips`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: 'Hello, this is a test message.'
        },
        presenter_id: 'amy-Aq6OmGZnMt',
        driver_id: 'Vcq0R4a8F0'
      })
    });

    console.log('Clips Status:', clipsResponse.status);
    const clipsText = await clipsResponse.text();
    console.log('Clips Response:', clipsText.substring(0, 300) + '...');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testDIDKeyFormat();
