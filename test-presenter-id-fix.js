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

async function testPresenterIdFix() {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;
  const didBaseUrl = env.DID_BASE_URL || 'https://api.d-id.com';

  console.log('🔧 Testing Presenter ID Fix for Savannah Avatar');
  console.log('==============================================\n');

  // Test the corrected approach using presenter_id
  console.log('🧪 Testing with presenter_id: "Savannah"');
  console.log('------------------------------------------');

  try {
    const response = await fetch(`${didBaseUrl}/talks/streams`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        presenter_id: 'Savannah',  // Use presenter_id instead of source_url
        stream_warmup: true
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const streamData = await response.json();
      console.log('✅ SUCCESS! Presenter ID approach works!');
      console.log(`Stream ID: ${streamData.id}`);
      console.log(`Session ID: ${streamData.session_id}`);
      console.log(`Offer SDP: ${streamData.offer ? 'Present' : 'Missing'}`);
      console.log(`ICE Servers: ${streamData.ice_servers ? streamData.ice_servers.length : 0} servers`);
      
      // Clean up the test stream
      console.log('\n🧹 Cleaning up test stream...');
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
      console.log('✅ Test stream cleaned up successfully');
      
      return { success: true, method: 'presenter_id', data: streamData };
      
    } else {
      const errorData = await response.json();
      console.log('❌ Presenter ID approach failed:');
      console.log(JSON.stringify(errorData, null, 2));
      
      // If presenter_id fails, let's try with a fallback approach
      console.log('\n🔄 Trying fallback with default Emma avatar...');
      
      const fallbackResponse = await fetch(`${didBaseUrl}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${didApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
          stream_warmup: true
        })
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('✅ Fallback with Emma works!');
        console.log(`Stream ID: ${fallbackData.id}`);
        
        // Clean up
        await fetch(`${didBaseUrl}/talks/streams/${fallbackData.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${didApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: fallbackData.session_id
          })
        });
        
        return { success: false, fallbackWorks: true, error: errorData };
      } else {
        return { success: false, fallbackWorks: false, error: errorData };
      }
    }

  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

testPresenterIdFix().then((result) => {
  console.log('\n📋 TEST RESULTS:');
  console.log('================');
  
  if (result.success) {
    console.log('🎉 SUCCESS! Your custom Savannah avatar works with presenter_id!');
    console.log('✅ The fix has been applied to your backend service.');
    console.log('✅ Your system should now use your custom Savannah avatar.');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Restart your backend server');
    console.log('2. Test the D-ID streaming page');
    console.log('3. You should see your custom Savannah avatar instead of fallback');
  } else if (result.fallbackWorks) {
    console.log('⚠️  Custom Savannah presenter_id failed, but fallback works.');
    console.log('💡 This means your D-ID API is working, but the "Savannah" presenter might need to be recreated.');
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. Check if "Savannah" presenter exists in your D-ID Studio');
    console.log('2. Try recreating the Savannah presenter');
    console.log('3. Use the fallback Emma avatar temporarily');
  } else {
    console.log('❌ Both custom and fallback approaches failed.');
    console.log('💡 This suggests an API key or configuration issue.');
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Verify your D-ID API key is correct');
    console.log('2. Check your D-ID account status and credits');
    console.log('3. Ensure you have streaming API access');
  }
}).catch(console.error);
