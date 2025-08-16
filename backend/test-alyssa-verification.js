const fetch = require('node-fetch');

async function verifyAlyssaType() {
  console.log('🔍 Verifying Alyssa: Avatar vs Voice Option');
  console.log('==========================================\n');

  const didApiKey = process.env.DID_API_KEY || 'bWV0b3JiZXJ0QGdtYWlsLmNvbQ:JAn6hh4wQ2TFoOAl-GD4F';
  const didBaseUrl = 'https://api.d-id.com';
  const alyssaUrl = 'https://clips-presenters.d-id.com/v2/Alyssa_NoHands_RedSuite_Lobby/qtzjxMSwEa/ypTds_0CK3/image.png';

  try {
    // Test 1: Check if the URL is accessible as an image
    console.log('1. Testing Alyssa URL as Image:');
    console.log('-------------------------------');
    console.log('URL:', alyssaUrl);
    
    try {
      const imageResponse = await fetch(alyssaUrl);
      console.log('Image Response Status:', imageResponse.status);
      console.log('Content-Type:', imageResponse.headers.get('content-type'));
      console.log('Content-Length:', imageResponse.headers.get('content-length'));
      
      if (imageResponse.ok && imageResponse.headers.get('content-type')?.includes('image')) {
        console.log('✅ Alyssa URL returns a valid image');
      } else {
        console.log('❌ Alyssa URL does not return a valid image');
      }
    } catch (error) {
      console.log('❌ Failed to fetch Alyssa URL:', error.message);
    }

    console.log('\n2. Checking D-ID Presenters API:');
    console.log('--------------------------------');
    
    // Test 2: Check D-ID Presenters (these are visual avatars)
    try {
      const presentersResponse = await fetch(`${didBaseUrl}/clips/presenters`, {
        headers: {
          'Authorization': `Basic ${didApiKey}`,
          'Accept': 'application/json'
        }
      });

      if (presentersResponse.ok) {
        const presentersData = await presentersResponse.json();
        console.log('Available Presenters:', presentersData.length || 0);
        
        // Look for Alyssa in presenters
        const alyssaPresenter = presentersData.find(p => 
          p.presenter_id?.toLowerCase().includes('alyssa') ||
          p.driver_id?.toLowerCase().includes('alyssa') ||
          JSON.stringify(p).toLowerCase().includes('alyssa')
        );
        
        if (alyssaPresenter) {
          console.log('✅ Found Alyssa in Presenters:');
          console.log('   Presenter ID:', alyssaPresenter.presenter_id);
          console.log('   Driver ID:', alyssaPresenter.driver_id);
          console.log('   Preview URL:', alyssaPresenter.preview_url);
          console.log('   → This confirms Alyssa is a VISUAL AVATAR/PRESENTER');
        } else {
          console.log('❌ Alyssa not found in Presenters list');
          
          // Show first few presenters for reference
          if (presentersData.length > 0) {
            console.log('\nFirst 3 available presenters:');
            presentersData.slice(0, 3).forEach((p, i) => {
              console.log(`   ${i+1}. ID: ${p.presenter_id}, Driver: ${p.driver_id}`);
            });
          }
        }
      } else {
        console.log('❌ Failed to fetch presenters:', presentersResponse.status);
      }
    } catch (error) {
      console.log('❌ Error fetching presenters:', error.message);
    }

    console.log('\n3. Checking D-ID Voices API:');
    console.log('----------------------------');
    
    // Test 3: Check D-ID Voices (these are audio-only)
    try {
      const voicesResponse = await fetch(`${didBaseUrl}/tts/voices`, {
        headers: {
          'Authorization': `Basic ${didApiKey}`,
          'Accept': 'application/json'
        }
      });

      if (voicesResponse.ok) {
        const voicesData = await voicesResponse.json();
        console.log('Available Voices:', voicesData.length || 0);
        
        // Look for Alyssa in voices
        const alyssaVoice = voicesData.find(v => 
          v.voice_id?.toLowerCase().includes('alyssa') ||
          v.name?.toLowerCase().includes('alyssa') ||
          JSON.stringify(v).toLowerCase().includes('alyssa')
        );
        
        if (alyssaVoice) {
          console.log('✅ Found Alyssa in Voices:');
          console.log('   Voice ID:', alyssaVoice.voice_id);
          console.log('   Name:', alyssaVoice.name);
          console.log('   Provider:', alyssaVoice.provider);
          console.log('   → This would mean Alyssa is ALSO a voice option');
        } else {
          console.log('❌ Alyssa not found in Voices list');
        }
      } else {
        console.log('❌ Failed to fetch voices:', voicesResponse.status);
      }
    } catch (error) {
      console.log('❌ Error fetching voices:', error.message);
    }

    console.log('\n4. Testing D-ID Streaming with Alyssa URL:');
    console.log('------------------------------------------');
    
    // Test 4: Try to create a stream with the Alyssa URL
    try {
      const streamResponse = await fetch(`${didBaseUrl}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${didApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: alyssaUrl,
          stream_warmup: true
        })
      });

      console.log('Stream Creation Status:', streamResponse.status);
      
      if (streamResponse.ok) {
        const streamData = await streamResponse.json();
        console.log('✅ Successfully created stream with Alyssa URL');
        console.log('   Stream ID:', streamData.id);
        console.log('   Session ID:', streamData.session_id);
        console.log('   → This confirms the URL works as a visual avatar source');
        
        // Clean up the stream
        try {
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
          console.log('   Stream cleaned up');
        } catch (cleanupError) {
          console.log('   Warning: Stream cleanup failed');
        }
      } else {
        const errorData = await streamResponse.text();
        console.log('❌ Failed to create stream:', errorData);
        console.log('   → This might indicate the URL is not a valid avatar source');
      }
    } catch (error) {
      console.log('❌ Error testing stream creation:', error.message);
    }

    console.log('\n🎯 Analysis Summary:');
    console.log('====================');
    console.log('Based on the URL structure and D-ID documentation:');
    console.log('');
    console.log('📍 URL Pattern Analysis:');
    console.log('   clips-presenters.d-id.com → This domain suggests PRESENTERS (visual avatars)');
    console.log('   /v2/Alyssa_NoHands_RedSuite_Lobby/ → Specific presenter configuration');
    console.log('   /image.png → Final image file for the avatar');
    console.log('');
    console.log('🔍 What this means:');
    console.log('   • Alyssa appears to be a VISUAL PRESENTER/AVATAR');
    console.log('   • The URL points to the avatar image used for video generation');
    console.log('   • This is NOT just a voice option');
    console.log('   • The "NoHands_RedSuite_Lobby" suggests a specific pose/outfit variant');
    console.log('');
    console.log('💡 Conclusion:');
    console.log('   Alyssa IS a visual avatar, not just a voice option.');
    console.log('   The URL should work for D-ID Streaming API as a source_url.');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
verifyAlyssaType().then(() => {
  console.log('\n🏁 Verification completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Verification crashed:', error);
  process.exit(1);
});
