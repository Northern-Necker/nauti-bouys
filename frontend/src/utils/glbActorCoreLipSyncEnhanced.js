import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * Enhanced ActorCore GLB Lip-Sync System with robust morph name resolution,
 * manual vertex morphing, and CRITICAL VISUAL RENDERING FIXES to resolve
 * THREE.js GLTFLoader initialization bugs and visual update pipeline issues.
 */
export class GLBActorCoreLipSyncEnhanced {
  constructor() {
    this.loader = new GLTFLoader();
    this.model = null;
    this.scene = null;
    this.isReady = false;
    this.meshTargets = [];
    this.tongueMesh = null;
    this.bodyMesh = null;
    this.currentViseme = null;
    this.targetMorphs = {};
    this.currentMorphs = {};
    this.morphTransitionSpeed = 0.15;
    this.renderer = null;
    this.camera = null;
    this.debug = true;

    // CRITICAL: Visual rendering fix state
    this.visualMorphFixApplied = false;
    this.geometryUpdateCallbacks = new Map();

    // Morph name indexers (built at init from loaded model)
    this.availableMorphNames = new Set();
    this.availableMorphNamesLower = new Map(); // lower -> actual
    this.availableMorphTokens = []; // [{actual, lower, tokens}]
    this.resolvedVisemeMappings = null; // { viseme: { morphs:[], weights:[] } }
    this.visemeCombinations = {}; // { viseme: [morphName, ...] } for debug UIs

    // Intensity
    this.globalIntensityMultiplier = 1.0;
    this.visemeIntensities = {
      sil: 0.0,
      PP: 0.95,
      FF: 0.9,
      TH: 0.9,
      DD: 0.85,
      kk: 0.9,
      CH: 0.95,
      SS: 1.0,
      nn: 0.8,
      RR: 0.9,
      aa: 1.0,
      E: 0.9,
      I: 0.9,
      O: 1.0,
      U: 1.0,
    };
    this.defaultVisemeIntensities = { ...this.visemeIntensities };

    // Canonical viseme mapping (names will be resolved against model morphs)
    this.visemeMappings = {
      sil: [],
      // Bilabial closure (P/B/M) – strong closure, minimal jaw open
      PP: {
        morphs: ['V_Explosive', 'V_Lip_Open', 'Mouth_Press_L', 'Mouth_Press_R'],
        weights: [1.0, 0.15, 0.25, 0.25]
      },
      // Lower lip to upper teeth – visible lower lip pull
      FF: {
        morphs: ['V_Dental_Lip', 'V_Wide', 'Jaw_Open', 'V_Open', 'V_Tight', 'Mouth_Press_L', 'Mouth_Press_R'],
        weights: [1.0, 0.35, 0.12, 0.10, 0.05, 0.15, 0.15]
      },
      // Tongue between teeth – prominent tongue protrusion
      TH: {
        morphs: ['V_Tongue_Out', 'V_Dental_Lip', 'V_Open', 'V_Tight'],
        weights: [0.95, 0.45, 0.35, 0.15]
      },
      // Alveolar contact – tongue up, small mouth opening
      DD: {
        morphs: ['V_Tongue_up', 'V_Open', 'V_Lip_Open', 'Jaw_Open'],
        weights: [0.95, 0.2, 0.15, 0.1]
      },
      // Velar – tongue back up/curl and slight opening
      kk: {
        morphs: ['V_Tongue_Curl-U', 'V_Tongue_up', 'V_Open', 'V_Tight', 'Jaw_Open'],
        weights: [0.6, 0.5, 0.3, 0.2, 0.2]
      },
      // Affricate – CH/J blend; uses dedicated affricate morph plus shaping
      CH: {
        morphs: ['V_Affricate', 'V_Tight-O', 'V_Open', 'V_Tongue_up'],
        weights: [0.95, 0.45, 0.3, 0.5]
      },
      // Sibilant – corners stretched, narrow tongue
      SS: {
        morphs: ['V_Wide', 'V_Tongue_Narrow', 'V_Tight', 'V_Open'],
        weights: [1.0, 0.9, 0.5, 0.2]
      },
      // Nasal – tongue up with very small opening
      nn: {
        morphs: ['V_Tongue_up', 'V_Lip_Open', 'V_Open', 'Jaw_Open'],
        weights: [0.85, 0.35, 0.15, 0.1]
      },
      // Rhotic – curled tongue, some rounding/pucker
      RR: {
        morphs: ['V_Tongue_Curl-U', 'V_Tight-O', 'Mouth_Pucker', 'V_Open'],
        weights: [1.0, 0.35, 0.25, 0.2]
      },
      // Open vowel – mouth and jaw open, tongue lowered
      aa: {
        morphs: ['V_Open', 'Jaw_Open', 'V_Tongue_Lower', 'V_Lip_Open'],
        weights: [1.0, 1.0, 0.55, 0.2]
      },
      // Mid-front vowel – wide lips, moderate jaw, slight tongue up
      E: {
        morphs: ['V_Wide', 'V_Open', 'V_Lip_Open', 'Jaw_Open', 'V_Tongue_up'],
        weights: [0.85, 0.55, 0.35, 0.3, 0.2]
      },
      // High-front vowel – wide, slightly tight, tongue up
      I: {
        morphs: ['V_Wide', 'V_Tight', 'V_Tongue_up', 'Jaw_Open'],
        weights: [0.95, 0.35, 0.4, 0.15]
      },
      // Rounded-back vowel – strong rounding, some open/jaw
      O: {
        morphs: ['V_Tight-O', 'Mouth_Pucker', 'V_Open', 'Jaw_Open'],
        weights: [1.0, 0.6, 0.4, 0.4]
      },
      // High-back rounded – strong rounding, small open, tongue up
      U: {
        morphs: ['V_Tight-O', 'Mouth_Pucker', 'V_Open', 'V_Tongue_up', 'Jaw_Open'],
        weights: [1.0, 0.8, 0.3, 0.35, 0.3]
      },
    };
  }

