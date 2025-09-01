import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Avatar Validation Utility
 * Performs comprehensive validation of GLB avatar loading and rendering
 */
export class AvatarValidator {
  constructor() {
    this.loader = new GLTFLoader();
    this.validationResults = {
      fileLoaded: false,
      meshesFound: false,
      materialsValid: false,
      animationsFound: false,
      bonesFound: false,
      morphTargetsFound: false,
      boundingBoxValid: false,
      sceneRenderable: false,
      errors: [],
      warnings: [],
      details: {}
    };
  }

  /**
   * Validate GLB file loading and structure
   */
  async validateGLBFile(url) {
    console.log('🔍 Starting Avatar Validation for:', url);
    
    try {
      // Load the GLB file
      const gltf = await this.loadGLB(url);
      
      if (!gltf) {
        this.validationResults.errors.push('Failed to load GLB file');
        return this.validationResults;
      }
      
      this.validationResults.fileLoaded = true;
      console.log('✅ GLB file loaded successfully');
      
      // Validate scene structure
      this.validateScene(gltf.scene);
      
      // Validate animations
      this.validateAnimations(gltf.animations);
      
      // Validate rendering capability
      this.validateRendering(gltf.scene);
      
      // Generate summary
      this.generateSummary();
      
      return this.validationResults;
      
    } catch (error) {
      console.error('❌ Validation error:', error);
      this.validationResults.errors.push(error.message);
      return this.validationResults;
    }
  }
  
  /**
   * Load GLB file
   */
  loadGLB(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          console.log('📦 GLB loaded:', gltf);
          resolve(gltf);
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(2);
          console.log(`⏳ Loading: ${percent}%`);
        },
        (error) => {
          console.error('❌ Load error:', error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Validate scene structure
   */
  validateScene(scene) {
    console.log('🔍 Validating scene structure...');
    
    let meshCount = 0;
    let materialCount = 0;
    let boneCount = 0;
    let morphTargetCount = 0;
    const materials = new Set();
    const issues = [];
    
    scene.traverse((child) => {
      // Check meshes
      if (child.isMesh) {
        meshCount++;
        
        // Check material
        if (child.material) {
          materials.add(child.material);
          materialCount++;
          
          // Check material properties
          if (child.material.transparent && child.material.opacity < 1) {
            issues.push(`Mesh "${child.name}" has transparency (opacity: ${child.material.opacity})`);
          }
          
          if (!child.material.visible) {
            issues.push(`Mesh "${child.name}" material is not visible`);
          }
        } else {
          issues.push(`Mesh "${child.name}" has no material`);
        }
        
        // Check visibility
        if (!child.visible) {
          issues.push(`Mesh "${child.name}" is not visible`);
        }
        
        // Check morph targets
        if (child.morphTargetDictionary) {
          const morphs = Object.keys(child.morphTargetDictionary);
          morphTargetCount += morphs.length;
          console.log(`  📊 Morph targets found in "${child.name}":`, morphs);
        }
      }
      
      // Check bones
      if (child.isBone) {
        boneCount++;
        console.log(`  🦴 Bone found: "${child.name}"`);
      }
    });
    
    // Store results
    this.validationResults.meshesFound = meshCount > 0;
    this.validationResults.materialsValid = materialCount > 0 && issues.length === 0;
    this.validationResults.bonesFound = boneCount > 0;
    this.validationResults.morphTargetsFound = morphTargetCount > 0;
    
    this.validationResults.details.meshCount = meshCount;
    this.validationResults.details.materialCount = materials.size;
    this.validationResults.details.boneCount = boneCount;
    this.validationResults.details.morphTargetCount = morphTargetCount;
    
    if (issues.length > 0) {
      this.validationResults.warnings.push(...issues);
    }
    
    console.log(`  ✅ Found ${meshCount} meshes, ${materials.size} materials, ${boneCount} bones, ${morphTargetCount} morph targets`);
  }
  
  /**
   * Validate animations
   */
  validateAnimations(animations) {
    console.log('🔍 Validating animations...');
    
    if (!animations || animations.length === 0) {
      console.log('  ⚠️ No animations found');
      this.validationResults.animationsFound = false;
      return;
    }
    
    this.validationResults.animationsFound = true;
    this.validationResults.details.animationCount = animations.length;
    
    animations.forEach((clip, index) => {
      console.log(`  🎬 Animation ${index}: "${clip.name}" (duration: ${clip.duration.toFixed(2)}s)`);
    });
  }
  
  /**
   * Validate rendering capability
   */
  validateRendering(scene) {
    console.log('🔍 Validating rendering capability...');
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    console.log('  📏 Bounding box size:', {
      width: size.x.toFixed(3),
      height: size.y.toFixed(3),
      depth: size.z.toFixed(3)
    });
    
    console.log('  📍 Center position:', {
      x: center.x.toFixed(3),
      y: center.y.toFixed(3),
      z: center.z.toFixed(3)
    });
    
    // Check if size is reasonable
    const maxDimension = Math.max(size.x, size.y, size.z);
    const minDimension = Math.min(size.x, size.y, size.z);
    
    if (maxDimension === 0) {
      this.validationResults.errors.push('Model has zero size');
      this.validationResults.boundingBoxValid = false;
    } else if (maxDimension > 1000) {
      this.validationResults.warnings.push(`Model is very large (max dimension: ${maxDimension.toFixed(2)})`);
      this.validationResults.boundingBoxValid = true;
    } else if (maxDimension < 0.001) {
      this.validationResults.warnings.push(`Model is very small (max dimension: ${maxDimension.toFixed(6)})`);
      this.validationResults.boundingBoxValid = true;
    } else {
      this.validationResults.boundingBoxValid = true;
    }
    
    this.validationResults.details.boundingBox = {
      size: { x: size.x, y: size.y, z: size.z },
      center: { x: center.x, y: center.y, z: center.z },
      maxDimension,
      minDimension
    };
    
    // Check if scene can be rendered
    this.validationResults.sceneRenderable = 
      this.validationResults.meshesFound && 
      this.validationResults.materialsValid && 
      this.validationResults.boundingBoxValid;
  }
  
  /**
   * Generate validation summary
   */
  generateSummary() {
    console.log('\n📊 VALIDATION SUMMARY:');
    console.log('====================');
    
    const checks = [
      { name: 'File Loaded', value: this.validationResults.fileLoaded },
      { name: 'Meshes Found', value: this.validationResults.meshesFound },
      { name: 'Materials Valid', value: this.validationResults.materialsValid },
      { name: 'Animations Found', value: this.validationResults.animationsFound },
      { name: 'Bones Found', value: this.validationResults.bonesFound },
      { name: 'Morph Targets Found', value: this.validationResults.morphTargetsFound },
      { name: 'Bounding Box Valid', value: this.validationResults.boundingBoxValid },
      { name: 'Scene Renderable', value: this.validationResults.sceneRenderable }
    ];
    
    checks.forEach(check => {
      const icon = check.value ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.value}`);
    });
    
    if (this.validationResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.validationResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.validationResults.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.validationResults.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n📈 DETAILS:', this.validationResults.details);
    
    // Overall status
    const isValid = this.validationResults.sceneRenderable && 
                   this.validationResults.errors.length === 0;
    
    console.log('\n🎯 OVERALL STATUS:', isValid ? '✅ AVATAR IS VALID' : '❌ AVATAR HAS ISSUES');
  }
}

// Export validation function for easy use
export async function validateAvatar(url = '/assets/SavannahAvatar.glb') {
  const validator = new AvatarValidator();
  return await validator.validateGLBFile(url);
}