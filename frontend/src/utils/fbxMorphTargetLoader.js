import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

/**
 * OFFICIAL THREE.JS PATTERN: Simplified FBX loader following the official example
 * Based on: https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_fbx.html
 * 
 * CRITICAL FIXES APPLIED:
 * 1. Using correct FBXLoader import from three/examples/jsm
 * 2. Enhanced geometry validation and debugging
 * 3. Comprehensive material fixes for visibility
 * 4. Proper bounding box calculations
 */
export class FBXMorphTargetLoader {
  constructor() {
    this.loader = new FBXLoader();
    this.loadedModel = null;
    this.morphTargetMeshes = [];
    this.morphTargetNames = {};
  }

  /**
   * Load FBX following the official Three.js pattern with enhanced debugging
   * @param {string} url - FBX file URL
   * @returns {Promise<Object>} - Enhanced model object with morph target utilities
   */
  async loadActorCoreFBX(url) {
    try {
      console.log('🎭 Loading FBX using official Three.js pattern...');
      console.log('📦 FBX URL:', url);
      
      // Load the FBX file using the standard approach
      const fbxObject = await this.loader.loadAsync(url);
      console.log('✅ FBX loaded successfully');
      console.log('🔍 FBX Object type:', fbxObject.type);
      console.log('🔍 FBX children count:', fbxObject.children.length);

      // Process following official example pattern with enhanced debugging
      this.loadedModel = this.processModelWithEnhancedDebugging(fbxObject);
      
      console.log(`🎯 Found ${this.morphTargetMeshes.length} meshes with morph targets`);
      console.log('📝 Total morph targets:', Object.keys(this.morphTargetNames).length);

      return {
        model: this.loadedModel,
        morphTargetMeshes: this.morphTargetMeshes,
        morphTargetNames: this.morphTargetNames,
        setMorphTarget: this.setMorphTarget.bind(this),
        listMorphTargets: this.listMorphTargets.bind(this),
        getMorphTargetValue: this.getMorphTargetValue.bind(this),
        dispose: this.dispose.bind(this)
      };

    } catch (error) {
      console.error('❌ Failed to load FBX:', error);
      throw new Error(`FBX loading failed: ${error.message}`);
    }
  }

