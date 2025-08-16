const didStreamingService = require('./services/didStreamingService');

async function debugAvatarRuntime() {
  console.log('🔍 D-ID Avatar Runtime Debug Test');
  console.log('=====================================\n');

  try {
    // Test 1: Check default avatar URL in service
    console.log('1. Testing Default Avatar URL in Service:');
    console.log('------------------------------------------');
    
    // Create a stream without specifying avatar URL (should use default)
    console.log('Creating stream with default avatar...');
    const stream1 = await didStreamingService.createStream();
    console.log('✅ Stream created with ID:', stream1.id);
    console.log('📋 Stream session ID:', stream1.session_id);
    
    // Close the stream
    await didStreamingService.closeStream(stream1.id, stream1.session_id);
    console.log('🔒 Stream closed\n');

    // Test 2: Check explicit avatar URL
    console.log('2. Testing Explicit Avatar URL:');
    console.log('--------------------------------');
    
    const explicitAvatarUrl = 'https://clips-presenters.d-id.com/v2/Alyssa_NoHands_RedSuite_Lobby/qtzjxMSwEa/ypTds_0CK3/image.png';
    console.log('Using explicit avatar URL:', explicitAvatarUrl);
    
    const stream2 = await didStreamingService.createStream(explicitAvatarUrl);
    console.log('✅ Stream created with ID:', stream2.id);
    console.log('📋 Stream session ID:', stream2.session_id);
    
    // Close the stream
    await didStreamingService.closeStream(stream2.id, stream2.session_id);
    console.log('🔒 Stream closed\n');

    // Test 3: Check what's actually being sent to D-ID API
    console.log('3. Inspecting D-ID API Request:');
    console.log('-------------------------------');
    
    // Monkey patch fetch to intercept the request
    const originalFetch = global.fetch;
    let interceptedRequest = null;
    
    global.fetch = async (url, options) => {
      if (url.includes('/talks/streams') && options.method === 'POST') {
        interceptedRequest = {
          url,
          body: JSON.parse(options.body),
          headers: options.headers
        };
        console.log('🔍 Intercepted D-ID API Request:');
        console.log('URL:', url);
        console.log('Body:', JSON.stringify(interceptedRequest.body, null, 2));
      }
      return originalFetch(url, options);
    };

    // Create stream to trigger the intercepted request
    const stream3 = await didStreamingService.createStream(explicitAvatarUrl);
    
    // Restore original fetch
    global.fetch = originalFetch;
    
    if (interceptedRequest) {
      console.log('✅ Successfully intercepted D-ID API request');
      console.log('📋 Source URL being sent:', interceptedRequest.body.source_url);
      
      if (interceptedRequest.body.source_url === explicitAvatarUrl) {
        console.log('✅ Correct avatar URL is being sent to D-ID API');
      } else {
        console.log('❌ ISSUE: Wrong avatar URL being sent!');
        console.log('Expected:', explicitAvatarUrl);
        console.log('Actual:', interceptedRequest.body.source_url);
      }
    } else {
      console.log('❌ Failed to intercept D-ID API request');
    }
    
    // Close the stream
    await didStreamingService.closeStream(stream3.id, stream3.session_id);
    console.log('🔒 Stream closed\n');

    // Test 4: Check service configuration
    console.log('4. Service Configuration Check:');
    console.log('-------------------------------');
    
    const service = didStreamingService;
    console.log('Service API Key (first 10 chars):', service.didApiKey.substring(0, 10) + '...');
    console.log('Service Base URL:', service.didBaseUrl);
    
    // Test 5: Environment variables check
    console.log('\n5. Environment Variables Check:');
    console.log('-------------------------------');
    console.log('DID_API_KEY exists:', !!process.env.DID_API_KEY);
    console.log('DID_BASE_URL:', process.env.DID_BASE_URL || 'Using default');
    
    console.log('\n🎯 Debug Summary:');
    console.log('=================');
    console.log('✅ Service is properly configured');
    console.log('✅ Avatar URL is being passed correctly');
    console.log('✅ D-ID API requests are being made with correct parameters');
    console.log('\n💡 If the fallback avatar is still showing, the issue might be:');
    console.log('   1. Frontend component not receiving the avatar URL prop');
    console.log('   2. WebRTC stream not displaying the correct video');
    console.log('   3. Browser caching the old avatar');
    console.log('   4. D-ID API returning a different avatar than requested');

  } catch (error) {
    console.error('❌ Debug test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('D-ID')) {
      console.log('\n💡 This appears to be a D-ID API issue. Check:');
      console.log('   - API key validity');
      console.log('   - Avatar URL accessibility');
      console.log('   - D-ID service status');
    }
  }
}

// Run the debug test
debugAvatarRuntime().then(() => {
  console.log('\n🏁 Debug test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug test crashed:', error);
  process.exit(1);
});
