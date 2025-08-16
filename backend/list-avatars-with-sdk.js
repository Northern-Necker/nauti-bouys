const { DIDClient } = require('@d-id/client-sdk');
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

async function listAvatarsWithSDK() {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;

  console.log('🎭 Using D-ID SDK to List Your Avatars');
  console.log('=====================================\n');

  try {
    // Initialize D-ID client with proper authentication
    const client = new DIDClient({
      auth: {
        username: didApiKey.split(':')[0], // Extract username from Basic auth
        password: didApiKey.split(':')[1]  // Extract password from Basic auth
      }
    });

    console.log('✅ D-ID SDK Client initialized successfully');
    console.log('📋 Fetching all your avatars/presenters...\n');

    // List all presenters/avatars
    const presenters = await client.presenters.list();
    
    console.log(`🎉 Found ${presenters.length} avatars in your account!\n`);

    // Look for Savannah specifically
    const savannahAvatars = presenters.filter(p => 
      (p.name && p.name.toLowerCase().includes('savannah')) ||
      (p.presenter_id && p.presenter_id.toLowerCase().includes('savannah')) ||
      (p.id && p.id.toLowerCase().includes('savannah'))
    );

    if (savannahAvatars.length > 0) {
      console.log('🎯 FOUND YOUR SAVANNAH AVATAR(S):');
      console.log('=================================\n');

      savannahAvatars.forEach((avatar, index) => {
        console.log(`${index + 1}. Savannah Avatar:`);
        console.log(`   Name: ${avatar.name || 'Unnamed'}`);
        console.log(`   ID: ${avatar.presenter_id || avatar.id}`);
        console.log(`   Created: ${avatar.created_at || 'Unknown'}`);
        
        if (avatar.source_url) {
          console.log(`   ✅ Source URL: ${avatar.source_url}`);
        } else if (avatar.image_url) {
          console.log(`   ✅ Image URL: ${avatar.image_url}`);
        } else {
          console.log(`   ❌ No source/image URL found`);
        }
        
        if (avatar.preview_url) {
          console.log(`   Preview URL: ${avatar.preview_url}`);
        }
        
        console.log('');
      });

      // Test the first Savannah avatar with streaming
      const firstSavannah = savannahAvatars[0];
      const testUrl = firstSavannah.source_url || firstSavannah.image_url;
      
      if (testUrl) {
        console.log('🧪 Testing your Savannah avatar with streaming API...');
        console.log('====================================================\n');
        
        try {
          const stream = await client.talks.streams.create({
            source_url: testUrl,
            stream_warmup: true
          });

          console.log('🎉 SUCCESS! Your Savannah avatar works perfectly!');
          console.log(`   Stream ID: ${stream.id}`);
          console.log(`   Session ID: ${stream.session_id}`);
          
          // Clean up test stream
          await client.talks.streams.delete(stream.id, {
            session_id: stream.session_id
          });
          
          console.log('\n🎯 PERFECT SAVANNAH CONFIGURATION:');
          console.log('==================================');
          console.log(`Avatar Name: ${firstSavannah.name}`);
          console.log(`Source URL: ${testUrl}`);
          console.log('\n✅ Ready to update your system with your actual Savannah!');
          
          // Save the configuration
          const config = {
            success: true,
            avatarName: firstSavannah.name,
            sourceUrl: testUrl,
            presenterId: firstSavannah.presenter_id || firstSavannah.id,
            createdAt: firstSavannah.created_at
          };
          
          fs.writeFileSync('savannah-avatar-found.json', JSON.stringify(config, null, 2));
          console.log('✅ Configuration saved to savannah-avatar-found.json');
          
          return config;
          
        } catch (streamError) {
          console.log(`❌ Streaming test failed: ${streamError.message}`);
        }
      }
      
    } else {
      console.log('❌ No Savannah avatar found in your account.');
      console.log('\n🔍 ALL YOUR AVATARS:');
      console.log('====================\n');

      // Show all avatars to help you identify which one might be Savannah
      presenters.forEach((avatar, index) => {
        console.log(`${index + 1}. Avatar:`);
        console.log(`   Name: "${avatar.name || 'Unnamed'}"`);
        console.log(`   ID: ${avatar.presenter_id || avatar.id}`);
        console.log(`   Created: ${avatar.created_at || 'Unknown'}`);
        
        if (avatar.source_url) {
          console.log(`   Source URL: ${avatar.source_url}`);
        } else if (avatar.image_url) {
          console.log(`   Image URL: ${avatar.image_url}`);
        }
        
        console.log('');
      });

      console.log('\n💡 SOLUTIONS:');
      console.log('=============');
      console.log('1. Look through the list above - is one of these your Savannah?');
      console.log('2. If you see your Savannah with a different name, let me know the ID');
      console.log('3. If no Savannah exists, create one at https://studio.d-id.com');
      console.log('4. Upload your custom Savannah image and name it "Savannah"');
    }

  } catch (error) {
    console.error('❌ SDK Error:', error.message);
    
    if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      console.log('\n🔧 AUTHENTICATION ISSUE:');
      console.log('========================');
      console.log('Your D-ID API key might be in the wrong format.');
      console.log('Expected format: username:password (Basic Auth)');
      console.log('Current format:', didApiKey.substring(0, 20) + '...');
    }
  }
}

listAvatarsWithSDK().then((result) => {
  if (result && result.success) {
    console.log('\n🚀 READY TO UPDATE YOUR SYSTEM!');
    console.log('================================');
    console.log('I found your actual Savannah avatar and will update your backend now!');
  } else {
    console.log('\n💭 NEXT STEPS:');
    console.log('==============');
    console.log('1. Review the avatar list above');
    console.log('2. Identify your Savannah avatar');
    console.log('3. Let me know the correct avatar details');
    console.log('4. I\'ll update your system configuration');
  }
}).catch(console.error);