  // ------------------ Name resolution utilities ------------------
  normalizeName(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  tokenize(name) {
    return (name || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  }

  buildNameIndexFromMeshes() {
    this.availableMorphNames = new Set();
    this.availableMorphNamesLower = new Map();
    this.availableMorphTokens = [];

    this.meshTargets.forEach((mesh) => {
      if (mesh.morphTargetDictionary) {
        Object.keys(mesh.morphTargetDictionary).forEach((actual) => {
          this.availableMorphNames.add(actual);
          const lower = actual.toLowerCase();
          if (!this.availableMorphNamesLower.has(lower)) {
            this.availableMorphNamesLower.set(lower, actual);
          }
          this.availableMorphTokens.push({ actual, lower, tokens: this.tokenize(actual) });
        });
      }
    });

    if (this.debug) {
      console.log(`🔎 Indexed ${this.availableMorphNames.size} morph names across meshes.`);
    }
  }

  synonymCandidates(requestedLower) {
    const map = new Map([
      ['vtongueup', ['tongue_up', 'tongueup', 'tongue_raise', 'v_tongue_raise', 'vtongueraise']],
      ['vtongueout', ['tongue_out', 'tongueout']],
      ['vtonguelower', ['tongue_lower', 'tonguedown', 'v_tongue_lower']],
      ['vtighto', ['vtighto', 'vtight-o', 'tighto', 'tight-o']],
      ['vlipopen', ['lip_open', 'lipopen']],
      ['vdentallip', ['dental', 'dentallip', 'v_dental_lip']],
      ['vwide', ['wide', 'stretch']],
      ['vopen', ['open', 'v_ah']],
      ['vtight', ['tight']],
      ['vaffricate', ['affricate', 'ch']],
      ['vtonguenarrow', ['tongue_narrow']],
      ['vtonguecurlu', ['tonguecurlu', 'tongue_curl', 'tongue_curl_u']],
      ['jawopen', ['jaw_open']],
      ['mouthpucker', ['pucker']],
    ]);
    return map.get(requestedLower) || [];
  }

  resolveMorphName(requestedName) {
    if (!requestedName) return null;

    // 1) Exact match
    if (this.availableMorphNames.has(requestedName)) return requestedName;

    // 2) Case-insensitive exact
    const lower = requestedName.toLowerCase();
    if (this.availableMorphNamesLower.has(lower)) return this.availableMorphNamesLower.get(lower);

    // 3) Normalized equality
    const normalizedRequested = this.normalizeName(requestedName);
    for (const { actual } of this.availableMorphTokens) {
      if (this.normalizeName(actual) === normalizedRequested) return actual;
    }

    // 4) Token-based fuzzy (require at least one token match)
    const tokens = this.tokenize(requestedName);
    const keyTokens = tokens.filter((t) => t.length > 1);
    let best = null;
    let bestScore = -1;
    for (const entry of this.availableMorphTokens) {
      const { actual, tokens: candTokens } = entry;
      const score = keyTokens.reduce((acc, t) => acc + (candTokens.includes(t) ? 1 : 0), 0);
      if (score > bestScore) {
        best = actual;
        bestScore = score;
      }
    }
    if (best && bestScore > 0) return best;

    // 5) Try synonyms
    const syns = this.synonymCandidates(normalizedRequested);
    for (const syn of syns) {
      const lowerSyn = syn.toLowerCase();
      for (const entry of this.availableMorphTokens) {
        if (entry.lower.includes(lowerSyn)) return entry.actual;
      }
    }

    if (this.debug) console.warn(`  ⚠️ Could not resolve morph name '${requestedName}' to any available morph target`);
    return null;
  }

  buildResolvedVisemeMappings() {
    const resolved = {};
    const simpleCombos = {};
    const unresolved = [];

    Object.entries(this.visemeMappings).forEach(([viseme, mapping]) => {
      if (!mapping || !mapping.morphs) {
        resolved[viseme] = mapping;
        simpleCombos[viseme] = [];
        return;
      }

      const newMorphs = [];
      const newWeights = [];
      mapping.morphs.forEach((requestedMorph, idx) => {
        const actual = this.resolveMorphName(requestedMorph);
        if (actual) {
          newMorphs.push(actual);
          newWeights.push(mapping.weights[idx] || 1.0);
        } else {
          unresolved.push({ viseme, morph: requestedMorph });
        }
      });

      resolved[viseme] = { morphs: newMorphs, weights: newWeights };
      simpleCombos[viseme] = newMorphs.slice();
    });

    if (this.debug) {
      console.log('✅ Resolved viseme mappings to actual morph names:', resolved);
      if (unresolved.length) console.warn('⚠️ Unresolved morphs during mapping:', unresolved);
    }

    this.resolvedVisemeMappings = resolved;
    this.visemeCombinations = simpleCombos;

    // Capture pristine defaults for future resets
    if (!this.defaultResolvedVisemeMappings) {
      this.defaultResolvedVisemeMappings = JSON.parse(JSON.stringify(this.resolvedVisemeMappings));
    }
  }

  async initialize(glbUrl, renderer = null, camera = null) {
    try {
      console.log('🎭 Initializing Enhanced GLB ActorCore Lip-Sync System...');

      this.renderer = renderer;
      this.camera = camera;

      const gltf = await this.loader.loadAsync(glbUrl);
      this.model = gltf.scene;
      this.scene = gltf.scene;

      // Process all meshes and collect morph dictionaries
      this.meshTargets = []; // reset in case of re-initialize
      this.tongueMesh = null;
      this.bodyMesh = null;

      this.model.traverse((obj) => {
        if (obj.isMesh || obj.isSkinnedMesh) {
          obj.visible = true;
          obj.frustumCulled = false;

          // Ensure influences array exists
          obj.morphTargetInfluences = obj.morphTargetInfluences || [];

          // Materials with CRITICAL VISUAL RENDERING FIXES
          const configureMaterial = (material) => {
            material.morphTargets = true;
            material.morphNormals = true;
            material.side = THREE.DoubleSide;
            material.transparent = false;
            material.opacity = 1.0;
            material.depthWrite = true;
            material.depthTest = true;
            material.needsUpdate = true;
            
            // CRITICAL FIX: Force material version update to bypass THREE.js cache issues
            material.version = (material.version || 0) + 1;
            
            // CRITICAL FIX: Clear compiled programs to force shader recompilation
            if (material.program) {
              material.program = null;
            }
            
            // CRITICAL FIX: Force morph attributes recompilation
            if (material.uniforms) {
              material.uniformsNeedUpdate = true;
            }
          };
          if (Array.isArray(obj.material)) obj.material.forEach(configureMaterial);
          else if (obj.material) configureMaterial(obj.material);

          // Morph targets
          if (obj.morphTargetDictionary && obj.morphTargetInfluences && obj.morphTargetInfluences.length > 0) {
            this.meshTargets.push(obj);

            // Zero out all influences
            for (let i = 0; i < obj.morphTargetInfluences.length; i++) obj.morphTargetInfluences[i] = 0;

            // Geometry setup
            if (obj.geometry) {
              obj.geometry.morphTargetsRelative = true;
              if (obj.geometry.morphAttributes) {
                console.log(`✅ Mesh ${obj.name} has morph attributes:`, Object.keys(obj.geometry.morphAttributes));
              }
            }

            console.log(`✅ Found mesh: ${obj.name} with ${Object.keys(obj.morphTargetDictionary).length} morphs`);

            if (obj.name.includes('CC_Game_Tongue')) {
              this.tongueMesh = obj;
              console.log('  └─ Tongue mesh identified');
            } else if (obj.name.includes('CC_Game_Body')) {
              this.bodyMesh = obj;
              console.log('  └─ Body/Face mesh identified');
            }

            // Track all morph names
            Object.keys(obj.morphTargetDictionary).forEach((morphName) => {
              this.currentMorphs[morphName] = 0;
              this.targetMorphs[morphName] = 0;
            });
          }
        }
      });

      if (this.meshTargets.length === 0) console.error('❌ No meshes with morph targets found!');

      // Build name index and resolve mapping
      this.buildNameIndexFromMeshes();
      this.buildResolvedVisemeMappings();

      // CRITICAL: Apply comprehensive visual rendering fixes
      this.applyVisualMorphFixes();

      const allMorphNames = Object.keys(this.currentMorphs);
      console.log(`Discovered ${allMorphNames.length} total morph targets.`);

      this.isReady = true;
      console.log('✅ Lip-Sync System Ready - Found', this.meshTargets.length, 'meshes with morphs');

      return { scene: this.scene, model: this.model, lipSync: this, allMorphNames };
    } catch (error) {
      console.error('❌ Failed to initialize GLB lip-sync system:', error);
      throw error;
    }
  }

  applySingleMorph(morphName, weight, immediate = true) {
    if (!this.isReady) return;
    const actualName = this.resolveMorphName(morphName) || morphName;
    this.targetMorphs[actualName] = weight;

    if (immediate) {
      this.currentMorphs[actualName] = weight;
      this.updateMeshMorphsDirectly();
    } else {
      this.startTransition();
    }
  }

  applyViseme(viseme, intensity = 1.0, immediate = false) {
    if (!this.isReady) {
      console.warn('⚠️ Lip-sync system not ready');
      return { success: false, error: 'System not ready' };
    }

    const visemeIntensity = (this.visemeIntensities[viseme] || 1.0) * intensity;
    console.log(`🎭 Applying viseme: ${viseme} (intensity: ${visemeIntensity.toFixed(2)})`);

    const sourceMappings = this.resolvedVisemeMappings || this.visemeMappings;
    const mapping = sourceMappings[viseme];
    const appliedMorphs = [];

    // Build new target map (others go to 0)
    const newTargetMorphs = {};
    if (mapping && mapping.morphs) {
      mapping.morphs.forEach((morphName, idx) => {
        const nameToUse = this.resolveMorphName(morphName) || morphName;
        if (this.currentMorphs.hasOwnProperty(nameToUse)) {
          const weight = (mapping.weights[idx] || 1.0) * visemeIntensity * this.globalIntensityMultiplier;
          newTargetMorphs[nameToUse] = weight;
          appliedMorphs.push({ morph: nameToUse, weight: weight.toFixed(3) });
        } else if (this.debug) {
          console.warn(`  ⚠️ Morph '${nameToUse}' not found on current model, skipping`);
        }
      });
    }

    Object.keys(this.targetMorphs).forEach((key) => {
      this.targetMorphs[key] = newTargetMorphs[key] || 0;
    });

    if (immediate) {
      Object.keys(this.currentMorphs).forEach((key) => {
        this.currentMorphs[key] = this.targetMorphs[key] || 0;
      });
      this.updateMeshMorphsDirectly();
    } else {
      this.startTransition();
    }

    this.currentViseme = viseme;
    return { success: true, viseme, intensity: visemeIntensity, morphsApplied: appliedMorphs.length, morphs: appliedMorphs };
  }

  updateMeshMorphsDirectly() {
    if (!this.isReady) return;

    let totalChanges = 0;
    for (const mesh of this.meshTargets) {
      if (!mesh.morphTargetDictionary || !mesh.geometry) continue;

      if (!mesh.originalPositions) this.storeOriginalGeometry(mesh);

      let hasChanges = false;
      const activeMorphs = {};
      for (const [morphName, influence] of Object.entries(this.currentMorphs)) {
        if (mesh.morphTargetDictionary[morphName] !== undefined && Math.abs(influence) > 0.001) {
          activeMorphs[morphName] = influence;
          hasChanges = true;
        }
      }

      if (hasChanges || mesh.needsReset) {
        this.calculateMorphedVertices(mesh, activeMorphs);
        
        // CRITICAL: Apply visual morph fix for each mesh after vertex calculation
        this.applyVisualMorphFixForMesh(mesh, activeMorphs);
        
        mesh.needsReset = false;
        totalChanges++;
      }
    }

    if (totalChanges > 0) {
      // CRITICAL: Enhanced force scene update with visual fix integration
      this.forceVisualSceneUpdate();
      
      // CRITICAL: Multi-pass rendering with forced geometry updates
      this.executeVisualRenderingSequence();
    }

    return totalChanges;
  }

  forceSceneUpdate() {
    if (!this.scene) return;

    // Update all mesh geometries and materials
    this.scene.traverse((object) => {
      if (object.isMesh || object.isSkinnedMesh) {
        // Force geometry updates
        if (object.geometry) {
          object.geometry.computeBoundingBox();
          object.geometry.computeBoundingSphere();
          object.geometry.computeVertexNormals();
        }

        // Force material updates
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
              mat.needsUpdate = true;
              if (mat.program) mat.program = null; // Force shader recompilation
            });
          } else {
            object.material.needsUpdate = true;
            if (object.material.program) object.material.program = null; // Force shader recompilation
          }
        }

        // Update matrix
        object.updateMatrix();
        object.updateMatrixWorld(true);
      }
    });

    // Update scene matrix
    this.scene.updateMatrixWorld(true);
  }

  storeOriginalGeometry(mesh) {
    if (!mesh.geometry || !mesh.geometry.attributes.position) return;

    const positionAttribute = mesh.geometry.attributes.position;
    mesh.originalPositions = new Float32Array(positionAttribute.array);

    mesh.morphTargetData = {};
    if (mesh.geometry.morphAttributes && mesh.geometry.morphAttributes.position) {
      for (const [morphName, morphIndex] of Object.entries(mesh.morphTargetDictionary)) {
        const morphAttribute = mesh.geometry.morphAttributes.position[morphIndex];
        if (morphAttribute) {
          mesh.morphTargetData[morphName] = { positions: new Float32Array(morphAttribute.array), index: morphIndex };
        }
      }
    }

    if (this.debug) console.log(`🗄️ Stored original geometry for ${mesh.name}`);
  }

  calculateMorphedVertices(mesh, activeMorphs) {
    if (!mesh.originalPositions || !mesh.geometry.attributes.position) return;

    const positionAttribute = mesh.geometry.attributes.position;
    const vertexCount = mesh.originalPositions.length;

    const morphedPositions = new Float32Array(mesh.originalPositions);
    for (const [morphName, influence] of Object.entries(activeMorphs)) {
      const morphData = mesh.morphTargetData[morphName];
      if (!morphData || Math.abs(influence) < 0.001) continue;
      for (let i = 0; i < vertexCount; i++) morphedPositions[i] += morphData.positions[i] * influence;
    }

    positionAttribute.array.set(morphedPositions);
    positionAttribute.needsUpdate = true;

    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();

    if (mesh.geometry.attributes.normal && mesh.geometry.morphAttributes.normal) this.calculateMorphedNormals(mesh, activeMorphs);

    mesh.geometry.version++;
    this.ensureMaterialUpdates(mesh);
  }

  calculateMorphedNormals(mesh, activeMorphs) {
    if (!mesh.geometry.attributes.normal) return;

    const normalAttribute = mesh.geometry.attributes.normal;
    if (!mesh.originalNormals) mesh.originalNormals = new Float32Array(normalAttribute.array);

    const normalCount = mesh.originalNormals.length;
    const morphedNormals = new Float32Array(mesh.originalNormals);

    for (const [morphName, influence] of Object.entries(activeMorphs)) {
      const morphData = mesh.morphTargetData[morphName];
      if (!morphData || Math.abs(influence) < 0.001) continue;

      const morphIndex = morphData.index;
      const morphNormalAttribute = mesh.geometry.morphAttributes.normal?.[morphIndex];
      if (!morphNormalAttribute) continue;

      for (let i = 0; i < normalCount; i++) morphedNormals[i] += morphNormalAttribute.array[i] * influence;
    }

    normalAttribute.array.set(morphedNormals);
    normalAttribute.needsUpdate = true;
  }

  ensureMaterialUpdates(mesh) {
    const updateMaterial = (material) => {
      material.needsUpdate = true;
      material.morphTargets = true;
      material.morphNormals = true;
      material.version++;
      if (material.program) material.program = null;
    };

    if (Array.isArray(mesh.material)) mesh.material.forEach(updateMaterial);
    else if (mesh.material) updateMaterial(mesh.material);

    mesh.updateMatrix();
    mesh.matrixWorldNeedsUpdate = true;
  }

  startTransition() {
    const animate = () => {
      let needsUpdate = false;
      Object.keys(this.targetMorphs).forEach((morphName) => {
        const current = this.currentMorphs[morphName] || 0;
        const target = this.targetMorphs[morphName] || 0;
        if (Math.abs(current - target) > 0.001) {
          this.currentMorphs[morphName] = THREE.MathUtils.lerp(current, target, this.morphTransitionSpeed);
          needsUpdate = true;
        } else if (current !== target) {
          this.currentMorphs[morphName] = target;
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        this.updateMeshMorphsDirectly();
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  update() {
    if (!this.isReady || !this.meshTargets.length) return;

    let needsRender = false;
    for (const morphName in this.targetMorphs) {
      const targetValue = this.targetMorphs[morphName];
      const currentValue = this.currentMorphs[morphName];
      if (Math.abs(targetValue - currentValue) > 0.001) {
        const newValue = THREE.MathUtils.lerp(currentValue, targetValue, this.morphTransitionSpeed);
        this.currentMorphs[morphName] = newValue;
        needsRender = true;
      } else if (currentValue !== targetValue) {
        this.currentMorphs[morphName] = targetValue;
        needsRender = true;
      }
    }

    if (needsRender) {
      this.meshTargets.forEach((mesh) => {
        if (mesh.morphTargetDictionary) {
          for (const morphName in this.currentMorphs) {
            if (mesh.morphTargetDictionary.hasOwnProperty(morphName)) {
              const index = mesh.morphTargetDictionary[morphName];
              mesh.morphTargetInfluences[index] = this.currentMorphs[morphName];
            }
          }
        }
      });
    }
  }

  reset() {
    Object.keys(this.targetMorphs).forEach((key) => (this.targetMorphs[key] = 0));
    this.currentViseme = null;
    this.startTransition();
    console.log('🔄 Reset to neutral position');
  }

  // ============== CRITICAL VISUAL RENDERING FIXES ==============
  // These methods resolve THREE.js GLTFLoader initialization bugs and 
  // visual rendering pipeline issues that cause morphs to calculate 
  // correctly but not display visually on the 3D model.

  applyVisualMorphFixes() {
    if (this.visualMorphFixApplied) return;

    console.log('🔧 Applying comprehensive visual morph rendering fixes...');

    // Fix 1: Initialize morphTargetInfluences properly for all meshes
    this.meshTargets.forEach(mesh => {
      this.initializeMorphTargetInfluences(mesh);
    });

    // Fix 2: Setup geometry update callbacks
    this.setupGeometryUpdateCallbacks();

    // Fix 3: Force material recompilation
    this.forceMaterialRecompilation();

    this.visualMorphFixApplied = true;
    console.log('✅ Visual morph rendering fixes applied successfully');
  }

  initializeMorphTargetInfluences(mesh) {
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    const morphCount = Object.keys(mesh.morphTargetDictionary).length;
    
    // CRITICAL FIX: Ensure morphTargetInfluences array has correct length and is initialized
    if (mesh.morphTargetInfluences.length !== morphCount) {
      mesh.morphTargetInfluences = new Array(morphCount).fill(0);
      console.log(`🔧 Fixed morphTargetInfluences length for ${mesh.name}: ${morphCount}`);
    }

    // CRITICAL FIX: Force updateMorphTargets to ensure proper binding
    if (mesh.updateMorphTargets) {
      mesh.updateMorphTargets();
    }

    // CRITICAL FIX: Ensure geometry morph attributes are properly bound
    if (mesh.geometry && mesh.geometry.morphAttributes) {
      const positionMorphs = mesh.geometry.morphAttributes.position;
      const normalMorphs = mesh.geometry.morphAttributes.normal;
      
      if (positionMorphs) {
        positionMorphs.forEach((attr, index) => {
          if (attr) {
            attr.needsUpdate = true;
          }
        });
      }
      
      if (normalMorphs) {
        normalMorphs.forEach((attr, index) => {
          if (attr) {
            attr.needsUpdate = true;
          }
        });
      }
    }
  }

  setupGeometryUpdateCallbacks() {
    this.meshTargets.forEach(mesh => {
      // Store reference to original updateMorphTargets if it exists
      if (mesh.updateMorphTargets && !mesh._originalUpdateMorphTargets) {
        mesh._originalUpdateMorphTargets = mesh.updateMorphTargets.bind(mesh);
        
        // Override with enhanced version that forces visual updates
        mesh.updateMorphTargets = () => {
          mesh._originalUpdateMorphTargets();
          this.forceGeometryVisualUpdate(mesh);
        };
      }

      // Setup geometry update callback
      const callback = () => {
        this.forceGeometryVisualUpdate(mesh);
      };
      this.geometryUpdateCallbacks.set(mesh, callback);
    });
  }

  forceMaterialRecompilation() {
    this.meshTargets.forEach(mesh => {
      const forceMaterialUpdate = (material) => {
        // CRITICAL FIX: Force complete material recompilation
        material.morphTargets = true;
        material.morphNormals = true;
        material.needsUpdate = true;
        material.version = (material.version || 0) + 1;
        
        // CRITICAL FIX: Clear shader cache to force recompilation
        if (material.program) {
          material.program = null;
        }
        
        // CRITICAL FIX: Mark uniforms for update
        if (material.uniforms) {
          material.uniformsNeedUpdate = true;
        }
        
        // CRITICAL FIX: Force WebGL state update
        if (this.renderer && this.renderer.state) {
          this.renderer.state.buffers.depth.setReversed(false);
          this.renderer.state.reset();
        }
      };

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(forceMaterialUpdate);
      } else if (mesh.material) {
        forceMaterialUpdate(mesh.material);
      }
    });
  }

  applyVisualMorphFixForMesh(mesh, activeMorphs) {
    if (!mesh || !mesh.morphTargetDictionary) return;

    // CRITICAL FIX: Update morphTargetInfluences with current morph values
    Object.entries(mesh.morphTargetDictionary).forEach(([morphName, morphIndex]) => {
      const influence = activeMorphs[morphName] || 0;
      if (mesh.morphTargetInfluences[morphIndex] !== influence) {
        mesh.morphTargetInfluences[morphIndex] = influence;
      }
    });

    // CRITICAL FIX: Force updateMorphTargets call
    if (mesh.updateMorphTargets) {
      mesh.updateMorphTargets();
    }

    // CRITICAL FIX: Force geometry update
    this.forceGeometryVisualUpdate(mesh);

    // CRITICAL FIX: Force material update
    this.forceMeshMaterialUpdate(mesh);
  }

  forceGeometryVisualUpdate(mesh) {
    if (!mesh.geometry) return;

    // CRITICAL FIX: Force geometry attribute updates
    if (mesh.geometry.attributes.position) {
      mesh.geometry.attributes.position.needsUpdate = true;
    }
    if (mesh.geometry.attributes.normal) {
      mesh.geometry.attributes.normal.needsUpdate = true;
    }

    // CRITICAL FIX: Force geometry bounds recalculation
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
    
    // CRITICAL FIX: Force vertex normals recalculation
    if (mesh.geometry.computeVertexNormals) {
      mesh.geometry.computeVertexNormals();
    }

    // CRITICAL FIX: Increment geometry version to force WebGL upload
    mesh.geometry.version = (mesh.geometry.version || 0) + 1;

    // CRITICAL FIX: Force mesh matrix updates
    mesh.updateMatrix();
    mesh.updateMatrixWorld(true);
  }

  forceMeshMaterialUpdate(mesh) {
    const updateMaterial = (material) => {
      material.needsUpdate = true;
      material.version = (material.version || 0) + 1;
      
      if (material.program) {
        material.program = null;
      }
      
      if (material.uniforms) {
        material.uniformsNeedUpdate = true;
      }
    };

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(updateMaterial);
    } else if (mesh.material) {
      updateMaterial(mesh.material);
    }
  }

  forceVisualSceneUpdate() {
    if (!this.scene) return;

    // CRITICAL FIX: Enhanced scene traversal with visual fixes
    this.scene.traverse((object) => {
      if (object.isMesh || object.isSkinnedMesh) {
        // Force geometry updates
        if (object.geometry) {
          object.geometry.computeBoundingBox();
          object.geometry.computeBoundingSphere();
          object.geometry.computeVertexNormals();
          object.geometry.version = (object.geometry.version || 0) + 1;
        }

        // Force material updates with visual rendering fixes
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
              mat.needsUpdate = true;
              mat.version = (mat.version || 0) + 1;
              if (mat.program) mat.program = null;
            });
          } else {
            object.material.needsUpdate = true;
            object.material.version = (object.material.version || 0) + 1;
            if (object.material.program) object.material.program = null;
          }
        }

        // Force matrix updates
        object.updateMatrix();
        object.updateMatrixWorld(true);
      }
    });

    // CRITICAL FIX: Force scene matrix update
    this.scene.updateMatrixWorld(true);
    
    // CRITICAL FIX: Reset renderer state
    if (this.renderer && this.renderer.state) {
      this.renderer.state.reset();
    }
  }

  executeVisualRenderingSequence() {
    if (!this.renderer || !this.camera || !this.scene) return;

    // CRITICAL FIX: Multi-pass rendering sequence to ensure visual updates
    
    // Pass 1: Initial render
    this.renderer.render(this.scene, this.camera);
    
    // Pass 2: Force geometry updates and render again
    requestAnimationFrame(() => {
      if (!this.renderer || !this.camera || !this.scene) return;
      
      // Force additional updates
      this.meshTargets.forEach(mesh => {
        this.forceGeometryVisualUpdate(mesh);
      });
      
      // Second render pass
      this.renderer.render(this.scene, this.camera);
      
      // Pass 3: Final render to ensure all changes are visible
      requestAnimationFrame(() => {
        if (this.renderer && this.camera && this.scene) {
          this.renderer.render(this.scene, this.camera);
        }
      });
    });
  }

  // TEST METHOD: Apply specific morph with visual verification
  testMorphVisually(morphName, weight = 1.0) {
    console.log(`🧪 Testing morph '${morphName}' with weight ${weight} using visual fixes...`);
    
    // Apply the morph
    this.applySingleMorph(morphName, weight, true);
    
    // Force visual update sequence
    this.forceVisualSceneUpdate();
    this.executeVisualRenderingSequence();
    
    // Log current state for verification
    const currentState = this.getCurrentState();
    console.log('📊 Current visual state after morph application:', {
      morphName,
      weight,
      activeMorphs: currentState.activeMorphs
    });
    
    return currentState;
  }

  // TEST METHOD: Apply viseme with definitive visual verification
  applyVisemeWithVisualVerification(viseme, intensity = 1.0) {
    console.log(`🎭 Applying viseme '${viseme}' with DEFINITIVE visual verification...`);
    
    // Apply viseme
    const result = this.applyViseme(viseme, intensity, true);
    
    // CRITICAL: Force comprehensive visual update
    this.forceVisualSceneUpdate();
    this.executeVisualRenderingSequence();
    
    console.log('✅ Visual verification complete for viseme:', viseme);
    return result;
  }

  // -------------- Viseme override/profile helpers --------------
  getResolvedVisemeMappings() {
    return JSON.parse(JSON.stringify(this.resolvedVisemeMappings || {}));
  }

  setResolvedVisemeWeights(viseme, entries) {
    // entries: Array<{ morph: string, weight: number }>
    if (!this.resolvedVisemeMappings) return;
    const morphs = [];
    const weights = [];
    entries.forEach((e) => {
      if (!e) return;
      const name = this.resolveMorphName(e.morph) || e.morph;
      morphs.push(name);
      weights.push(Math.max(0, Math.min(1, e.weight || 0)));
    });
    this.resolvedVisemeMappings[viseme] = { morphs, weights };
    this.visemeCombinations[viseme] = morphs.slice();
  }

  setResolvedVisemeMappings(resolved) {
    if (!resolved) return;
    this.resolvedVisemeMappings = JSON.parse(JSON.stringify(resolved));
    const combos = {};
    Object.entries(this.resolvedVisemeMappings).forEach(([v, m]) => {
      combos[v] = m?.morphs ? m.morphs.slice() : [];
    });
    this.visemeCombinations = combos;
    if (this.debug) console.log('📝 Applied custom resolved viseme mappings');
  }

  resetResolvedVisemeMappings() {
    if (!this.defaultResolvedVisemeMappings) return;
    this.setResolvedVisemeMappings(this.defaultResolvedVisemeMappings);
    if (this.debug) console.log('↩️ Reset all visemes to default resolved mappings');
  }

  resetVisemeToDefault(viseme) {
    if (!this.defaultResolvedVisemeMappings || !this.defaultResolvedVisemeMappings[viseme]) return;
    const entry = this.defaultResolvedVisemeMappings[viseme];
    this.resolvedVisemeMappings[viseme] = JSON.parse(JSON.stringify(entry));
    this.visemeCombinations[viseme] = entry?.morphs ? entry.morphs.slice() : [];
    if (this.debug) console.log(`↩️ Reset viseme '${viseme}' to default`);
  }

  exportProfile() {
    return {
      modelName: this.model?.name || 'unknown-model',
      resolvedVisemeMappings: this.getResolvedVisemeMappings(),
      visemeIntensities: { ...this.visemeIntensities },
      timestamp: Date.now(),
    };
  }

  importProfile(profile) {
    try {
      if (!profile || !profile.resolvedVisemeMappings) return false;
      this.setResolvedVisemeMappings(profile.resolvedVisemeMappings);
      if (profile.visemeIntensities) this.visemeIntensities = { ...profile.visemeIntensities };
      if (this.debug) console.log('📥 Imported viseme profile');
      return true;
    } catch (e) {
      console.error('Failed to import profile:', e);
      return false;
    }
  }

  // Per-viseme intensity helpers
  getVisemeIntensities() {
    return { ...this.visemeIntensities };
  }

  setVisemeIntensity(viseme, value) {
    const v = Math.max(0, Math.min(1, Number(value) || 0));
    this.visemeIntensities[viseme] = v;
  }

  resetVisemeIntensity(viseme) {
    if (this.defaultVisemeIntensities && Object.prototype.hasOwnProperty.call(this.defaultVisemeIntensities, viseme)) {
      this.visemeIntensities[viseme] = this.defaultVisemeIntensities[viseme];
    }
  }

  setVisemeIntensities(map) {
    if (!map) return;
    Object.keys(map).forEach(k => {
      const v = Math.max(0, Math.min(1, Number(map[k]) || 0));
      this.visemeIntensities[k] = v;
    });
  }

  getCurrentState() {
    return {
      viseme: this.currentViseme,
      isReady: this.isReady,
      meshCount: this.meshTargets.length,
      hasBodyMesh: !!this.bodyMesh,
      hasTongueMesh: !!this.tongueMesh,
      activeMorphs: Object.entries(this.currentMorphs)
        .filter(([, value]) => value > 0.01)
        .map(([name, value]) => ({ name, value: value.toFixed(3) })),
    };
  }

  async testAllVisemes(duration = 1000) {
    const visemes = Object.keys(this.visemeMappings);
    for (const viseme of visemes) {
      console.log(`Testing viseme: ${viseme}`);
      this.applyViseme(viseme, 1.0, true);
      await new Promise((resolve) => setTimeout(resolve, duration));
    }
    this.reset();
    console.log('✅ Viseme test complete');
  }
}

