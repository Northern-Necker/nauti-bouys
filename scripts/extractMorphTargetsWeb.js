#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Create a DOM environment for Three.js
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Set up global variables that Three.js expects
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.HTMLImageElement = dom.window.HTMLImageElement;
global.ImageData = dom.window.ImageData;
global.createImageBitmap = () => Promise.resolve({});

// Mock canvas context
global.window.HTMLCanvasElement.prototype.getContext = function(type) {
  if (type === '2d') {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      createImageData: () => ({ data: new Uint8ClampedArray(4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {}
    };
  }
  return null;
};

let THREE;
try {
  THREE = require('three');
} catch (err) {
  console.error('three package is required but not installed.');
  process.exit(1);
}

async function loadFbxFromFile(filePath) {
  try {
    // Read the file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    // Convert to ArrayBuffer
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
    const loader = new FBXLoader();
    
    // Parse the buffer directly
    return loader.parse(arrayBuffer, path.dirname(filePath));
  } catch (error) {
    console.error('Error loading FBX file:', error);
    throw error;
  }
}

function extractMorphTargets(object) {
  const morphTargets = [];
  
  object.traverse((child) => {
    if (child.isMesh && child.geometry && child.geometry.morphAttributes) {
      const morphAttributes = child.geometry.morphAttributes;
      
      if (morphAttributes.position) {
        const morphTargetNames = child.morphTargetDictionary || {};
        const morphTargetInfluences = child.morphTargetInfluences || [];
        
        console.log(`\nMesh: ${child.name || 'Unnamed'}`);
        console.log(`Morph targets count: ${morphAttributes.position.length}`);
        
        // Extract morph target names
        const targetInfo = [];
        for (let i = 0; i < morphAttributes.position.length; i++) {
          const targetName = Object.keys(morphTargetNames).find(key => morphTargetNames[key] === i) || `Target_${i}`;
          const influence = morphTargetInfluences[i] || 0;
          
          targetInfo.push({
            index: i,
            name: targetName,
            influence: influence
          });
        }
        
        morphTargets.push({
          meshName: child.name || 'Unnamed',
          targets: targetInfo
        });
        
        // Print detailed info
        console.log('Morph Target Names:');
        targetInfo.forEach((target, index) => {
          console.log(`  ${index}: ${target.name} (influence: ${target.influence})`);
        });
      }
    }
  });
  
  return morphTargets;
}

async function analyzeFbxMorphTargets(filePath) {
  try {
    console.log(`Loading FBX file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const scene = await loadFbxFromFile(filePath);
    console.log('FBX file loaded successfully');
    
    const morphTargets = extractMorphTargets(scene);
    
    const result = {
      file: filePath,
      timestamp: new Date().toISOString(),
      morphTargets: morphTargets,
      totalMeshesWithMorphTargets: morphTargets.length,
      totalMorphTargets: morphTargets.reduce((sum, mesh) => sum + mesh.targets.length, 0)
    };
    
    // Save results to JSON file
    const outputPath = path.join(process.cwd(), 'morph-targets-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
    
    // Print summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total meshes with morph targets: ${result.totalMeshesWithMorphTargets}`);
    console.log(`Total morph targets: ${result.totalMorphTargets}`);
    
    if (morphTargets.length > 0) {
      console.log('\n=== ALL MORPH TARGET NAMES ===');
      morphTargets.forEach(mesh => {
        console.log(`\n${mesh.meshName}:`);
        mesh.targets.forEach(target => {
          console.log(`  - ${target.name}`);
        });
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('Failed to analyze FBX file:', error);
    throw error;
  }
}

// Command line usage
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/extractMorphTargetsWeb.js <path-to-fbx-file>');
  process.exit(1);
}

analyzeFbxMorphTargets(filePath).catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
});
