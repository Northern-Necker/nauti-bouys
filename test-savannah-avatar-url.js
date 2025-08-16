const fs = require('fs');
const path = require('path');

// Read .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, 'backend', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  
  return env;
}

async function testSavannahAvatarURL() {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;
  const didBaseUrl = env.DID_BASE_URL || 'https://api.d-id.com';

  console.log('🔍 Testing Savannah Avatar URL Formats...\n');
  console.log(`API Key: ${didApiKey.substring(0, 20)}...`);
  console.log(`Base URL: ${didBaseUrl}\n`);

  // Test different URL formats for your Savannah avatar
  const testUrls = [
    // Format 1: Using presenter ID directly
    `https://create-images-results.d-id.com/api_key_${didApiKey.split(':')[0]}/Savannah/image.jpeg`,
    
    // Format 2: Using the full hash ID
    `https://create-images-results.d-id.com/api_key_${didApiKey.split(':')[0]}/25efdee1cd09408fa22ce2036cf52540/image.jpeg`,
    
    // Format 3: Direct presenter URL (if it exists)
    `https://clips-presenters.d-id.com/Savannah/image.jpeg`,
    
    // Format 4: Try with different path structure
    `https://create-images-results.d-id.com/${didApiKey.split(':')[0]}/Savannah/image.jpeg`,
  ];

  console.log('🧪 Testing Avatar URL Formats:');
  console.log('================================\n');

  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`${i + 1}. Testing: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'HEAD', // Just check if the URL exists
        headers: {
          'Authorization': `Basic ${didApiKey}`,
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        console.log(`   ✅ SUCCESS! This URL works.`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')}`);
      } else {
        console.log(`   ❌ Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  // Also test creating a stream with D-ID to see what happens
  console.log('🚀 Testing D-ID Stream Creation with Savannah:');
  console.log('===============================================\n');

  try {
    // Test with the first URL format
    const testUrl = testUrls[0];
    console.log(`Testing stream creation with: ${testUrl}`);
    
    const response = await fetch(`${didBaseUrl}/talks/streams`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_url: testUrl,
        stream_warmup: true
      })
    });

    console.log(`Stream creation status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const streamData = await response.json();
      console.log('✅ Stream created successfully!');
      console.log(`Stream ID: ${streamData.id}`);
      console.log(`Session ID: ${streamData.session_id}`);
      
      // Clean up the test stream
      await fetch(`${didBaseUrl}/talks/streams/${streamData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${didApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: streamData.session_id
        })
      });
      console.log('🧹 Test stream cleaned up');
      
    } else {
      const errorData = await response.json();
      console.log('❌ Stream creation failed:');
      console.log(JSON.stringify(errorData, null, 2));
    }

  } catch (error) {
    console.log(`❌ Stream test error: ${error.message}`);
  }

  console.log('\n📋 RECOMMENDATIONS:');
  console.log('===================');
  console.log('1. Check which URL format returned status 200');
  console.log('2. Use that URL format in your configuration');
  console.log('3. If none work, the avatar might need to be re-created');
  console.log('4. Check D-ID Studio for the correct avatar URL');
}

testSavannahAvatarURL().catch(console.error);
