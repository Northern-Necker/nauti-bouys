/**
 * Extract Morph Targets using Babylon.js
 * 
 * This script uses the BabylonMorphTargetExtractor to get the definitive
 * morph target names from the GLB file using native Babylon.js parsing.
 * 
 * Usage: node extract-babylon-morphs.js
 */

import { validateVisemeMappings, extractMorphTargetsWithBabylon } from './frontend/src/utils/babylonMorphTargetExtractor.js';

// Current viseme mappings from babylonGLBActorCoreLipSync.js
const CURRENT_VISEME_MAPPINGS = {
  sil: { morphs: ['V_None'], weights: [1.0] },
  PP: { morphs: ['V_Explosive'], weights: [1.0] },
  FF: { morphs: ['V_Dental_Lip'], weights: [1.0] },
  TH: { morphs: ['V_Dental_Lip', 'V_Open'], weights: [0.8, 0.4] },
  DD: { morphs: ['V_Dental_Lip', 'V_Open'], weights: [0.7, 0.5] },
  kk: { morphs: ['V_Tight-O'], weights: [1.0] },
  CH: { morphs: ['V_Wide'], weights: [1.0] },
  SS: { morphs: ['V_Tight-O', 'V_Wide'], weights: [0.6, 0.8] },
  nn: { morphs: ['V_Explosive'], weights: [0.8] },
  RR: { morphs: ['V_Open', 'V_Wide'], weights: [0.6, 0.4] },
  aa: { morphs: ['V_Open'], weights: [1.0] },
  E: { morphs: ['V_Wide'], weights: [1.0] },
  I: { morphs: ['V_Open'], weights: [0.5] },
  O: { morphs: ['V_Tight-O'], weights: [1.0] },
  U: { morphs: ['V_Tight-O'], weights: [1.0] }
};

async function main() {
  console.log('🔬 BABYLON.JS MORPH TARGET EXTRACTION & VALIDATION');
  console.log('='.repeat(70));
  console.log('This script extracts actual morph names from the GLB file using');
  console.log('native Babylon.js parsing to ensure 100% accuracy with runtime.');
  console.log('='.repeat(70));
  
  try {
    // Path to GLB file
    const glbPath = './frontend/public/assets/party-f-0013-fixed.glb';
    console.log(`📂 Target GLB: ${glbPath}\n`);
    
    // Extract morphs using Babylon.js
    console.log('🚀 STEP 1: EXTRACTING MORPH TARGETS WITH BABYLON.JS');
    console.log('-'.repeat(50));
    
    const extractedData = await extractMorphTargetsWithBabylon(glbPath, {
      verbose: true,
      generateReport: true
    });
    
    console.log('\n🔍 STEP 2: VALIDATING CURRENT VISEME MAPPINGS');
    console.log('-'.repeat(50));
    
    // Validate current mappings
    const validationResult = await validateVisemeMappings(glbPath, CURRENT_VISEME_MAPPINGS, {
      verbose: false,
      generateReport: false
    });
    
    console.log('\n📊 FINAL SUMMARY:');
    console.log('='.repeat(40));
    console.log(`Total GLB Morphs Found: ${extractedData.totalMorphTargets}`);
    console.log(`Unique Morph Names: ${extractedData.uniqueMorphNames.length}`);
    console.log(`Viseme Mapping Success Rate: ${validationResult.successRate}%`);
    console.log(`Mappings Need Correction: ${validationResult.needsCorrection ? 'YES ⚠️' : 'NO ✅'}`);
    
    if (validationResult.needsCorrection) {
      console.log('\n🔧 CORRECTIVE ACTIONS NEEDED:');
      console.log('The current viseme mappings contain incorrect morph names.');
      console.log('See the validation report above for suggested corrections.');
    } else {
      console.log('\n✅ ALL VISEME MAPPINGS ARE CORRECT!');
      console.log('Current mappings match the actual GLB morph targets.');
    }
    
    // Save detailed results to file
    const fs = await import('fs/promises');
    const resultsPath = './babylon-morph-extraction-results.json';
    
    const fullResults = {
      extractionTimestamp: new Date().toISOString(),
      extractedData: extractedData,
      validationResult: validationResult,
      currentMappings: CURRENT_VISEME_MAPPINGS
    };
    
    await fs.writeFile(resultsPath, JSON.stringify(fullResults, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsPath}`);
    
  } catch (error) {
    console.error('\n❌ EXTRACTION FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle Node.js environment setup for Babylon.js
async function setupNodeEnvironment() {
  // Import required Node.js modules
  const { JSDOM } = await import('jsdom');
  const { createCanvas, loadImage } = await import('canvas');
  
  // Create DOM environment
  const dom = new JSDOM('<!DOCTYPE html><html><body><canvas></canvas></body></html>', {
    pretendToBeVisual: true,
    resources: 'usable'
  });
  
  // Setup global variables for Babylon.js
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
  global.WebGLRenderingContext = dom.window.WebGLRenderingContext;
  global.WebGL2RenderingContext = dom.window.WebGL2RenderingContext;
  global.Image = dom.window.Image;
  
  // Setup OffscreenCanvas for headless operation
  global.OffscreenCanvas = class OffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.canvas = createCanvas(width, height);
    }
    
    getContext(type) {
      return this.canvas.getContext(type);
    }
    
    transferToImageBitmap() {
      return this.canvas;
    }
  };
  
  console.log('✅ Node.js environment setup for Babylon.js complete');
}

// Check if we need to install dependencies
async function checkDependencies() {
  try {
    await import('jsdom');
    await import('canvas');
    console.log('✅ Required dependencies found');
  } catch (error) {
    console.error('❌ Missing dependencies. Please install:');
    console.error('npm install jsdom canvas');
    console.error('');
    console.error('These are required for headless Babylon.js operation in Node.js');
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    console.log('🔧 Checking dependencies...');
    await checkDependencies();
    
    console.log('🔧 Setting up Node.js environment...');
    await setupNodeEnvironment();
    
    console.log('🚀 Starting Babylon.js morph extraction...\n');
    await main();
    
  } catch (error) {
    console.error('❌ Failed to setup environment:', error.message);
    process.exit(1);
  }
})();
