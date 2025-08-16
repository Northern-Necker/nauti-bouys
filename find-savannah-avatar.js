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

async function findSavannahAvatar() {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;
  const didBaseUrl = env.DID_BASE_URL || 'https://api.d-id.com';

  console.log('🔍 Searching for your custom Savannah avatar...\n');
  console.log(`Using API Key: ${didApiKey.substring(0, 20)}...`);
  console.log(`Base URL: ${didBaseUrl}\n`);

  try {
    // Get all presenters/avatars
    console.log('📡 Fetching presenters from D-ID API...');
    const response = await fetch(`${didBaseUrl}/clips/presenters`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error(`Failed to fetch presenters: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📋 Available Presenters/Avatars:');
    console.log('=====================================\n');

    if (data.presenters && data.presenters.length > 0) {
      data.presenters.forEach((presenter, index) => {
        console.log(`${index + 1}. ${presenter.presenter_id || presenter.id}`);
        console.log(`   Name: ${presenter.name || 'Unnamed'}`);
        console.log(`   Type: ${presenter.type || 'Unknown'}`);
        if (presenter.preview_url) {
          console.log(`   Preview: ${presenter.preview_url}`);
        }
        if (presenter.source_url) {
          console.log(`   Source: ${presenter.source_url}`);
        }
        console.log('');
      });

      // Look for Savannah specifically
      const savannahAvatar = data.presenters.find(p => 
        (p.name && p.name.toLowerCase().includes('savannah')) ||
        (p.presenter_id && p.presenter_id.toLowerCase().includes('savannah'))
      );

      if (savannahAvatar) {
        console.log('🎉 FOUND SAVANNAH AVATAR!');
        console.log('========================');
        console.log(`ID: ${savannahAvatar.presenter_id || savannahAvatar.id}`);
        console.log(`Name: ${savannahAvatar.name}`);
        console.log(`Type: ${savannahAvatar.type}`);
        if (savannahAvatar.source_url) {
          console.log(`Source URL: ${savannahAvatar.source_url}`);
        }
        if (savannahAvatar.preview_url) {
          console.log(`Preview URL: ${savannahAvatar.preview_url}`);
        }
        console.log('\n✅ Use this information to update your configuration!');
        
        return savannahAvatar;
      } else {
        console.log('❌ No Savannah avatar found in your presenters.');
        console.log('💡 You may need to create it first or check if it\'s under a different name.');
      }

    } else {
      console.log('❌ No presenters found in your account.');
      console.log('💡 You may need to create your Savannah avatar first.');
    }

    // Also check for clips/talks that might contain Savannah
    console.log('\n🎬 Checking recent clips for Savannah...');
    const clipsResponse = await fetch(`${didBaseUrl}/clips?limit=20`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (clipsResponse.ok) {
      const clipsData = await clipsResponse.json();
      if (clipsData.clips && clipsData.clips.length > 0) {
        console.log(`Found ${clipsData.clips.length} clips total`);
        
        const savannahClips = clipsData.clips.filter(clip => 
          (clip.presenter_id && clip.presenter_id.toLowerCase().includes('savannah')) ||
          (clip.source_url && clip.source_url.toLowerCase().includes('savannah')) ||
          (clip.id && clip.id.toLowerCase().includes('savannah'))
        );

        if (savannahClips.length > 0) {
          console.log('🎬 Found clips with Savannah:');
          savannahClips.forEach(clip => {
            console.log(`   Clip ID: ${clip.id}`);
            console.log(`   Presenter ID: ${clip.presenter_id || 'N/A'}`);
            if (clip.source_url) {
              console.log(`   Source URL: ${clip.source_url}`);
            }
            console.log('');
          });
        } else {
          console.log('No clips found with "Savannah" in the name or ID');
        }
      }
    } else {
      console.log('Could not fetch clips:', clipsResponse.statusText);
    }

    return null;

  } catch (error) {
    console.error('❌ Error finding Savannah avatar:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Authentication issue. Please check your D-ID API key.');
    } else if (error.message.includes('403')) {
      console.log('\n💡 Permission issue. Make sure your D-ID account has access to presenters.');
    } else if (error.message.includes('fetch is not defined')) {
      console.log('\n💡 Fetch not available. Please use Node.js 18+ or install node-fetch.');
    }
    
    return null;
  }
}

// Also provide instructions for creating Savannah if not found
console.log('🚀 D-ID Savannah Avatar Finder');
console.log('===============================\n');

findSavannahAvatar().then((savannahAvatar) => {
  console.log('\n📝 NEXT STEPS:');
  console.log('==============');
  
  if (savannahAvatar) {
    console.log('✅ Savannah avatar found! I can now update your configuration.');
    console.log(`   Use this URL: ${savannahAvatar.source_url || savannahAvatar.preview_url}`);
    console.log(`   Or this ID: ${savannahAvatar.presenter_id || savannahAvatar.id}`);
  } else {
    console.log('1. If Savannah was found above, copy the Source URL or Presenter ID');
    console.log('2. If not found, you can create Savannah using D-ID Studio:');
    console.log('   - Go to https://studio.d-id.com');
    console.log('   - Upload your Savannah image');
    console.log('   - Create a presenter named "Savannah"');
    console.log('   - Copy the presenter ID or source URL');
    console.log('3. Run this script again to verify');
    console.log('4. Update your configuration with the correct Savannah avatar');
  }
  
  console.log('\n✨ Once you have the Savannah avatar info, I\'ll update your system!');
});
