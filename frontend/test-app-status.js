// Quick test to verify the autonomous viseme optimizer is working
import fetch from 'node-fetch';

async function testApplication() {
    try {
        console.log('🧪 Testing application status...');
        
        const response = await fetch('http://localhost:5175/autonomous-viseme-optimizer.html');
        const html = await response.text();
        
        console.log('✅ HTTP request successful');
        console.log(`📄 HTML size: ${html.length} characters`);
        
        // Check for key elements
        const checks = [
            { name: 'Module script tag', pattern: /script type="module" src="\/src\/autonomous-viseme-main\.js"/ },
            { name: 'MediaPipe reference', pattern: /MediaPipeVisemeAnalyzer/ },
            { name: 'Three.js references', pattern: /THREE/ },
            { name: 'Main script section', pattern: /<script>/ },
            { name: 'Canvas element', pattern: /<canvas/ }
        ];
        
        checks.forEach(check => {
            const found = check.pattern.test(html);
            console.log(`${found ? '✅' : '❌'} ${check.name}: ${found ? 'Found' : 'Missing'}`);
        });
        
        if (html.includes('System initialized. Ready for autonomous optimization')) {
            console.log('🎉 Application appears to be working correctly!');
        } else {
            console.log('⚠️  Initial status message not found in HTML');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testApplication();