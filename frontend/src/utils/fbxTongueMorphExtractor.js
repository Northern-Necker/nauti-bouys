/**
 * FBX Tongue Morph Extractor
 * Attempts to find and access tongue morphs that are hidden in the FBX hierarchy
 */

import * as THREE from 'three';

export class FBXTongueMorphExtractor {
  constructor() {
    this.tongueMeshes = [];
    this.tongueMorphs = {};
    this.debugInfo = [];
  }

  /**
   * Deep search for tongue morphs in the FBX model
   * @param {THREE.Object3D} model - The loaded FBX model
   * @returns {Object} - Analysis results
   */
  findTongueMorphs(model) {
    console.log('🔍 Starting deep search for tongue morphs...');
    
    // Reset collections
    this.tongueMeshes = [];
    this.tongueMorphs = {};
    this.debugInfo = [];
    
    // Deep traverse with detailed logging
    this.deepTraverse(model);
    
    // Analyze results
    const results = {
      foundTongueMeshes: this.tongueMeshes.length > 0,
      tongueMeshCount: this.tongueMeshes.length,
      tongueMeshes: this.tongueMeshes,
      tongueMorphs: this.tongueMorphs,
      morphCount: Object.keys(this.tongueMorphs).length,
      debugInfo: this.debugInfo
    };
    
    // Log findings
    console.log('📊 Tongue Morph Search Results:');
    console.log(`  - Found ${results.tongueMeshCount} potential tongue meshes`);
    console.log(`  - Found ${results.morphCount} tongue morphs`);
    
    if (results.morphCount > 0) {
      console.log('✅ TONGUE MORPHS FOUND!');
      console.log('Available tongue morphs:', Object.keys(this.tongueMorphs));
    } else {
      console.log('❌ No tongue morphs accessible through standard methods');
      console.log('🔧 Attempting alternative extraction methods...');
      
      // Try alternative methods
      this.tryAlternativeMethods(model);
    }
    
    return results;
  }

  /**
   * Deep traverse the model hierarchy
   * @param {THREE.Object3D} object - Current object in traversal
   * @param {number} depth - Current depth in hierarchy
   */
  deepTraverse(object, depth = 0) {
    const indent = '  '.repeat(depth);
    
    // Check if this might be a tongue-related object
    const isTongueRelated = this.isTongueRelated(object);
    
    if (isTongueRelated) {
      console.log(`${indent}🎯 Found tongue-related object: ${object.name || object.uuid}`);
      this.debugInfo.push({
        name: object.name,
        type: object.type,
        uuid: object.uuid,
        depth: depth
      });
    }
    
    // Check if it's a mesh with morph targets
    if (object.isMesh || object.isSkinnedMesh) {
      const meshInfo = {
        name: object.name || 'unnamed',
        type: object.type,
        uuid: object.uuid,
        hasMorphTargets: false,
        morphTargetCount: 0,
        morphTargetNames: [],
        isTongue: isTongueRelated
      };
      
      // Check for morph target dictionary
      if (object.morphTargetDictionary) {
        meshInfo.hasMorphTargets = true;
        meshInfo.morphTargetNames = Object.keys(object.morphTargetDictionary);
        meshInfo.morphTargetCount = meshInfo.morphTargetNames.length;
        
        // Check for tongue morphs in this mesh
        const tongueMorphsInMesh = meshInfo.morphTargetNames.filter(name => 
          name.toLowerCase().includes('tongue')
        );
        
        if (tongueMorphsInMesh.length > 0) {
          console.log(`${indent}✅ Found ${tongueMorphsInMesh.length} tongue morphs in mesh: ${meshInfo.name}`);
          this.tongueMeshes.push(object);
          
          // Store the tongue morphs with their mesh reference
          tongueMorphsInMesh.forEach(morphName => {
            this.tongueMorphs[morphName] = {
              mesh: object,
              meshName: meshInfo.name,
              index: object.morphTargetDictionary[morphName]
            };
          });
        }
      }
      
      // Check for morph target influences (alternative access)
      if (object.morphTargetInfluences && object.morphTargetInfluences.length > 0) {
        console.log(`${indent}📝 Mesh has ${object.morphTargetInfluences.length} morph influences`);
        
        // Try to access geometry morphAttributes
        if (object.geometry && object.geometry.morphAttributes) {
          const morphAttribs = object.geometry.morphAttributes;
          console.log(`${indent}📝 Geometry has morphAttributes:`, Object.keys(morphAttribs));
          
          // Check for position morphs (most common)
          if (morphAttribs.position) {
            console.log(`${indent}📝 Found ${morphAttribs.position.length} position morphs`);
          }
        }
      }
      
      // Log mesh info if tongue-related or has morphs
      if (isTongueRelated || meshInfo.hasMorphTargets) {
        console.log(`${indent}Mesh Info:`, meshInfo);
      }
    }
    
    // Check for blend shape deformers (FBX-specific)
    if (object.userData) {
      // FBX stores additional data in userData
      if (object.userData.FBX_Deformer) {
        console.log(`${indent}🔧 Found FBX Deformer in userData`);
        this.debugInfo.push({
          name: object.name,
          deformer: object.userData.FBX_Deformer,
          depth: depth
        });
      }
      
      // Check for any tongue-related userData
      const userDataKeys = Object.keys(object.userData);
      const tongueUserData = userDataKeys.filter(key => 
        key.toLowerCase().includes('tongue')
      );
      
      if (tongueUserData.length > 0) {
        console.log(`${indent}📦 Found tongue-related userData:`, tongueUserData);
      }
    }
    
    // Recursively traverse children
    if (object.children && object.children.length > 0) {
      object.children.forEach(child => {
        this.deepTraverse(child, depth + 1);
      });
    }
  }

