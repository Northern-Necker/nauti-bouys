const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ARKit visemes to test
const arkitVisemes = [
    'sil', 'aa', 'ae', 'ah', 'ao', 'aw', 'ay', 'b_m_p', 
    'ch_j_sh_zh', 'd_s_t', 'eh', 'er', 'f_v', 'g_k', 
    'hh', 'ih', 'iy', 'l', 'n', 'ng', 'ow', 'oy', 
    'r', 'th', 'uh', 'uw', 'w', 'y', 'z'
];

async function captureMorphScreenshots() {
    console.log('🎭 Starting GLB Morph Visual Test...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    try {
        // Load the test page
        const testUrl = `file://${path.join(__dirname, 'src/validation/executable-morph-test.html')}`;
        console.log(`📄 Loading test page: ${testUrl}`);
        
        await page.goto(testUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Wait for Three.js to initialize
        console.log('⏳ Waiting for Three.js initialization...');
        await page.waitForTimeout(3000);
        
        // Check if avatar loaded
        const avatarStatus = await page.evaluate(() => {
            return document.getElementById('status').textContent;
        });
        console.log(`🤖 Avatar status: ${avatarStatus}`);
        
        let testResults = {
            timestamp: new Date().toISOString(),
            totalVisemes: arkitVisemes.length,
            successfulCaptures: 0,
            failedCaptures: 0,
            screenshots: [],
            morphAnalysis: {}
        };
        
        // Test each viseme
        for (let i = 0; i < arkitVisemes.length; i++) {
            const viseme = arkitVisemes[i];
            console.log(`📸 Testing viseme ${i + 1}/${arkitVisemes.length}: ${viseme.toUpperCase()}`);
            
            try {
                // Click the viseme button
                await page.evaluate((visemeIndex) => {
                    const buttons = document.querySelectorAll('.viseme-btn');
                    if (buttons[visemeIndex]) {
                        buttons[visemeIndex].click();
                    }
                }, i);
                
                // Wait for morph to apply
                await page.waitForTimeout(800);
                
                // Capture current morph values
                const morphData = await page.evaluate(() => {
                    if (window.morphTargets) {
                        return window.morphTargets.map(m => ({
                            name: m.name,
                            value: m.influence || 0
                        }));
                    }
                    return [];
                });
                
                // Take screenshot of the canvas area
                const canvas = await page.$('canvas');
                if (canvas) {
                    const screenshotPath = path.join(screenshotsDir, `viseme-${viseme}-${Date.now()}.png`);
                    await canvas.screenshot({ path: screenshotPath });
                    
                    console.log(`✅ Captured ${viseme}: ${screenshotPath}`);
                    
                    testResults.screenshots.push({
                        viseme: viseme,
                        path: screenshotPath,
                        morphValues: morphData,
                        timestamp: Date.now()
                    });
                    
                    testResults.morphAnalysis[viseme] = {
                        activeMorphs: morphData.filter(m => m.value > 0.1).length,
                        primaryMorphs: morphData.filter(m => m.value > 0.1).slice(0, 3),
                        maxMorphValue: Math.max(...morphData.map(m => m.value))
                    };
                    
                    testResults.successfulCaptures++;
                } else {
                    console.log(`❌ No canvas found for ${viseme}`);
                    testResults.failedCaptures++;
                }
                
            } catch (error) {
                console.log(`❌ Failed to capture ${viseme}: ${error.message}`);
                testResults.failedCaptures++;
            }
            
            // Brief pause between captures
            await page.waitForTimeout(300);
        }
        
        // Capture neutral state for comparison
        console.log('📸 Capturing neutral state...');
        await page.evaluate(() => {
            if (window.resetAllMorphs) {
                window.resetAllMorphs();
            }
        });
        
        await page.waitForTimeout(500);
        const neutralCanvas = await page.$('canvas');
        if (neutralCanvas) {
            const neutralPath = path.join(screenshotsDir, `neutral-baseline-${Date.now()}.png`);
            await neutralCanvas.screenshot({ path: neutralPath });
            console.log(`✅ Captured neutral baseline: ${neutralPath}`);
        }
        
        // Save test results
        const reportPath = path.join(__dirname, `morph-test-results-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
        
        console.log('\n🎉 Test Complete!');
        console.log(`📊 Results: ${testResults.successfulCaptures} successful, ${testResults.failedCaptures} failed`);
        console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
        console.log(`📋 Report saved to: ${reportPath}`);
        
        // Generate analysis summary
        console.log('\n📈 Morph Analysis Summary:');
        Object.entries(testResults.morphAnalysis).forEach(([viseme, analysis]) => {
            console.log(`  ${viseme.toUpperCase()}: ${analysis.activeMorphs} active morphs, max value: ${analysis.maxMorphValue.toFixed(2)}`);
        });
        
        return testResults;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run if called directly
if (require.main === module) {
    captureMorphScreenshots()
        .then(results => {
            console.log('✅ Screenshot capture completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Screenshot capture failed:', error);
            process.exit(1);
        });
}

module.exports = { captureMorphScreenshots };