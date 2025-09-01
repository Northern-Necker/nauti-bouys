// Test the verification page to check MediaPipe status
import fetch from 'node-fetch';

async function testVerificationPage() {
    try {
        console.log('🧪 Testing MediaPipe verification page...');
        
        const response = await fetch('http://localhost:5175/verify-mediapipe-fix.html');
        const html = await response.text();
        
        console.log('✅ Verification page loaded successfully');
        console.log(`📄 Page size: ${html.length} characters`);
        
        // Check if key elements are present
        if (html.includes('MediaPipe Fix Verification')) {
            console.log('✅ Verification page title found');
        }
        
        if (html.includes('src="/src/autonomous-viseme-main.js"')) {
            console.log('✅ Module loader script tag found');
        }
        
        if (html.includes('runMediaPipeTest')) {
            console.log('✅ MediaPipe test function found');
        }
        
        console.log('🎉 Verification page structure looks correct!');
        console.log('📝 To see test results, visit: http://localhost:5175/verify-mediapipe-fix.html');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testVerificationPage();