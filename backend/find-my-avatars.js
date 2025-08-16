const fs = require('fs');
const path = require('path');

// Read .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
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

async function findMyAvatars() {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;
  const didBaseUrl = env.DID_BASE_URL || 'https://api.d-id.com';

  console.log('🎭 Finding Your Custom Avatars with D-ID REST API');
  console.log('=================================================\n');

  try {
    // Try multiple endpoints to find your avatars
    const endpoints = [
      '/clips/presenters',
      '/talks/presenters', 
      '/presenters',
      '/clips',
      '/talks'
    ];

    let allAvatars = [];
    let workingEndpoint = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        
        const response = await fetch(`${didBaseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${didApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success! Found data at ${endpoint}`);
          
          // Handle different response formats
          let avatars = [];
          if (data.presenters) {
            avatars = data.presenters;
          } else if (data.clips) {
            avatars = data.clips;
          } else if (data.talks) {
            avatars = data.talks;
          } else if (Array.isArray(data)) {
            avatars = data;
          } else {
            avatars = [data];
          }

          if (avatars.length > 0) {
            allAvatars = avatars;
            workingEndpoint = endpoint;
            break;
          }
        } else {
          console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    if (allAvatars.length === 0) {
      console.log('\n❌ No avatars found in any endpoint.');
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('1. Check your D-ID API key format');
      console.log('2. Verify you have avatars in your D-ID account');
      console.log('3. Go to https://studio.d-id.com to create avatars');
      return;
    }

    console.log(`\n🎉 Found ${allAvatars.length} avatars using endpoint: ${workingEndpoint}`);
    console.log('='.repeat(60));

    // Look for Savannah specifically
    const savannahAvatars = allAvatars.filter(avatar => {
      const name = avatar.name || avatar.presenter_name || avatar.title || '';
      const id = avatar.id || avatar.presenter_id || avatar.clip_id || '';
      
      return name.toLowerCase().includes('savannah') || 
             id.toLowerCase().includes('savannah');
    });

    if (savannahAvatars.length > 0) {
      console.log('\n🎯 FOUND YOUR SAVANNAH AVATAR(S):');
      console.log('=================================\n');

      savannahAvatars.forEach((avatar, index) => {
        console.log(`${index + 1}. Savannah Avatar:`);
        console.log(`   Name: ${avatar.name || avatar.presenter_name || avatar.title || 'Unnamed'}`);
        console.log(`   ID: ${avatar.id || avatar.presenter_id || avatar.clip_id || 'No ID'}`);
        console.log(`   Created: ${avatar.created_at || avatar.created_time || 'Unknown'}`);
        
        // Look for various URL fields
        const possibleUrls = [
          avatar.source_url,
          avatar.image_url,
          avatar.presenter_url,
          avatar.thumbnail_url,
          avatar.preview_url,
          avatar.url
        ].filter(Boolean);

        if (possibleUrls.length > 0) {
          console.log(`   ✅ Available URLs:`);
          possibleUrls.forEach(url => {
            console.log(`      - ${url}`);
          });
        } else {
          console.log(`   ❌ No URLs found`);
        }
        
        console.log('   Raw data:', JSON.stringify(avatar, null, 2));
        console.log('');
      });

      // Test the first Savannah avatar
      const firstSavannah = savannahAvatars[0];
      const testUrls = [
        firstSavannah.source_url,
        firstSavannah.image_url,
        firstSavannah.presenter_url,
        firstSavannah.url
      ].filter(Boolean);

      if (testUrls.length > 0) {
        console.log('🧪 Testing your Savannah avatar URLs with streaming API...');
        console.log('=======================================================\n');
        
        for (const testUrl of testUrls) {
          console.log(`Testing URL: ${testUrl}`);
          
          try {
            const streamResponse = await fetch(`${didBaseUrl}/talks/streams`, {
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

            if (streamResponse.ok) {
              const streamData = await streamResponse.json();
              console.log('🎉 SUCCESS! This URL works with streaming!');
              console.log(`   Stream ID: ${streamData.id}`);
              console.log(`   Session ID: ${streamData.session_id}`);
              
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
              
              console.log('\n🎯 PERFECT SAVANNAH CONFIGURATION:');
              console.log('==================================');
              console.log(`Avatar Name: ${firstSavannah.name || firstSavannah.presenter_name || 'Savannah'}`);
              console.log(`Working URL: ${testUrl}`);
              console.log('\n✅ Ready to update your system with your actual Savannah!');
              
              // Save the configuration
              const config = {
                success: true,
                avatarName: firstSavannah.name || firstSavannah.presenter_name || 'Savannah',
                sourceUrl: testUrl,
                avatarId: firstSavannah.id || firstSavannah.presenter_id,
                endpoint: workingEndpoint,
                createdAt: firstSavannah.created_at || firstSavannah.created_time
              };
              
              fs.writeFileSync('savannah-avatar-config.json', JSON.stringify(config, null, 2));
              console.log('✅ Configuration saved to savannah-avatar-config.json');
              
              return config;
              
            } else {
              const errorData = await streamResponse.json();
              console.log(`❌ Failed: ${streamResponse.status} - ${errorData.description || streamResponse.statusText}`);
            }
          } catch (error) {
            console.log(`❌ Error testing: ${error.message}`);
          }
          console.log('');
        }
      }
      
    } else {
      console.log('\n❌ No Savannah avatar found by name.');
      console.log('\n🔍 ALL YOUR AVATARS:');
      console.log('====================\n');

      // Show all avatars to help identify Savannah
      allAvatars.slice(0, 20).forEach((avatar, index) => {
        console.log(`${index + 1}. Avatar:`);
        console.log(`   Name: "${avatar.name || avatar.presenter_name || avatar.title || 'Unnamed'}"`);
        console.log(`   ID: ${avatar.id || avatar.presenter_id || avatar.clip_id || 'No ID'}`);
        console.log(`   Created: ${avatar.created_at || avatar.created_time || 'Unknown'}`);
        
        const possibleUrls = [
          avatar.source_url,
          avatar.image_url,
          avatar.presenter_url,
          avatar.url
        ].filter(Boolean);

        if (possibleUrls.length > 0) {
          console.log(`   URLs: ${possibleUrls[0]}`);
        }
        console.log('');
      });

      if (allAvatars.length > 20) {
        console.log(`... and ${allAvatars.length - 20} more avatars`);
      }

      console.log('\n💡 SOLUTIONS:');
      console.log('=============');
      console.log('1. Look through the list above - is one of these your Savannah?');
      console.log('2. If you see your Savannah with a different name, note the ID');
      console.log('3. If no Savannah exists, create one at https://studio.d-id.com');
      console.log('4. Upload your custom Savannah image and name it "Savannah"');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n🔧 NETWORK ISSUE:');
      console.log('=================');
      console.log('Check your internet connection and D-ID API access.');
    }
  }
}

findMyAvatars().then((result) => {
  if (result && result.success) {
    console.log('\n🚀 READY TO UPDATE YOUR SYSTEM!');
    console.log('================================');
    console.log('I found your actual Savannah avatar and can update your backend now!');
  } else {
    console.log('\n💭 NEXT STEPS:');
    console.log('==============');
    console.log('1. Review the avatar list above');
    console.log('2. Identify your Savannah avatar');
    console.log('3. Let me know the correct avatar details');
    console.log('4. I\'ll update your system configuration');
  }
}).catch(console.error);
