// Test D-ID API directly
async function testDIDAPI() {
  const DID_API_KEY = 'bWV0b3JiZXJ0QGdtYWlsLmNvbQ:JAn6hh4wQ2TFoOAl-GD4F';
  const DID_BASE_URL = 'https://api.d-id.com';

  console.log('🧪 Testing D-ID API directly...');
  console.log('API Key:', DID_API_KEY);
  console.log('Base URL:', DID_BASE_URL);

  try {
    // Test 1: Simple stream creation (exact format from official demo)
    console.log('\n📡 Test 1: Creating stream with minimal payload...');
    
    const response = await fetch(`${DID_BASE_URL}/talks/streams`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg'
      })
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response Body:', responseText);

    if (!response.ok) {
      console.log('❌ Stream creation failed');
      
      // Test 2: Check API key validity with a simpler endpoint
      console.log('\n📡 Test 2: Testing API key with credits endpoint...');
      
      const creditsResponse = await fetch(`${DID_BASE_URL}/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`
        }
      });

      console.log('Credits Response Status:', creditsResponse.status);
      const creditsText = await creditsResponse.text();
      console.log('Credits Response:', creditsText);

      if (creditsResponse.ok) {
        console.log('✅ API key is valid - credits endpoint works');
      } else {
        console.log('❌ API key appears to be invalid');
      }

    } else {
      console.log('✅ Stream creation successful!');
      const streamData = JSON.parse(responseText);
      console.log('Stream ID:', streamData.id);
      console.log('Session ID:', streamData.session_id);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testDIDAPI();
