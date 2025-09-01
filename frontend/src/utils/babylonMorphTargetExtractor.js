/**
 * Babylon.js-based Morph Target Extractor
 * 
 * Extracts morph target names using native Babylon.js SceneLoader to ensure
 * 100% accuracy with the actual runtime implementation. This eliminates any
 * potential discrepancies between THREE.js and Babylon.js GLB parsing.
 * 
 * Key Features:
 * - Uses Babylon.js SceneLoader for consistent parsing
 * - Extracts exact morph target names as seen by Babylon.js runtime
 * - Organizes results by mesh (CC_Game_Body, CC_Game_Tongue, etc.)
 * - Provides comparison tools for viseme mapping validation
 */

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class BabylonMorphTargetExtractor {
  constructor() {
    this.engine = null;
    this.scene = null;
    this.meshes = [];
    this.morphTargets = [];
    this.morphsByMesh = new Map();
    this.extractedData = null;
  }

  /**
   * Extract morph target names from GLB file using Babylon.js
   */
  async extractFromGLB(glbUrl, options = {}) {
    const {
      useHeadlessCanvas = true,
      verbose = true,
      generateReport = true
    } = options;

    console.log('🔬 Babylon.js Morph Target Extractor - Starting extraction...');
    console.log(`📂 GLB URL: ${glbUrl}`);

    try {
      // Step 1: Initialize Babylon.js environment
      await this.initializeBabylon(useHeadlessCanvas);
      
      // Step 2: Load GLB model
      await this.loadGLBModel(glbUrl);
      
      // Step 3: Extract morph targets
      this.extractMorphTargets(verbose);
      
      // Step 4: Organize and analyze data
      this.organizeExtractedData();
      
      // Step 5: Generate comprehensive report
      if (generateReport) {
        this.generateExtractionReport();
      }
      
      console.log('✅ Babylon.js morph target extraction complete!');
      return this.extractedData;

    } catch (error) {
      console.error('❌ Babylon.js morph target extraction failed:', error);
      throw error;
    } finally {
      // Cleanup resources
      this.dispose();
    }
  }

  /**
   * Initialize minimal Babylon.js environment for morph extraction
   */
  async initializeBabylon(useHeadlessCanvas = true) {
    try {
      console.log('🚀 Initializing Babylon.js environment...');

      let canvas;
      if (useHeadlessCanvas) {
        // Create offscreen canvas for headless operation
        canvas = new OffscreenCanvas(1, 1);
      } else {
        // Create minimal DOM canvas
        canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
      }

      // Create minimal engine
      this.engine = new BABYLON.Engine(canvas, false, {
        preserveDrawingBuffer: false,
        stencil: false,
        antialias: false,
        disableWebGL2Support: false
      });

      // Create minimal scene
      this.scene = new BABYLON.Scene(this.engine);
      
      // Minimal lighting (required for some GLB imports)
      const light = new BABYLON.HemisphericLight("extractorLight", new BABYLON.Vector3(0, 1, 0), this.scene);
      light.intensity = 0.1; // Minimal intensity

      console.log('✅ Babylon.js environment initialized');

    } catch (error) {
      throw new Error(`Failed to initialize Babylon.js: ${error.message}`);
    }
  }

  /**
   * Load GLB model using Babylon.js SceneLoader
   */
  async loadGLBModel(glbUrl) {
    return new Promise((resolve, reject) => {
      console.log('📥 Loading GLB model with Babylon.js SceneLoader...');

      try {
        BABYLON.SceneLoader.ImportMesh(
          '',
          '',
          glbUrl,
          this.scene,
          (meshes, particleSystems, skeletons) => {
            console.log(`✅ GLB loaded: ${meshes.length} meshes, ${particleSystems.length} particle systems, ${skeletons.length} skeletons`);
            
            // Filter meshes with morph targets
            this.meshes = meshes.filter(mesh => 
              mesh.morphTargetManager && 
              mesh.morphTargetManager.numTargets > 0
            );

            if (this.meshes.length === 0) {
              reject(new Error('No meshes with morph targets found in GLB file'));
              return;
            }

            console.log(`🎯 Found ${this.meshes.length} meshes with morph targets`);
            resolve();
          },
          (progressEvent) => {
            // Progress logging (optional)
            if (progressEvent.lengthComputable) {
              const percent = (progressEvent.loaded / progressEvent.total * 100).toFixed(1);
              console.log(`📥 Loading progress: ${percent}%`);
            }
          },
          (scene, message, exception) => {
            const errorMsg = exception?.message || message || 'GLB import failed';
            console.error('❌ GLB import error:', errorMsg);
            reject(new Error(`GLB import failed: ${errorMsg}`));
          }
        );

      } catch (error) {
        reject(new Error(`SceneLoader error: ${error.message}`));
      }
    });
  }

  /**
   * Extract morph targets from all meshes using Babylon.js native methods
   */
  extractMorphTargets(verbose = true) {
    console.log('🔍 Extracting morph targets from meshes...');

    this.morphTargets = [];
    let totalMorphs = 0;

    this.meshes.forEach(mesh => {
      const manager = mesh.morphTargetManager;
      const meshMorphs = [];

      if (verbose) {
        console.log(`\n📊 Processing mesh: ${mesh.name}`);
        console.log(`  └─ Morph targets: ${manager.numTargets}`);
      }

      for (let i = 0; i < manager.numTargets; i++) {
        try {
          const target = manager.getTarget(i);
          const morphData = {
            name: target.name,
            meshName: mesh.name,
            meshId: mesh.id,
            index: i,
            influence: target.influence,
            // Additional metadata
            hasPositions: target.hasPositions,
            hasNormals: target.hasNormals,
            hasTangents: target.hasTangents,
            hasUVs: target.hasUVs
          };

          this.morphTargets.push(morphData);
          meshMorphs.push(morphData);
          totalMorphs++;

          if (verbose) {
            console.log(`    ${i + 1}. "${target.name}" (influence: ${target.influence})`);
          }

        } catch (error) {
          console.warn(`  └─ ⚠️ Failed to process morph target ${i} for mesh ${mesh.name}:`, error.message);
        }
      }

      // Store morphs by mesh
      this.morphsByMesh.set(mesh.name, meshMorphs);
    });

    console.log(`✅ Extracted ${totalMorphs} morph targets from ${this.meshes.length} meshes`);
  }

  /**
   * Organize extracted data by mesh type and create analysis
   */
  organizeExtractedData() {
    console.log('📋 Organizing extracted morph data...');

    const organizedData = {
      extractionTimestamp: new Date().toISOString(),
      totalMeshes: this.meshes.length,
      totalMorphTargets: this.morphTargets.length,
      
      // Organize by mesh
      meshesByType: {
        CC_Game_Body: [],
        CC_Game_Tongue: [],
        Other: []
      },
      
      // All morphs by mesh name
      morphsByMesh: {},
      
      // Flat list of all morph names
      allMorphNames: [],
      
      // Unique morph names (deduplicated)
      uniqueMorphNames: new Set(),
      
      // Analysis
      analysis: {
        morphsPerMesh: new Map(),
        duplicateMorphNames: [],
        meshDistribution: {}
      }
    };

    // Process each mesh
    this.meshes.forEach(mesh => {
      const meshMorphs = this.morphsByMesh.get(mesh.name) || [];
      const morphNames = meshMorphs.map(m => m.name);
      
      // Categorize mesh
      if (mesh.name.includes('CC_Game_Body')) {
        organizedData.meshesByType.CC_Game_Body.push({
          name: mesh.name,
          id: mesh.id,
          morphCount: meshMorphs.length,
          morphNames: morphNames
        });
      } else if (mesh.name.includes('CC_Game_Tongue')) {
        organizedData.meshesByType.CC_Game_Tongue.push({
          name: mesh.name,
          id: mesh.id,
          morphCount: meshMorphs.length,
          morphNames: morphNames
        });
      } else {
        organizedData.meshesByType.Other.push({
          name: mesh.name,
          id: mesh.id,
          morphCount: meshMorphs.length,
          morphNames: morphNames
        });
      }
      
      // Store morphs by mesh
      organizedData.morphsByMesh[mesh.name] = meshMorphs;
      
      // Add to flat list
      organizedData.allMorphNames.push(...morphNames);
      
      // Add to unique set
      morphNames.forEach(name => organizedData.uniqueMorphNames.add(name));
      
      // Analysis
      organizedData.analysis.morphsPerMesh.set(mesh.name, meshMorphs.length);
    });

    // Convert Set to Array for JSON serialization
    organizedData.uniqueMorphNames = Array.from(organizedData.uniqueMorphNames);

    // Find duplicate morph names
    const nameCount = {};
    organizedData.allMorphNames.forEach(name => {
      nameCount[name] = (nameCount[name] || 0) + 1;
    });
    
    organizedData.analysis.duplicateMorphNames = Object.entries(nameCount)
      .filter(([name, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));

    // Mesh distribution
    organizedData.analysis.meshDistribution = {
      CC_Game_Body: organizedData.meshesByType.CC_Game_Body.length,
      CC_Game_Tongue: organizedData.meshesByType.CC_Game_Tongue.length,
      Other: organizedData.meshesByType.Other.length
    };

    this.extractedData = organizedData;
    console.log('✅ Data organization complete');
  }

  /**
   * Generate comprehensive extraction report
   */
  generateExtractionReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 BABYLON.JS MORPH TARGET EXTRACTION REPORT');
    console.log('='.repeat(80));
    console.log(`Extraction Time: ${this.extractedData.extractionTimestamp}`);
    console.log(`Total Meshes: ${this.extractedData.totalMeshes}`);
    console.log(`Total Morph Targets: ${this.extractedData.totalMorphTargets}`);
    console.log();

    // Mesh Distribution
    console.log('🎭 MESH DISTRIBUTION:');
    console.log(`  └─ CC_Game_Body meshes: ${this.extractedData.analysis.meshDistribution.CC_Game_Body}`);
    console.log(`  └─ CC_Game_Tongue meshes: ${this.extractedData.analysis.meshDistribution.CC_Game_Tongue}`);
    console.log(`  └─ Other meshes: ${this.extractedData.analysis.meshDistribution.Other}`);
    console.log();

    // Body mesh morphs
    if (this.extractedData.meshesByType.CC_Game_Body.length > 0) {
      console.log('🧑 CC_Game_Body MORPHS:');
      this.extractedData.meshesByType.CC_Game_Body.forEach(mesh => {
        console.log(`  Mesh: ${mesh.name} (${mesh.morphCount} morphs)`);
        mesh.morphNames.forEach(name => console.log(`    └─ ${name}`));
      });
      console.log();
    }

    // Tongue mesh morphs
    if (this.extractedData.meshesByType.CC_Game_Tongue.length > 0) {
      console.log('👅 CC_Game_Tongue MORPHS:');
      this.extractedData.meshesByType.CC_Game_Tongue.forEach(mesh => {
        console.log(`  Mesh: ${mesh.name} (${mesh.morphCount} morphs)`);
        mesh.morphNames.forEach(name => console.log(`    └─ ${name}`));
      });
      console.log();
    }

    // Other meshes
    if (this.extractedData.meshesByType.Other.length > 0) {
      console.log('🔧 OTHER MESHES:');
      this.extractedData.meshesByType.Other.forEach(mesh => {
        console.log(`  Mesh: ${mesh.name} (${mesh.morphCount} morphs)`);
      });
      console.log();
    }

    // Unique morph names
    console.log('📝 ALL UNIQUE MORPH NAMES:');
    this.extractedData.uniqueMorphNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    console.log();

    // Duplicates analysis
    if (this.extractedData.analysis.duplicateMorphNames.length > 0) {
      console.log('⚠️ DUPLICATE MORPH NAMES:');
      this.extractedData.analysis.duplicateMorphNames.forEach(({ name, count }) => {
        console.log(`  └─ "${name}" appears ${count} times`);
      });
      console.log();
    }

    console.log('='.repeat(80));
    console.log('📋 EXTRACTION REPORT COMPLETE');
    console.log('='.repeat(80));
  }

  /**
   * Compare with expected viseme mappings
   */
  compareWithVisemeMappings(expectedMappings) {
    console.log('\n🔍 COMPARING WITH EXPECTED VISEME MAPPINGS:');
    console.log('='.repeat(60));

    const results = {
      found: [],
      missing: [],
      alternatives: []
    };

    // Get all expected morph names from mappings
    const expectedMorphs = new Set();
    Object.values(expectedMappings).forEach(mapping => {
      if (mapping.morphs) {
        mapping.morphs.forEach(morphName => expectedMorphs.add(morphName));
      }
    });

    console.log(`Expected morph names: ${expectedMorphs.size}`);
    console.log(`Found morph names: ${this.extractedData.uniqueMorphNames.length}`);
    console.log();

    // Check each expected morph
    expectedMorphs.forEach(expectedMorph => {
      const exactMatch = this.extractedData.uniqueMorphNames.includes(expectedMorph);
      
      if (exactMatch) {
        results.found.push(expectedMorph);
        console.log(`✅ FOUND: ${expectedMorph}`);
      } else {
        results.missing.push(expectedMorph);
        console.log(`❌ MISSING: ${expectedMorph}`);
        
        // Look for similar names
        const similar = this.extractedData.uniqueMorphNames.filter(name => 
          name.toLowerCase().includes(expectedMorph.toLowerCase()) ||
          expectedMorph.toLowerCase().includes(name.toLowerCase())
        );
        
        if (similar.length > 0) {
          console.log(`    🔍 Possible alternatives: ${similar.join(', ')}`);
          results.alternatives.push({
            expected: expectedMorph,
            alternatives: similar
          });
        }
      }
    });

    console.log();
    console.log(`✅ Found: ${results.found.length}/${expectedMorphs.size}`);
    console.log(`❌ Missing: ${results.missing.length}/${expectedMorphs.size}`);
    console.log(`🔍 With alternatives: ${results.alternatives.length}/${results.missing.length}`);

    return results;
  }

  /**
   * Export extracted data to JSON
   */
  exportToJSON() {
    return JSON.stringify(this.extractedData, null, 2);
  }

  /**
   * Clean up Babylon.js resources
   */
  dispose() {
    try {
      if (this.scene) {
        this.scene.dispose();
        this.scene = null;
      }
      if (this.engine) {
        this.engine.dispose();
        this.engine = null;
      }
      console.log('🗑️ Babylon.js resources disposed');
    } catch (error) {
      console.warn('⚠️ Error during disposal:', error.message);
    }
  }
}

