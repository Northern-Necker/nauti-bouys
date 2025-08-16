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

async function createCustomSavannah(imageUrl) {
  const env = loadEnv();
  const didApiKey = env.DID_API_KEY;
  const didBaseUrl = env.DID_BASE_URL || 'https://api.d-id.com';

  console.log('🎨 Creating your custom Savannah avatar...\n');
  console.log(`Image URL: ${imageUrl}`);
  console.log(`Using API Key: ${didApiKey.substring(0, 20)}...\n`);

  try {
    // Create a custom presenter with your Savannah image
    const response = await fetch(`${didBaseUrl}/clips/presenters`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_url: imageUrl,
        presenter_name: 'Savannah',
        driver_url: 'bank://lively/', // Use lively driver for natural movement
        config: {
          stitch: true,
          fluent: true
        }
      })
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error(`Failed to create Savannah presenter: ${response.status} ${response.statusText}`);
    }

    const presenterData = await response.json();
    console.log('🎉 SUCCESS! Custom Savannah avatar created!');
    console.log('==========================================\n');
    
    console.log(`Presenter ID: ${presenterData.presenter_id}`);
    console.log(`Name: ${presenterData.presenter_name || 'Savannah'}`);
    console.log(`Source URL: ${presenterData.source_url}`);
    if (presenterData.preview_url) {
      console.log(`Preview URL: ${presenterData.preview_url}`);
    }
    
    console.log('\n✅ NEXT STEPS:');
    console.log('==============');
    console.log('1. Copy the Source URL above');
    console.log('2. I will now update your system configuration automatically');
    console.log('3. Test your new Savannah avatar!');
    
    return presenterData;

  } catch (error) {
    console.error('❌ Error creating Savannah avatar:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Authentication issue. Please check your D-ID API key.');
    } else if (error.message.includes('403')) {
      console.log('\n💡 Permission issue. Make sure your D-ID account has presenter creation access.');
    } else if (error.message.includes('400')) {
      console.log('\n💡 Bad request. Please check that your image URL is valid and accessible.');
      console.log('   - Image should be JPEG or PNG');
      console.log('   - Image should show a clear face');
      console.log('   - Image should be publicly accessible');
    }
    
    return null;
  }
}

// Instructions and usage
console.log('🚀 Custom Savannah Avatar Creator');
console.log('=================================\n');

const imageUrl = process.argv[2];

if (!imageUrl) {
  console.log('❌ Please provide your Savannah image URL as an argument.');
  console.log('\nUsage:');
  console.log('  node create-custom-savannah.js "https://your-image-url.com/savannah.jpg"');
  console.log('\nImage Requirements:');
  console.log('  - JPEG or PNG format');
  console.log('  - Clear, front-facing photo of a person');
  console.log('  - Good lighting and resolution');
  console.log('  - Publicly accessible URL');
  console.log('\nExample:');
  console.log('  node create-custom-savannah.js "https://example.com/my-savannah-avatar.jpg"');
  process.exit(1);
}

createCustomSavannah(imageUrl).then((result) => {
  if (result) {
    console.log('\n🎯 AUTOMATIC CONFIGURATION UPDATE');
    console.log('==================================');
    console.log('I can now update your system to use this custom Savannah avatar.');
    console.log('The new avatar will be used in both backend and frontend.');
    console.log('\n✨ Your custom Savannah is ready to serve patrons at Nauti-Bouys!');
  } else {
    console.log('\n💡 ALTERNATIVE OPTIONS:');
    console.log('======================');
    console.log('1. Use D-ID Studio: https://studio.d-id.com');
    console.log('2. Upload your image there and create a presenter');
    console.log('3. Copy the presenter URL and let me know');
    console.log('4. I\'ll update your system configuration');
  }
});
