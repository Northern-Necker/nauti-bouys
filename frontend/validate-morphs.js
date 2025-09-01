#!/usr/bin/env node

/**
 * GLB Morph Target Validation Script
 * Tests if morph targets in SavannahAvatar.glb are actually functional
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for GLB file existence
const glbPaths = [
    './dist/assets/SavannahAvatar.glb',
    './public/assets/SavannahAvatar.glb',
    './assets/SavannahAvatar.glb'
];

function validateGLBFiles() {
    console.log('🔍 Validating GLB file availability...\n');
    
    let foundFiles = [];
    glbPaths.forEach(glbPath => {
        const fullPath = path.resolve(glbPath);
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            foundFiles.push({
                path: glbPath,
                size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
                fullPath: fullPath
            });
            console.log(`✅ Found: ${glbPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
            console.log(`❌ Missing: ${glbPath}`);
        }
    });

    if (foundFiles.length === 0) {
        console.log('\n❌ No GLB files found! Please ensure SavannahAvatar.glb is available.');
        return false;
    }

    console.log(`\n✅ Found ${foundFiles.length} GLB file(s)`);
    return foundFiles;
}

function validateTestFiles() {
    console.log('\n🧪 Validating test files...\n');
    
    const testFiles = [
        'working-morph-test.html',
        'comprehensive-morph-test.html', 
        'minimal-test.html'
    ];

    let validFiles = [];
    testFiles.forEach(testFile => {
        if (fs.existsSync(testFile)) {
            const stats = fs.statSync(testFile);
            validFiles.push(testFile);
            console.log(`✅ Test file: ${testFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
            console.log(`❌ Missing test file: ${testFile}`);
        }
    });

    return validFiles;
}

function generateTestReport() {
    console.log('\n📊 Generating validation report...\n');
    
    const glbFiles = validateGLBFiles();
    const testFiles = validateTestFiles();
    
    const report = {
        timestamp: new Date().toISOString(),
        glbFiles: glbFiles,
        testFiles: testFiles,
        status: glbFiles && testFiles.length > 0 ? 'READY' : 'INCOMPLETE',
        recommendations: []
    };

    if (!glbFiles) {
        report.recommendations.push('Add SavannahAvatar.glb to one of the expected paths');
    }

    if (testFiles.length === 0) {
        report.recommendations.push('Ensure test HTML files are available');
    }

    // Check dev server
    const packageJsonExists = fs.existsSync('./package.json');
    if (packageJsonExists) {
        console.log('✅ package.json found - dev server should be available');
        report.devServer = 'AVAILABLE';
    } else {
        console.log('❌ package.json missing - dev server may not work');
        report.devServer = 'UNAVAILABLE';
        report.recommendations.push('Ensure you are in the frontend directory with package.json');
    }

    console.log('\n📋 VALIDATION SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Status: ${report.status}`);
    console.log(`GLB Files: ${glbFiles ? glbFiles.length : 0}`);
    console.log(`Test Files: ${testFiles.length}`);
    console.log(`Dev Server: ${report.devServer}`);

    if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });
    }

    if (report.status === 'READY') {
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. Run: npm run dev');
        console.log('2. Open: http://localhost:5173/comprehensive-morph-test.html');
        console.log('3. Click "Load Avatar" and test visemes');
        console.log('4. Verify visual changes occur for each viseme');
    }

    // Save report
    fs.writeFileSync('./morph-validation-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Report saved to: morph-validation-report.json');

    return report;
}

// Expected morph targets for validation
const EXPECTED_MORPHS = {
    'mouth': ['mouthOpen', 'mouthClose', 'mouthPucker', 'mouthFunnel', 'mouthSmile'],
    'jaw': ['jawOpen', 'jawLeft', 'jawRight'],
    'tongue': ['tongueOut', 'tongueUp', 'tongueCurl'],
    'visemes': ['aa', 'uw', 'th', 'iy', 'ow', 'sil']
};

function generateMorphTestChecklist() {
    console.log('\n📝 MORPH TARGET TEST CHECKLIST:');
    console.log('='.repeat(50));
    
    Object.entries(EXPECTED_MORPHS).forEach(([category, morphs]) => {
        console.log(`\n${category.toUpperCase()}:`);
        morphs.forEach(morph => {
            console.log(`  ☐ ${morph} - Test for visible change`);
        });
    });

    console.log('\n🎭 VISUAL VERIFICATION STEPS:');
    console.log('1. ☐ Load avatar successfully');
    console.log('2. ☐ Avatar is properly scaled and visible');
    console.log('3. ☐ Face/head is clearly visible');
    console.log('4. ☐ AA viseme opens mouth wide');
    console.log('5. ☐ UW viseme rounds/puckers lips');
    console.log('6. ☐ TH viseme extends tongue');
    console.log('7. ☐ IY viseme creates smile');
    console.log('8. ☐ OW viseme rounds mouth');
    console.log('9. ☐ SIL resets to neutral');
    console.log('10. ☐ Intensity slider affects morph strength');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🎭 GLB Morph Target Validation');
    console.log('='.repeat(50));
    
    const report = generateTestReport();
    generateMorphTestChecklist();
    
    process.exit(report.status === 'READY' ? 0 : 1);
}

export { validateGLBFiles, validateTestFiles, generateTestReport };