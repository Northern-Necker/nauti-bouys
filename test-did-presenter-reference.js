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

async function testPresenterReference() {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;
  const didBaseUrl = env.DID_BASE_URL || 'https://api.d-id.com';

  console.log('🔍 Testing D-ID Presenter Reference Methods...\n');

  // Method 1: Use presenter_id directly instead of source_url
  console.log('🧪 Method 1: Using presenter_id instead of source_url');
  console.log('==================================================\n');

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
      console.log('✅ SUCCESS! Using presenter_id works!');
      console.log(`Stream ID: ${streamData.id}`);
      console.log(`Session ID: ${streamData.session_id}`);
      
      // Clean up
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
      console.log('🧹 Test stream cleaned up\n');
      
      return 'presenter_id';
      
    } else {
      const errorData = await response.json();
      console.log('❌ Method 1 failed:');
      console.log(JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.log(`❌ Method 1 error: ${error.message}`);
  }

  // Method 2: Use the full hash ID as presenter_id
  console.log('\n🧪 Method 2: Using full hash as presenter_id');
  console.log('=============================================\n');

  try {
    const response = await fetch(`${didBaseUrl}/talks/streams`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        presenter_id: '25efdee1cd09408fa22ce2036cf52540',  // Use full hash
        stream_warmup: true
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const streamData = await response.json();
      console.log('✅ SUCCESS! Using hash as presenter_id works!');
      console.log(`Stream ID: ${streamData.id}`);
      console.log(`Session ID: ${streamData.session_id}`);
      
      // Clean up
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
      console.log('🧹 Test stream cleaned up\n');
      
      return 'hash_id';
      
    } else {
      const errorData = await response.json();
      console.log('❌ Method 2 failed:');
      console.log(JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.log(`❌ Method 2 error: ${error.message}`);
  }

  // Method 3: Get presenter info to find correct reference
  console.log('\n🧪 Method 3: Getting presenter info from API');
  console.log('============================================\n');

  try {
    const response = await fetch(`${didBaseUrl}/clips/presenters`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const savannahPresenter = data.presenters.find(p => 
        (p.name && p.name.toLowerCase().includes('savannah')) ||
        (p.presenter_id && p.presenter_id.toLowerCase().includes('savannah'))
      );

      if (savannahPresenter) {
        console.log('✅ Found Savannah presenter:');
        console.log(`ID: ${savannahPresenter.presenter_id || savannahPresenter.id}`);
        console.log(`Name: ${savannahPresenter.name}`);
        if (savannahPresenter.source_url) {
          console.log(`Source URL: ${savannahPresenter.source_url}`);
        }
        
        // Test with the actual presenter data
        const presenterId = savannahPresenter.presenter_id || savannahPresenter.id;
        console.log(`\nTesting with actual presenter ID: ${presenterId}`);
        
        const testResponse = await fetch(`${didBaseUrl}/talks/streams`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${didApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            presenter_id: presenterId,
            stream_warmup: true
          })
        });

        console.log(`Status: ${testResponse.status} ${testResponse.statusText}`);
        
        if (testResponse.ok) {
          const streamData = await testResponse.json();
          console.log('✅ SUCCESS! Found working presenter reference!');
          console.log(`Stream ID: ${streamData.id}`);
          
          // Clean up
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
          
          return { method: 'actual_presenter_id', id: presenterId };
          
        } else {
          const errorData = await testResponse.json();
          console.log('❌ Test with actual presenter failed:');
          console.log(JSON.stringify(errorData, null, 2));
        }
      } else {
        console.log('❌ Savannah presenter not found in API response');
      }
    }
  } catch (error) {
    console.log(`❌ Method 3 error: ${error.message}`);
  }

  console.log('\n📋 CONCLUSION:');
  console.log('==============');
  console.log('❌ None of the methods worked successfully');
  console.log('💡 The Savannah avatar might need to be recreated or there might be an API issue');
  
  return null;
}

testPresenterReference().then((result) => {
  if (result) {
    console.log(`\n🎉 SOLUTION FOUND: ${JSON.stringify(result)}`);
    console.log('Update your backend configuration with this method!');
  } else {
    console.log('\n❌ No working solution found. Avatar may need to be recreated.');
  }
}).catch(console.error);