  /**
   * Check if an object is tongue-related
   * @param {THREE.Object3D} object - Object to check
   * @returns {boolean} - True if tongue-related
   */
  isTongueRelated(object) {
    if (!object) return false;
    
    // Check object name
    const name = (object.name || '').toLowerCase();
    const tongueKeywords = ['tongue', 'tng', 'tung'];
    
    return tongueKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Try alternative methods to access tongue morphs
   * @param {THREE.Object3D} model - The FBX model
   */
  tryAlternativeMethods(model) {
    console.log('🔧 Attempting alternative extraction methods...');
    
    // Method 1: Look for CC_Base_Tongue bone and its children
    const tongueBone = this.findBoneByName(model, 'CC_Base_Tongue');
    if (tongueBone) {
      console.log('✅ Found CC_Base_Tongue bone');
      this.analyzeBoneHierarchy(tongueBone);
    }
    
    // Method 2: Check all SkinnedMesh objects for tongue influences
    const skinnedMeshes = [];
    model.traverse((child) => {
      if (child.isSkinnedMesh) {
        skinnedMeshes.push(child);
      }
    });
    
    console.log(`📊 Found ${skinnedMeshes.length} skinned meshes to analyze`);
    
    skinnedMeshes.forEach((mesh, index) => {
      console.log(`\nAnalyzing SkinnedMesh ${index + 1}/${skinnedMeshes.length}: ${mesh.name || 'unnamed'}`);
      
      // Check if this mesh is influenced by tongue bones
      if (mesh.skeleton && mesh.skeleton.bones) {
        const tongueBones = mesh.skeleton.bones.filter(bone => 
          bone.name && bone.name.toLowerCase().includes('tongue')
        );
        
        if (tongueBones.length > 0) {
          console.log(`  ✅ This mesh is influenced by ${tongueBones.length} tongue bones`);
          console.log(`  Tongue bones:`, tongueBones.map(b => b.name));
          
          // This mesh might contain tongue morphs
          if (mesh.morphTargetDictionary) {
            const morphNames = Object.keys(mesh.morphTargetDictionary);
            console.log(`  📝 Mesh has ${morphNames.length} morph targets`);
            
            // Even if morph names don't include "tongue", they might still be tongue morphs
            // if the mesh is influenced by tongue bones
            this.analyzeMorphTargets(mesh, morphNames);
          }
        }
      }
    });
    
    // Method 3: Direct geometry analysis
    console.log('\n🔬 Attempting direct geometry analysis...');
    this.analyzeGeometries(model);
  }

  /**
   * Find a bone by name in the hierarchy
   * @param {THREE.Object3D} object - Root object
   * @param {string} boneName - Name to search for
   * @returns {THREE.Bone|null} - Found bone or null
   */
  findBoneByName(object, boneName) {
    let foundBone = null;
    
    object.traverse((child) => {
      if (child.isBone && child.name === boneName) {
        foundBone = child;
      }
    });
    
    return foundBone;
  }

  /**
   * Analyze bone hierarchy for attached meshes
   * @param {THREE.Bone} bone - Bone to analyze
   */
  analyzeBoneHierarchy(bone) {
    console.log('🦴 Analyzing bone hierarchy...');
    
    // Look for meshes attached to this bone
    bone.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        console.log(`  Found mesh attached to tongue bone: ${child.name || 'unnamed'}`);
        
        if (child.morphTargetDictionary) {
          const morphs = Object.keys(child.morphTargetDictionary);
          console.log(`    Has ${morphs.length} morph targets:`, morphs);
          
          // Add these to our collection
          morphs.forEach(morphName => {
            this.tongueMorphs[morphName] = {
              mesh: child,
              meshName: child.name || 'tongue_mesh',
              index: child.morphTargetDictionary[morphName],
              viaBone: true
            };
          });
        }
      }
    });
  }

  /**
   * Analyze morph targets in detail
   * @param {THREE.Mesh} mesh - Mesh to analyze
   * @param {string[]} morphNames - Morph target names
   */
  analyzeMorphTargets(mesh, morphNames) {
    console.log('  🔬 Detailed morph target analysis:');
    
    morphNames.forEach(morphName => {
      const index = mesh.morphTargetDictionary[morphName];
      
      // Check if we can access the actual morph data
      if (mesh.geometry && mesh.geometry.morphAttributes) {
        const morphAttribs = mesh.geometry.morphAttributes;
        
        if (morphAttribs.position && morphAttribs.position[index]) {
          const morphPositions = morphAttribs.position[index];
          console.log(`    ✅ ${morphName}: Accessible (${morphPositions.count} vertices)`);
          
          // Even if the name doesn't include "tongue", store it for potential use
          this.tongueMorphs[`potential_${morphName}`] = {
            mesh: mesh,
            meshName: mesh.name || 'unnamed',
            index: index,
            vertexCount: morphPositions.count,
            isPotential: true
          };
        } else {
          console.log(`    ❌ ${morphName}: Not accessible via geometry`);
        }
      }
    });
  }

  /**
   * Analyze all geometries in the model
   * @param {THREE.Object3D} model - Model to analyze
   */
  analyzeGeometries(model) {
    const geometries = new Map();
    
    model.traverse((child) => {
      if (child.geometry) {
        const geo = child.geometry;
        const geoId = geo.uuid;
        
        if (!geometries.has(geoId)) {
          geometries.set(geoId, {
            geometry: geo,
            meshes: [],
            hasMorphs: false,
            morphCount: 0
          });
        }
        
        const geoInfo = geometries.get(geoId);
        geoInfo.meshes.push(child.name || child.uuid);
        
        if (geo.morphAttributes && geo.morphAttributes.position) {
          geoInfo.hasMorphs = true;
          geoInfo.morphCount = geo.morphAttributes.position.length;
        }
      }
    });
    
    console.log(`📊 Found ${geometries.size} unique geometries`);
    
    geometries.forEach((info, id) => {
      if (info.hasMorphs) {
        console.log(`  Geometry ${id.substr(0, 8)}...`);
        console.log(`    Used by: ${info.meshes.join(', ')}`);
        console.log(`    Has ${info.morphCount} morph targets`);
      }
    });
  }

  /**
   * Attempt to activate a tongue morph
   * @param {string} morphName - Name of the morph to activate
   * @param {number} value - Value to set (0-1)
   * @returns {boolean} - Success status
   */
  activateTongueMorph(morphName, value) {
    const morphInfo = this.tongueMorphs[morphName];
    
    if (!morphInfo) {
      console.warn(`❌ Tongue morph "${morphName}" not found`);
      return false;
    }
    
    const { mesh, index } = morphInfo;
    
    if (mesh && mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences[index] = Math.max(0, Math.min(1, value));
      console.log(`✅ Activated tongue morph "${morphName}" to ${value}`);
      return true;
    }
    
    console.warn(`❌ Cannot activate tongue morph "${morphName}" - influences not accessible`);
    return false;
  }

  /**
   * Get activation function for all found tongue morphs
   * @returns {Object} - Map of morph names to activation functions
   */
  getTongueMorphActivators() {
    const activators = {};
    
    Object.keys(this.tongueMorphs).forEach(morphName => {
      activators[morphName] = (value) => this.activateTongueMorph(morphName, value);
    });
    
    return activators;
  }
}

/**
 * Convenience function to extract and use tongue morphs
 * @param {THREE.Object3D} fbxModel - Loaded FBX model
 * @returns {Object} - Extraction results and utilities
 */
export function extractTongueMorphs(fbxModel) {
  const extractor = new FBXTongueMorphExtractor();
  const results = extractor.findTongueMorphs(fbxModel);
  
  return {
    ...results,
    activators: extractor.getTongueMorphActivators(),
    activateMorph: (name, value) => extractor.activateTongueMorph(name, value),
    extractor: extractor
  };
}
