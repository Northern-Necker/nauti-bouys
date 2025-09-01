/**
 * Babylon.js ActorCore Lip-Sync System
 * 
 * Superior FBX morph target support including tongue morphs
 * that Three.js FBXLoader cannot access
 */

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class BabylonActorCoreLipSync {
    constructor(canvas, modelPath) {
        this.canvas = canvas;
        this.modelPath = modelPath;
        this.morphTargets = new Map();
        this.currentViseme = null;
        this.scene = null;
        this.engine = null;
        this.model = null;
        
        // Global intensity multiplier for overall dampening
        this.globalIntensityMultiplier = 0.85;
        
        // Viseme configurations with properly tuned intensities
        this.visemeConfigs = {
            // Silence/closed mouth
            'sil': {
                morphs: [],
                intensity: 0
            },
            
            // Vowel sounds with jaw opening
            'aa': {
                morphs: ['Jaw_Open', 'Mouth_Stretch_L', 'Mouth_Stretch_R'],
                intensities: { 'Jaw_Open': 0.8, 'Mouth_Stretch_L': 0.6, 'Mouth_Stretch_R': 0.6 }
            },
            'E': {
                morphs: ['Jaw_Open', 'Mouth_Smile_L', 'Mouth_Smile_R'],
                intensities: { 'Jaw_Open': 0.5, 'Mouth_Smile_L': 0.7, 'Mouth_Smile_R': 0.7 }
            },
            'ih': {
                morphs: ['Jaw_Open', 'Mouth_Smile_L', 'Mouth_Smile_R'],
                intensities: { 'Jaw_Open': 0.3, 'Mouth_Smile_L': 0.5, 'Mouth_Smile_R': 0.5 }
            },
            'oh': {
                morphs: ['Jaw_Open', 'Mouth_Pucker_L', 'Mouth_Pucker_R'],
                intensities: { 'Jaw_Open': 0.6, 'Mouth_Pucker_L': 0.8, 'Mouth_Pucker_R': 0.8 }
            },
            'ou': {
                morphs: ['Jaw_Open', 'Mouth_Pucker_L', 'Mouth_Pucker_R'],
                intensities: { 'Jaw_Open': 0.4, 'Mouth_Pucker_L': 0.85, 'Mouth_Pucker_R': 0.85 }
            },
            
            // Bilabial sounds (P, B, M) - reduced intensity
            'PP': {
                morphs: ['Mouth_Press_L', 'Mouth_Press_R'],
                intensities: { 'Mouth_Press_L': 0.5, 'Mouth_Press_R': 0.5 }
            },
            
            // Dental/Alveolar sounds with TONGUE MORPHS
            'DD': {
                morphs: ['Tongue_Tip_Up', 'Jaw_Open'],  // Tongue to alveolar ridge
                intensities: { 'Tongue_Tip_Up': 0.8, 'Jaw_Open': 0.3 }
            },
            'nn': {
                morphs: ['Tongue_Tip_Up', 'Jaw_Open'],  // Tongue to alveolar ridge for N
                intensities: { 'Tongue_Tip_Up': 0.75, 'Jaw_Open': 0.32 }
            },
            'TH': {
                morphs: ['Tongue_Out', 'Mouth_Smile_L', 'Mouth_Smile_R'],  // Tongue between teeth
                intensities: { 'Tongue_Out': 0.7, 'Mouth_Smile_L': 0.3, 'Mouth_Smile_R': 0.3 }
            },
            
            // Velar sounds
            'kk': {
                morphs: ['Jaw_Forward', 'Jaw_Open'],  // Different from E by using forward motion
                intensities: { 'Jaw_Forward': 0.4, 'Jaw_Open': 0.35 }
            },
            
            // Retroflex sounds with TONGUE CURL
            'RR': {
                morphs: ['Tongue_Curl', 'Jaw_Open'],  // Tongue curled back for R
                intensities: { 'Tongue_Curl': 0.8, 'Jaw_Open': 0.25 }
            },
            
            // Fricatives
            'FF': {
                morphs: ['Mouth_Bottom_Lip_Under_Top_Teeth', 'Jaw_Open'],
                intensities: { 'Mouth_Bottom_Lip_Under_Top_Teeth': 0.6, 'Jaw_Open': 0.15 }
            },
            'SS': {
                morphs: ['Mouth_Smile_L', 'Mouth_Smile_R', 'Jaw_Forward'],
                intensities: { 'Mouth_Smile_L': 0.4, 'Mouth_Smile_R': 0.4, 'Jaw_Forward': 0.3 }
            },
            'CH': {
                morphs: ['Mouth_Pucker_L', 'Mouth_Pucker_R', 'Jaw_Open'],
                intensities: { 'Mouth_Pucker_L': 0.5, 'Mouth_Pucker_R': 0.5, 'Jaw_Open': 0.3 }
            }
        };
        
        this.init();
    }
    
    async init() {
        // Create Babylon.js engine and scene
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        
        // Setup camera and lights
        const camera = new BABYLON.ArcRotateCamera("camera", 
            Math.PI / 2, Math.PI / 2, 2, 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        camera.attachControl(this.canvas, true);
        
        const light = new BABYLON.HemisphericLight("light", 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        
        // Load the FBX model
        await this.loadModel();
        
        // Start render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        
        // Handle window resize
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }
    
    async loadModel() {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.LoadAssetContainer(
                "", 
                this.modelPath, 
                this.scene, 
                (container) => {
                    // Add loaded meshes to scene
                    container.addAllToScene();
                    
                    // Collect ALL morph targets from ALL meshes
                    console.log('=== Babylon.js Morph Target Discovery ===');
                    container.meshes.forEach(mesh => {
                        if (mesh.morphTargetManager) {
                            console.log(`Mesh: ${mesh.name}`);
                            console.log(`  Morph target count: ${mesh.morphTargetManager.numTargets}`);
                            
                            for (let i = 0; i < mesh.morphTargetManager.numTargets; i++) {
                                const target = mesh.morphTargetManager.getTarget(i);
                                console.log(`    - ${target.name}`);
                                
                                // Store morph target reference
                                this.morphTargets.set(target.name, {
                                    target: target,
                                    mesh: mesh,
                                    manager: mesh.morphTargetManager
                                });
                            }
                        }
                    });
                    
                    // Check specifically for tongue morphs
                    const tongueMorphs = ['Tongue_Out', 'Tongue_Tip_Up', 'Tongue_Curl'];
                    console.log('\n=== Tongue Morph Availability ===');
                    tongueMorphs.forEach(morphName => {
                        const morphData = this.morphTargets.get(morphName);
                        if (morphData) {
                            console.log(`✓ ${morphName} FOUND on mesh: ${morphData.mesh.name}`);
                        } else {
                            console.log(`✗ ${morphName} NOT FOUND`);
                        }
                    });
                    
                    console.log(`\nTotal morphs accessible: ${this.morphTargets.size}`);
                    this.model = container;
                    resolve(container);
                },
                null,
                (scene, message, exception) => {
                    console.error('Error loading FBX:', message, exception);
                    reject(exception);
                }
            );
        });
    }
    
    /**
     * Apply a viseme with proper morph target blending
     */
    applyViseme(viseme, intensity = 1.0) {
        const visemeKey = viseme.toLowerCase();
        const config = this.visemeConfigs[visemeKey];
        
        if (!config) {
            console.warn(`Unknown viseme: ${viseme}`);
            return;
        }
        
        // Reset all morphs first
        this.resetAllMorphs();
        
        // Apply morphs for this viseme
        config.morphs.forEach(morphName => {
            const morphData = this.morphTargets.get(morphName);
            if (morphData) {
                const morphIntensity = config.intensities[morphName] || 1.0;
                const finalIntensity = intensity * morphIntensity * this.globalIntensityMultiplier;
                
                morphData.target.influence = finalIntensity;
                console.log(`Applied ${morphName}: ${finalIntensity.toFixed(2)}`);
            } else {
                console.warn(`Morph not found: ${morphName}`);
            }
        });
        
        this.currentViseme = visemeKey;
    }
    
    /**
     * Reset all morph targets to zero
     */
    resetAllMorphs() {
        this.morphTargets.forEach((morphData, morphName) => {
            morphData.target.influence = 0;
        });
    }
    
    /**
     * Test tongue morphs specifically
     */
    testTongueMorphs() {
        const tongueMorphs = [
            { name: 'Tongue_Out', intensity: 1.0 },       // Should work (TH viseme)
            { name: 'Tongue_Tip_Up', intensity: 1.0 },    // Critical for NN, DD
            { name: 'Tongue_Curl', intensity: 1.0 }       // Critical for RR
        ];
        
        console.log('=== Testing Tongue Morphs ===');
        
        tongueMorphs.forEach((morph, index) => {
            setTimeout(() => {
                this.resetAllMorphs();
                
                const morphData = this.morphTargets.get(morph.name);
                if (morphData) {
                    morphData.target.influence = morph.intensity;
                    console.log(`✓ Testing ${morph.name} at intensity ${morph.intensity}`);
                    console.log(`  Mesh: ${morphData.mesh.name}`);
                    
                    // Also open jaw slightly to see tongue better
                    const jawData = this.morphTargets.get('Jaw_Open');
                    if (jawData) {
                        jawData.target.influence = 0.3;
                    }
                } else {
                    console.log(`✗ ${morph.name} not available`);
                }
            }, index * 2000);
        });
    }
    
    /**
     * Animate through visemes for testing
     */
    animateVisemes(visemeSequence, timing = 500) {
        let index = 0;
        
        const animate = () => {
            if (index < visemeSequence.length) {
                const viseme = visemeSequence[index];
                console.log(`Applying viseme: ${viseme}`);
                this.applyViseme(viseme);
                index++;
                setTimeout(animate, timing);
            } else {
                this.resetAllMorphs();
            }
        };
        
        animate();
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.engine) {
            this.engine.dispose();
        }
    }
}

// Export for use in test page
export default BabylonActorCoreLipSync;