  /**
   * Process model with comprehensive debugging and fixes
   * @param {THREE.Object3D} fbxObject - Loaded FBX object
   * @returns {THREE.Object3D} - Processed model
   */
  processModelWithEnhancedDebugging(fbxObject) {
    console.log('🔧 ENHANCED DEBUGGING MODE - Analyzing FBX structure...');
    
    // Debug: Check if object has geometry
    let totalVertices = 0;
    let totalFaces = 0;
    let meshCount = 0;
    let skinnedMeshCount = 0;
    let materialCount = 0;
    const materials = new Set();
    
    fbxObject.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        console.log(`📊 Mesh found: "${child.name || child.uuid}"`);
        
        if (child.isSkinnedMesh) {
          skinnedMeshCount++;
          console.log('  - Type: SkinnedMesh');
        } else {
          console.log('  - Type: Regular Mesh');
        }
        
        // Analyze geometry
        if (child.geometry) {
          const geo = child.geometry;
          console.log(`  - Geometry type: ${geo.type}`);
          
          if (geo.attributes) {
            if (geo.attributes.position) {
              const vertCount = geo.attributes.position.count;
              totalVertices += vertCount;
              console.log(`  - Vertices: ${vertCount}`);
            }
            
            if (geo.index) {
              const faceCount = geo.index.count / 3;
              totalFaces += faceCount;
              console.log(`  - Faces: ${faceCount}`);
            }
          }
        }
        
        // Analyze material
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => {
            materials.add(mat);
            console.log(`  - Material: ${mat.name || mat.type}`);
            console.log(`    - Transparent: ${mat.transparent}`);
            console.log(`    - Opacity: ${mat.opacity}`);
            console.log(`    - Visible: ${mat.visible}`);
            console.log(`    - Side: ${mat.side}`);
          });
        }
        
        // Check visibility
        console.log(`  - Visible: ${child.visible}`);
        console.log(`  - Frustum Culled: ${child.frustumCulled}`);
      }
    });
    
    console.log('📈 GEOMETRY STATISTICS:');
    console.log(`  - Total Meshes: ${meshCount}`);
    console.log(`  - Skinned Meshes: ${skinnedMeshCount}`);
    console.log(`  - Total Vertices: ${totalVertices}`);
    console.log(`  - Total Faces: ${totalFaces}`);
    console.log(`  - Unique Materials: ${materials.size}`);
    
    // CRITICAL CHECK: Ensure we have actual geometry
    if (totalVertices === 0) {
      console.error('❌ WARNING: Model has NO VERTICES! Model will be invisible!');
    }
    
    // Calculate bounds with safety checks
    const box = new THREE.Box3();
    try {
      box.setFromObject(fbxObject);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      console.log('📐 Model bounds:');
      console.log('  - Center:', center.toArray());
      console.log('  - Size:', size.toArray());
      console.log('  - Min:', box.min.toArray());
      console.log('  - Max:', box.max.toArray());
      
      // Check if bounds are valid
      if (!isFinite(size.x) || !isFinite(size.y) || !isFinite(size.z)) {
        console.error('❌ Invalid bounds detected! Model may be corrupted.');
      }
      
      const maxDimension = Math.max(size.x, size.y, size.z);
      console.log('📏 Max dimension:', maxDimension);
      
      if (maxDimension > 0 && isFinite(maxDimension)) {
        // Adjust scale to fit in view
        const targetHeight = 100; // Target height in world units
        const scale = targetHeight / maxDimension;
        
        console.log('🔧 Applying scale:', scale);
        fbxObject.scale.setScalar(scale);
        
        // Center the model
        box.setFromObject(fbxObject);
        const newCenter = box.getCenter(new THREE.Vector3());
        fbxObject.position.sub(newCenter);
        fbxObject.position.y = 0; // Place on ground
        
        console.log('📍 Final position:', fbxObject.position.toArray());
      }
    } catch (boundsError) {
      console.error('❌ Failed to calculate bounds:', boundsError);
    }
    
    // Reset arrays
    this.morphTargetMeshes = [];
    this.morphTargetNames = {};
    
    // Apply comprehensive fixes and extract morph targets
    fbxObject.traverse((child) => {
      if (child.isMesh) {
        // Enable shadows (official pattern)
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Force visibility
        child.visible = true;
        child.frustumCulled = true; // Keep normal culling
        
        // Fix materials comprehensively
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat, idx) => {
            console.log(`🎨 Processing material [${idx}] for mesh: ${child.name || child.uuid}`);
            console.log(`  - Material type: ${mat.type}`);
            console.log(`  - Material name: ${mat.name}`);
            
            // Fix transparency issues - FBX often incorrectly sets transparent=true
            if (mat.transparent && mat.opacity === 1.0) {
              mat.transparent = false;
              console.log('  - Fixed incorrect transparency setting');
            }
            
            // Ensure material is visible
            mat.visible = true;
            
            // Check if material has a map (texture)
            if (mat.map) {
              console.log(`  - Texture found: ${mat.map.name || 'unnamed'}`);
              
              // Check if texture has image data
              if (!mat.map.image) {
                console.log('  - WARNING: Texture has no image data, attempting to load manually...');
                
                // Try to manually load texture based on material name and mesh name
                const textureLoader = new THREE.TextureLoader();
                let texturePath = null;
                
                // Map mesh names to texture folders
                const meshName = child.name ? child.name.toLowerCase() : '';
                let textureFolder = '00'; // Default to skin textures
                
                if (meshName.includes('body') || meshName.includes('game_body') || meshName.includes('tongue') || meshName.includes('teeth')) {
                  textureFolder = '00'; // Skin/body textures
                } else if (meshName.includes('shoes')) {
                  textureFolder = '01'; // Shoes textures
                } else if (meshName.includes('top')) {
                  textureFolder = '02'; // Top clothing textures
                } else if (meshName.includes('bottom')) {
                  textureFolder = '03'; // Bottom clothing textures
                } else if (meshName.includes('hair')) {
                  textureFolder = '04'; // Hair textures
                } else if (meshName.includes('eye')) {
                  textureFolder = '00'; // Eye textures (use skin folder)
                } else if (meshName.includes('character')) {
                  textureFolder = '00'; // Generic character textures
                }
                
                // Load the Diffuse texture for this mesh
                texturePath = `/assets/textures/party-f-0013/${textureFolder}/Diffuse.jpg`;
                console.log(`  - Attempting to load texture from: ${texturePath} for mesh: ${meshName}`);
                
                textureLoader.load(
                  texturePath,
                  (texture) => {
                    console.log(`  - Successfully loaded texture from: ${texturePath}`);
                    // CRITICAL: Proper sRGB encoding for color textures to prevent banding
                    texture.encoding = THREE.sRGBEncoding;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.generateMipmaps = true;
                    texture.anisotropy = 16; // Maximum anisotropic filtering for quality
                    mat.map = texture;
                    mat.needsUpdate = true;
                  },
                  undefined,
                  (error) => {
                    console.log(`  - Failed to load texture from ${texturePath}, using fallback color`);
                    mat.map = null;
                    mat.color = new THREE.Color(0.9, 0.8, 0.7); // Skin-like fallback
                    mat.needsUpdate = true;
                  }
                );
                
                // Also try to load normal map for better lighting
                const normalPath = `/assets/textures/party-f-0013/${textureFolder}/Normal.jpg`;
                textureLoader.load(
                  normalPath,
                  (texture) => {
                    console.log(`  - Successfully loaded normal map from: ${normalPath}`);
                    // Normal maps use linear encoding, not sRGB
                    texture.encoding = THREE.LinearEncoding;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.generateMipmaps = true;
                    texture.anisotropy = 16;
                    mat.normalMap = texture;
                    mat.normalScale = new THREE.Vector2(1, 1);
                    mat.needsUpdate = true;
                  },
                  undefined,
                  () => {
                    console.log(`  - No normal map found at ${normalPath}`);
                  }
                );
              } else {
                // Texture has image data, ensure proper encoding and filtering
                mat.map.encoding = THREE.sRGBEncoding;
                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                mat.map.magFilter = THREE.LinearFilter;
                mat.map.generateMipmaps = true;
                mat.map.anisotropy = 16;
              }
              
              if (mat.map) {
                mat.map.needsUpdate = true;
              }
            } else {
              console.log('  - No texture map found, applying default color');
              // If no texture, set a default color so we can see the model
              mat.color = new THREE.Color(0.9, 0.8, 0.7); // Skin-like color
            }
            
            // Fix common material issues and ensure high-quality rendering
            if (mat.isMeshPhongMaterial || mat.isMeshStandardMaterial || mat.isMeshBasicMaterial) {
              // Ensure material has a color even if texture loading fails
              if (!mat.color) {
                mat.color = new THREE.Color(0.9, 0.8, 0.7);
              }
              
              // Enable high-quality shading for all materials
              mat.dithering = true; // Enable dithering to reduce color banding
              mat.premultipliedAlpha = true; // Better alpha blending
              
              // Ensure proper lighting response for non-basic materials
              if (mat.isMeshPhongMaterial || mat.isMeshStandardMaterial) {
                if (!mat.emissive) {
                  mat.emissive = new THREE.Color(0x221111);
                }
                mat.emissiveIntensity = 0.1; // Subtle self-illumination
                
                // Set reasonable shininess for Phong materials
                if (mat.isMeshPhongMaterial) {
                  mat.shininess = mat.shininess || 60; // Higher for smoother highlights
                  mat.specular = mat.specular || new THREE.Color(0x222222);
                  mat.reflectivity = 0.5;
                  mat.combine = THREE.MultiplyOperation;
                }
                
                // Set reasonable roughness/metalness for Standard materials
                if (mat.isMeshStandardMaterial) {
                  mat.roughness = mat.roughness !== undefined ? mat.roughness : 0.5;
                  mat.metalness = mat.metalness !== undefined ? mat.metalness : 0.0;
                  // Enable environment mapping for better realism
                  mat.envMapIntensity = 1.0;
                }
              }
              
              // For MeshBasicMaterial, it doesn't respond to lights, so ensure it has color
              if (mat.isMeshBasicMaterial) {
                mat.color = mat.color || new THREE.Color(0.9, 0.8, 0.7);
                // Convert to MeshPhongMaterial for better shading if possible
                const upgradedMat = new THREE.MeshPhongMaterial({
                  color: mat.color,
                  map: mat.map,
                  transparent: mat.transparent,
                  opacity: mat.opacity,
                  side: mat.side,
                  dithering: true,
                  shininess: 60,
                  specular: new THREE.Color(0x111111)
                });
                // Replace the basic material with Phong material
                materials[idx] = upgradedMat;
                if (Array.isArray(child.material)) {
                  child.material[idx] = upgradedMat;
                } else {
                  child.material = upgradedMat;
                }
                mat = upgradedMat;
                console.log('  - Upgraded MeshBasicMaterial to MeshPhongMaterial for better shading');
              }
            }
            
            // Ensure double-sided rendering for debugging
            mat.side = THREE.DoubleSide;
            
            // Force material to update
            mat.needsUpdate = true;
            
            console.log(`  - Final settings: visible=${mat.visible}, transparent=${mat.transparent}, opacity=${mat.opacity}`);
          });
        }
        
        // Check for morph targets (official pattern)
        if (child.morphTargetDictionary) {
          console.log(`🎭 Found mesh "${child.name || child.uuid}" with morph targets`);
          
          this.morphTargetMeshes.push(child);
          
          // Extract morph target names
          Object.keys(child.morphTargetDictionary).forEach((key) => {
            const index = child.morphTargetDictionary[key];
            this.morphTargetNames[key] = { 
              mesh: child.name || child.uuid, 
              index: index,
              meshObject: child
            };
          });
        }
      }
    });
    
    // Add debug helpers
    console.log('🔍 Adding debug helpers to model...');
    
    // Add bounding box helper
    const boxHelper = new THREE.BoxHelper(fbxObject, 0x00ff00);
    fbxObject.add(boxHelper);
    console.log('✅ Added green bounding box helper');
    
    // Add axes helper at model origin
    const axesHelper = new THREE.AxesHelper(50);
    fbxObject.add(axesHelper);
    console.log('✅ Added axes helper (R=X, G=Y, B=Z)');
    
    console.log('🎉 Model processing complete with enhanced debugging');
    
    return fbxObject;
  }

  /**
   * Set morph target value by name (official pattern)
   * @param {string} morphTargetName - Name of the morph target
   * @param {number} value - Value between 0 and 1
   */
  setMorphTarget(morphTargetName, value) {
    const target = this.morphTargetNames[morphTargetName];
    if (!target) {
      console.warn(`⚠️ Morph target "${morphTargetName}" not found`);
      return false;
    }

    // Use the direct mesh reference if available (more efficient)
    if (target.meshObject && target.meshObject.morphTargetInfluences) {
      target.meshObject.morphTargetInfluences[target.index] = Math.max(0, Math.min(1, value));
      return true;
    }

    // Fallback to finding by mesh name
    const mesh = this.morphTargetMeshes.find(m => (m.name || m.uuid) === target.mesh);
    if (mesh && mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences[target.index] = Math.max(0, Math.min(1, value));
      return true;
    }

    return false;
  }

  /**
   * Get current morph target value
   * @param {string} morphTargetName - Name of the morph target
   * @returns {number|null} - Current value or null if not found
   */
  getMorphTargetValue(morphTargetName) {
    const target = this.morphTargetNames[morphTargetName];
    if (!target) return null;

    // Use the direct mesh reference if available
    if (target.meshObject && target.meshObject.morphTargetInfluences) {
      return target.meshObject.morphTargetInfluences[target.index] || 0;
    }

    // Fallback to finding by mesh name
    const mesh = this.morphTargetMeshes.find(m => (m.name || m.uuid) === target.mesh);
    if (mesh && mesh.morphTargetInfluences) {
      return mesh.morphTargetInfluences[target.index] || 0;
    }

    return null;
  }

  /**
   * List all available morph targets
   * @returns {Array} - Array of morph target info objects
   */
  listMorphTargets() {
    if (!this.morphTargetNames || typeof this.morphTargetNames !== 'object') {
      return [];
    }

    try {
      return Object.entries(this.morphTargetNames).map(([name, info]) => ({
        name,
        mesh: info?.mesh || 'unknown',
        index: info?.index || 0,
        currentValue: this.getMorphTargetValue(name) || 0
      }));
    } catch (error) {
      console.error('❌ Error listing morph targets:', error);
      return [];
    }
  }

  /**
   * Dispose resources properly (following official pattern)
   */
  dispose() {
    if (this.loadedModel) {
      this.loadedModel.traverse((child) => {
        if (child.isSkinnedMesh) {
          child.skeleton.dispose();
        }
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
        if (child.geometry) child.geometry.dispose();
      });
    }
  }
}

