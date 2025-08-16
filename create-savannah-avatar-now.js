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

async function createSavannahAvatar() {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;
  const didBaseUrl = env.DID_BASE_URL || 'https://api.d-id.com';

  console.log('🎨 Creating Your Custom Savannah Avatar');
  console.log('======================================\n');

  // You need to provide an image URL for Savannah
  console.log('❗ IMPORTANT: You need to provide an image URL for Savannah.');
  console.log('The image should be:');
  console.log('- A clear, front-facing photo of a person');
  console.log('- JPEG or PNG format');
  console.log('- Good lighting and resolution');
  console.log('- Publicly accessible URL');
  console.log('');

  // For now, let's use a placeholder approach
  console.log('🔧 IMMEDIATE SOLUTION: Use an existing female presenter as Savannah');
  console.log('================================================================\n');

  // Let's pick a good female presenter from your account
  const goodFemaleOptions = [
    {
      name: 'Alyssa',
      id: 'v2_public_alyssa@VNZgl_DF_x',
      description: 'Professional female presenter, good for business/hospitality'
    },
    {
      name: 'Fiona',
      id: 'v2_public_fiona_black_jacket_green_screen@477B7MX1Vf',
      description: 'Professional with black jacket, suitable for bartender role'
    },
    {
      name: 'Mary',
      id: 'v2_public_Mary_NoHands_RedJacket_Lobby@EAJW87WBRh',
      description: 'Professional in lobby setting, good for hospitality'
    },
    {
      name: 'Kayla',
      id: 'v2_public_kayla@gBAHXrHWYT',
      description: 'Friendly professional appearance'
    },
    {
      name: 'Ella',
      id: 'v2_public_ella@p9l_fpg2_k',
      description: 'Professional and approachable'
    }
  ];

  console.log('🎯 RECOMMENDED FEMALE PRESENTERS TO USE AS SAVANNAH:');
  console.log('===================================================\n');

  goodFemaleOptions.forEach((option, index) => {
    console.log(`${index + 1}. ${option.name} (${option.id})`);
    console.log(`   Description: ${option.description}`);
    console.log('');
  });

  // Let's test the first option (Alyssa) to get the source_url
  console.log('🧪 Testing Alyssa as your Savannah avatar...');
  console.log('============================================\n');

  try {
    // First, get the presenter details to find the source_url
    const presenterResponse = await fetch(`${didBaseUrl}/clips/presenters/${goodFemaleOptions[0].id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (presenterResponse.ok) {
      const presenterData = await presenterResponse.json();
      console.log('✅ Found Alyssa presenter details:');
      console.log(`   Name: ${presenterData.name}`);
      console.log(`   ID: ${presenterData.presenter_id}`);
      
      if (presenterData.source_url) {
        console.log(`   Source URL: ${presenterData.source_url}`);
        
        // Test this source_url with streaming API
        console.log('\n🧪 Testing with streaming API...');
        
        const streamResponse = await fetch(`${didBaseUrl}/talks/streams`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${didApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source_url: presenterData.source_url,
            stream_warmup: true
          })
        });

        if (streamResponse.ok) {
          const streamData = await streamResponse.json();
          console.log('✅ SUCCESS! Alyssa works perfectly for streaming!');
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
          
          console.log('\n🎯 PERFECT SAVANNAH SOLUTION:');
          console.log('============================');
          console.log(`Source URL: ${presenterData.source_url}`);
          console.log('\n✅ I will now update your system to use Alyssa as Savannah!');
          
          return {
            success: true,
            sourceUrl: presenterData.source_url,
            presenterName: 'Alyssa (as Savannah)',
            presenterId: presenterData.presenter_id
          };
          
        } else {
          const errorData = await streamResponse.json();
          console.log(`❌ Streaming test failed: ${errorData.description}`);
        }
      } else {
        console.log('❌ No source_url found for this presenter');
      }
    } else {
      console.log(`❌ Failed to get presenter details: ${presenterResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Error testing presenter:', error.message);
  }

  return { success: false };
}

createSavannahAvatar().then((result) => {
  if (result.success) {
    console.log('\n🚀 READY TO UPDATE YOUR SYSTEM!');
    console.log('================================');
    console.log(`✅ Found working avatar: ${result.presenterName}`);
    console.log(`✅ Source URL: ${result.sourceUrl}`);
    console.log('\n🎉 Your system will now use this professional female presenter as Savannah!');
    
    // Store the result for the next step
    fs.writeFileSync('savannah-avatar-config.json', JSON.stringify(result, null, 2));
    console.log('✅ Configuration saved to savannah-avatar-config.json');
    
  } else {
    console.log('\n💡 ALTERNATIVE SOLUTIONS:');
    console.log('=========================');
    console.log('1. Go to https://studio.d-id.com');
    console.log('2. Upload your custom Savannah image');
    console.log('3. Create a presenter named "Savannah"');
    console.log('4. Copy the source_url and let me know');
    console.log('5. I\'ll update your system configuration');
  }
}).catch(console.error);