/**
 * Convenience function for quick extraction
 */
export async function extractMorphTargetsWithBabylon(glbUrl, options = {}) {
  const extractor = new BabylonMorphTargetExtractor();
  return await extractor.extractFromGLB(glbUrl, options);
}

/**
 * Compare current viseme mappings with actual GLB morph names
 */
export async function validateVisemeMappings(glbUrl, visemeMappings, options = {}) {
  console.log('🔬 VALIDATING VISEME MAPPINGS AGAINST ACTUAL GLB MORPHS');
  console.log('='.repeat(70));
  
  try {
    const extractor = new BabylonMorphTargetExtractor();
    const extractedData = await extractor.extractFromGLB(glbUrl, {
      ...options,
      generateReport: false // We'll generate our own comparison report
    });

    const comparisonResults = extractor.compareWithVisemeMappings(visemeMappings);
    
    // Generate validation report
    console.log('\n📊 VISEME MAPPING VALIDATION RESULTS:');
    console.log('='.repeat(50));
    
    const totalExpected = comparisonResults.found.length + comparisonResults.missing.length;
    const successRate = ((comparisonResults.found.length / totalExpected) * 100).toFixed(1);
    
    console.log(`Success Rate: ${successRate}% (${comparisonResults.found.length}/${totalExpected})`);
    console.log();
    
    if (comparisonResults.missing.length > 0) {
      console.log('❌ MISSING MORPHS - REQUIRE ATTENTION:');
      comparisonResults.missing.forEach(missing => {
        console.log(`  └─ ${missing}`);
      });
      console.log();
    }
    
    if (comparisonResults.alternatives.length > 0) {
      console.log('🔧 SUGGESTED MAPPING CORRECTIONS:');
      comparisonResults.alternatives.forEach(({ expected, alternatives }) => {
        console.log(`  ${expected} → ${alternatives[0]} (${alternatives.length} alternatives)`);
      });
    }
    
    return {
      extractedData,
      comparisonResults,
      successRate: parseFloat(successRate),
      needsCorrection: comparisonResults.missing.length > 0
    };

  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}
