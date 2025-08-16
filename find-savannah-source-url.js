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

async function findSavannahSourceUrl() {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;
  const didBaseUrl = env.DID_BASE_URL || 'https://api.d-id.com';

  console.log('🔍 Finding Your Custom Savannah Avatar Source URL');
  console.log('=================================================\n');

  try {
    // First, let's get all your presenters/clips to find Savannah
    console.log('📋 Fetching all your custom presenters...');
    
    const response = await fetch(`${didBaseUrl}/clips/presenters`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch presenters: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.presenters.length} presenters in your account\n`);

    // Look for Savannah specifically
    const savannahPresenters = data.presenters.filter(p => 
      (p.name && p.name.toLowerCase().includes('savannah')) ||
      (p.presenter_id && p.presenter_id.toLowerCase().includes('savannah')) ||
      (p.id && p.id.toLowerCase().includes('savannah'))
    );

    if (savannahPresenters.length === 0) {
      console.log('❌ No Savannah presenter found in your account.');
      console.log('\n🔧 SOLUTIONS:');
      console.log('1. Check if the presenter name is exactly "Savannah"');
      console.log('2. The presenter might have a different name');
      console.log('3. You may need to recreate the Savannah presenter');
      
      console.log('\n📋 ALL YOUR PRESENTERS:');
      console.log('=======================');
      data.presenters.forEach((p, index) => {
        console.log(`${index + 1}. Name: "${p.name || 'Unnamed'}" | ID: ${p.presenter_id || p.id}`);
        if (p.source_url) {
          console.log(`   Source URL: ${p.source_url}`);
        }
        console.log('');
      });
      
      return null;
    }

    console.log('🎉 FOUND YOUR SAVANNAH PRESENTER(S):');
    console.log('====================================\n');

    savannahPresenters.forEach((presenter, index) => {
      console.log(`${index + 1}. Savannah Presenter:`);
      console.log(`   Name: ${presenter.name || 'Unnamed'}`);
      console.log(`   ID: ${presenter.presenter_id || presenter.id}`);
      console.log(`   Created: ${presenter.created_at || 'Unknown'}`);
      
      if (presenter.source_url) {
        console.log(`   ✅ Source URL: ${presenter.source_url}`);
      } else {
        console.log(`   ❌ No source_url found`);
      }
      
      if (presenter.preview_url) {
        console.log(`   Preview URL: ${presenter.preview_url}`);
      }
      
      console.log('');
    });

    // Test the source URLs with streaming API
    console.log('🧪 TESTING SOURCE URLs WITH STREAMING API:');
    console.log('==========================================\n');

    for (const presenter of savannahPresenters) {
      if (presenter.source_url) {
        console.log(`Testing: ${presenter.source_url}`);
        
        try {
          const testResponse = await fetch(`${didBaseUrl}/talks/streams`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${didApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              source_url: presenter.source_url,
              stream_warmup: true
            })
          });

          if (testResponse.ok) {
            const streamData = await testResponse.json();
            console.log('✅ SUCCESS! This source_url works for streaming!');
            console.log(`   Stream ID: ${streamData.id}`);
            
            // Clean up test stream
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
            
            console.log('\n🎯 WORKING SAVANNAH SOURCE URL:');
            console.log('===============================');
            console.log(presenter.source_url);
            console.log('\n✅ I will now update your system to use this URL!');
            
            return presenter.source_url;
            
          } else {
            const errorData = await testResponse.json();
            console.log(`❌ Failed: ${testResponse.status} - ${errorData.description || testResponse.statusText}`);
          }
        } catch (error) {
          console.log(`❌ Error testing: ${error.message}`);
        }
        console.log('');
      }
    }

    return null;

  } catch (error) {
    console.error('❌ Error finding Savannah:', error.message);
    return null;
  }
}

findSavannahSourceUrl().then((workingUrl) => {
  if (workingUrl) {
    console.log('\n🚀 READY TO UPDATE YOUR SYSTEM!');
    console.log('================================');
    console.log('I found your working Savannah source URL and will update your backend now.');
  } else {
    console.log('\n💡 NEXT STEPS:');
    console.log('==============');
    console.log('1. Check the presenter list above');
    console.log('2. If you see your Savannah, note the source_url');
    console.log('3. If no Savannah found, you may need to recreate it');
    console.log('4. Use D-ID Studio: https://studio.d-id.com');
  }
}).catch(console.error);
