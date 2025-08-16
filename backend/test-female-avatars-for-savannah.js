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

async function testFemaleAvatarsForSavannah() {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;
  const didBaseUrl = env.DID_BASE_URL || 'https://api.d-id.com';

  console.log('🎯 Testing Female Avatars to Use as Your Savannah');
  console.log('=================================================\n');

  // Best female avatar candidates from your account
  const femaleAvatars = [
    {
      name: 'Alyssa (Red Suit Lobby)',
      id: 'v2_public_Alyssa_NoHands_RedSuite_Lobby@qtzjxMSwEa',
      url: 'https://clips-presenters.d-id.com/v2/Alyssa_NoHands_RedSuite_Lobby/qtzjxMSwEa/ypTds_0CK3/image.png',
      description: 'Professional female in red suit, perfect for hospitality/bartender role'
    },
    {
      name: 'Alyssa (Black Shirt Home)',
      id: 'v2_public_Alyssa_NoHands_BlackShirt_Home@Mvn6Nalx90',
      url: 'https://clips-presenters.d-id.com/v2/Alyssa_NoHands_BlackShirt_Home/Mvn6Nalx90/y0J6MTfOaZ/image.png',
      description: 'Professional female in casual setting, approachable and friendly'
    },
    {
      name: 'Amber (Black Jacket Office)',
      id: 'v2_public_Amber_BlackJacket_HomeOffice@9WuHtiUDnL',
      url: 'https://clips-presenters.d-id.com/v2/Amber_BlackJacket_HomeOffice/9WuHtiUDnL/Sc6QllBjEE/image.png',
      description: 'Professional female in business attire, sophisticated look'
    },
    {
      name: 'Fiona (Black Jacket Classroom)',
      id: 'v2_public_Fiona_NoHands_BlackJacket_ClassRoom@1BOeggEufb',
      url: 'https://clips-presenters.d-id.com/v2/Fiona_NoHands_BlackJacket_ClassRoom/1BOeggEufb/dbRUIwY6KY/image.png',
      description: 'Professional female presenter, great for educational/service roles'
    },
    {
      name: 'Fiona (Blue Shirt Lab)',
      id: 'v2_public_Fiona_NoHands_BlueShirt_Lab@5HRTMswT4U',
      url: 'https://clips-presenters.d-id.com/v2/Fiona_NoHands_BlueShirt_Lab/5HRTMswT4U/qKIgVJmbyL/image.png',
      description: 'Professional female in blue, clean and trustworthy appearance'
    }
  ];

  console.log('🧪 Testing each female avatar with D-ID Streaming API...\n');

  let workingAvatars = [];

  for (const avatar of femaleAvatars) {
    console.log(`Testing: ${avatar.name}`);
    console.log(`URL: ${avatar.url}`);
    console.log(`Description: ${avatar.description}`);
    
    try {
      const response = await fetch(`${didBaseUrl}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${didApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: avatar.url,
          stream_warmup: true
        })
      });

      if (response.ok) {
        const streamData = await response.json();
        console.log('✅ SUCCESS! This avatar works perfectly for streaming!');
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
        
        workingAvatars.push({
          ...avatar,
          streamId: streamData.id,
          sessionId: streamData.session_id,
          tested: true,
          working: true
        });
        
      } else {
        const errorData = await response.json();
        console.log(`❌ Failed: ${response.status} - ${errorData.description || response.statusText}`);
        workingAvatars.push({
          ...avatar,
          tested: true,
          working: false,
          error: errorData.description || response.statusText
        });
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      workingAvatars.push({
        ...avatar,
        tested: true,
        working: false,
        error: error.message
      });
    }
    
    console.log('');
  }

  // Show results
  const successfulAvatars = workingAvatars.filter(a => a.working);
  
  if (successfulAvatars.length > 0) {
    console.log('🎉 WORKING FEMALE AVATARS FOR SAVANNAH:');
    console.log('======================================\n');
    
    successfulAvatars.forEach((avatar, index) => {
      console.log(`${index + 1}. ${avatar.name}`);
      console.log(`   ID: ${avatar.id}`);
      console.log(`   URL: ${avatar.url}`);
      console.log(`   Description: ${avatar.description}`);
      console.log(`   ✅ Streaming: WORKING`);
      console.log('');
    });

    // Recommend the best one (Alyssa Red Suit is perfect for hospitality)
    const recommended = successfulAvatars.find(a => a.name.includes('Red Suit')) || successfulAvatars[0];
    
    console.log('🎯 RECOMMENDED SAVANNAH AVATAR:');
    console.log('===============================');
    console.log(`Name: ${recommended.name}`);
    console.log(`ID: ${recommended.id}`);
    console.log(`URL: ${recommended.url}`);
    console.log(`Why: ${recommended.description}`);
    
    console.log('\n✅ READY TO UPDATE YOUR SYSTEM!');
    console.log('This avatar will be your Savannah until you create a custom one.');
    
    // Save the configuration
    const config = {
      success: true,
      avatarName: recommended.name,
      sourceUrl: recommended.url,
      avatarId: recommended.id,
      description: recommended.description,
      isTemporary: true,
      note: 'This is a temporary Savannah avatar. Create a custom one at https://studio.d-id.com'
    };
    
    fs.writeFileSync('savannah-avatar-config.json', JSON.stringify(config, null, 2));
    console.log('✅ Configuration saved to savannah-avatar-config.json');
    
    return config;
    
  } else {
    console.log('❌ No female avatars are working with streaming API.');
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Check your D-ID account status');
    console.log('2. Verify streaming API access');
    console.log('3. Try creating a custom avatar at https://studio.d-id.com');
    
    return null;
  }
}

testFemaleAvatarsForSavannah().then((result) => {
  if (result && result.success) {
    console.log('\n🚀 NEXT STEP: UPDATE YOUR BACKEND');
    console.log('=================================');
    console.log('I found a perfect female avatar to use as your Savannah!');
    console.log('I can now update your backend service to use this avatar.');
    console.log('\n💡 TO CREATE YOUR ACTUAL CUSTOM SAVANNAH:');
    console.log('1. Go to https://studio.d-id.com');
    console.log('2. Upload your custom Savannah image');
    console.log('3. Name it "Savannah"');
    console.log('4. Let me know when it\'s ready and I\'ll update the URL');
  } else {
    console.log('\n💭 ALTERNATIVE SOLUTIONS:');
    console.log('=========================');
    console.log('1. Create a custom Savannah avatar at https://studio.d-id.com');
    console.log('2. Use a different avatar service');
    console.log('3. Check your D-ID account permissions');
  }
}).catch(console.error);
