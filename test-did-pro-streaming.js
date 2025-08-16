// Test D-ID Pro streaming with exact documentation format
async function testDIDProStreaming() {
  const DID_API_KEY = 'bWV0b3JiZXJ0QGdtYWlsLmNvbQ:JAn6hh4wQ2TFoOAl-GD4F';
  const DID_BASE_URL = 'https://api.d-id.com';

  console.log('🧪 Testing D-ID Pro Streaming API...');
  console.log('Plan: deid-pro (confirmed from credits)');
  console.log('Credits: 220 total, 202.75 remaining');

  try {
    // Test 1: Try the exact format from D-ID documentation
    console.log('\n📡 Test 1: Using exact documentation format...');
    
    const response1 = await fetch(`${DID_BASE_URL}/talks/streams`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg'
      })
    });

    console.log('Response Status:', response1.status);
    const response1Text = await response1.text();
    console.log('Response Body:', response1Text);

    if (!response1.ok) {
      // Test 2: Try with stream_warmup parameter
      console.log('\n📡 Test 2: Adding stream_warmup parameter...');
      
      const response2 = await fetch(`${DID_BASE_URL}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg',
          stream_warmup: true
        })
      });

      console.log('Response Status:', response2.status);
      const response2Text = await response2.text();
      console.log('Response Body:', response2Text);

      if (!response2.ok) {
        // Test 3: Try with a different avatar URL
        console.log('\n📡 Test 3: Trying different avatar URL...');
        
        const response3 = await fetch(`${DID_BASE_URL}/talks/streams`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source_url: 'https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg'
          })
        });

        console.log('Response Status:', response3.status);
        const response3Text = await response3.text();
        console.log('Response Body:', response3Text);

        if (!response3.ok) {
          // Test 4: Check if regular talks endpoint works
          console.log('\n📡 Test 4: Testing regular talks endpoint...');
          
          const response4 = await fetch(`${DID_BASE_URL}/talks`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${DID_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg',
              script: {
                type: 'text',
                input: 'Hello, this is a test.',
                provider: {
                  type: 'microsoft',
                  voice_id: 'en-US-JennyNeural'
                }
              }
            })
          });

          console.log('Talks Response Status:', response4.status);
          const response4Text = await response4.text();
          console.log('Talks Response:', response4Text.substring(0, 300) + '...');
        }
      }
    }

    // Test 5: Check account info to see plan details
    console.log('\n📡 Test 5: Checking account information...');
    
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
    } else {
      const accountError = await accountResponse.text();
      console.log('Account Error:', accountError);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testDIDProStreaming();