/**
 * Create FBX viewer following EXACT official Three.js pattern
 * Based on: https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_fbx.html
 */
export async function createActorCoreFBXViewer(url) {
  console.log('🔧 Creating FBX viewer using EXACT official Three.js pattern...');
  
  // EXACT scene setup from official example
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);
  
  // EXACT camera setup from official example
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(100, 200, 300);
  
  // Enhanced lighting setup for high-quality rendering without banding
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 1.5);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left = -120;
  dirLight.shadow.camera.right = 120;
  // Higher quality shadows
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.normalBias = 0.05;
  scene.add(dirLight);
  
  // Add soft ambient light for smooth gradients
  const ambientLight = new THREE.AmbientLight(0x606060, 1.2); // Softer ambient
  scene.add(ambientLight);
  
  // Add a fill light from the side for better skin tones
  const fillLight = new THREE.DirectionalLight(0xffd4a3, 0.8); // Warm fill light
  fillLight.position.set(-100, 100, 50);
  scene.add(fillLight);
  
  // Add a rim light for better definition
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
  rimLight.position.set(50, 50, -100);
  scene.add(rimLight);
  
  console.log('💡 Enhanced lighting setup complete');

  // EXACT ground setup from official example
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000), 
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);

  // Load FBX with enhanced debugging
  const loader = new FBXMorphTargetLoader();
  const result = await loader.loadActorCoreFBX(url);
  
  // Add model to scene
  scene.add(result.model);
  
  console.log('✅ FBX viewer setup complete with enhanced debugging');
  
  return {
    scene,
    camera,
    model: result.model,
    morphTargetMeshes: result.morphTargetMeshes,
    morphTargetNames: result.morphTargetNames,
    setMorphTarget: result.setMorphTarget,
    listMorphTargets: result.listMorphTargets,
    getMorphTargetValue: result.getMorphTargetValue,
    dispose: result.dispose
  };
}