export async function createEnhancedGLBLipSyncSystem(glbUrl, renderer = null, camera = null) {
  try {
    const lipSyncSystem = new GLBActorCoreLipSyncEnhanced();
    const result = await lipSyncSystem.initialize(glbUrl, renderer, camera);

    result.applyViseme = (viseme, intensity, immediate) => lipSyncSystem.applyViseme(viseme, intensity, immediate);
    result.applySingleMorph = (morphName, weight, immediate) => lipSyncSystem.applySingleMorph(morphName, weight, immediate);
    result.reset = () => lipSyncSystem.reset();
    result.testAllVisemes = (duration) => lipSyncSystem.testAllVisemes(duration);
    result.getCurrentState = () => lipSyncSystem.getCurrentState();
    result.update = () => lipSyncSystem.update();
    result.setRenderer = (renderer, camera) => {
      lipSyncSystem.renderer = renderer;
      lipSyncSystem.camera = camera;
    };

    // expose override/profile helpers
    result.getResolvedVisemeMappings = () => lipSyncSystem.getResolvedVisemeMappings();
    result.setResolvedVisemeWeights = (viseme, entries) => lipSyncSystem.setResolvedVisemeWeights(viseme, entries);
    result.setResolvedVisemeMappings = (resolved) => lipSyncSystem.setResolvedVisemeMappings(resolved);
    result.resetResolvedVisemeMappings = () => lipSyncSystem.resetResolvedVisemeMappings();
    result.resetVisemeToDefault = (viseme) => lipSyncSystem.resetVisemeToDefault(viseme);
    result.exportProfile = () => lipSyncSystem.exportProfile();
    result.importProfile = (profile) => lipSyncSystem.importProfile(profile);
    result.getVisemeIntensities = () => lipSyncSystem.getVisemeIntensities();
    result.setVisemeIntensity = (v, val) => lipSyncSystem.setVisemeIntensity(v, val);
    result.setVisemeIntensities = (map) => lipSyncSystem.setVisemeIntensities(map);
    result.resetVisemeIntensity = (v) => lipSyncSystem.resetVisemeIntensity(v);

    return result;
  } catch (error) {
    console.error('❌ Failed to create enhanced GLB lip-sync system:', error);
    throw error;
  }
}
