// Enhanced entry point for Autonomous Viseme Optimizer with robust MediaPipe v2
// Import modules with ES6 syntax and enhanced error handling
import MediaPipeVisemeAnalyzer from '../mediapipe-viseme-analyzer.js';
import GeometricVisemeAnalyzer from '../geometric-viseme-analyzer.js';
import AdvancedMorphEngine from '../advanced-morph-engine.js';
import MediaPipeManager from './utils/MediaPipeManager.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Export to global scope for use in HTML with enhanced MediaPipe v2 support
window.MediaPipeVisemeAnalyzer = MediaPipeVisemeAnalyzer;
window.GeometricVisemeAnalyzer = GeometricVisemeAnalyzer;
window.AdvancedMorphEngine = AdvancedMorphEngine;
window.MediaPipeManager = MediaPipeManager;
window.THREE = THREE;
window.GLTFLoader = GLTFLoader;
window.OrbitControls = OrbitControls;

console.log('✅ Enhanced modules loaded with MediaPipe v2 support');
console.log('📦 MediaPipeVisemeAnalyzer:', typeof MediaPipeVisemeAnalyzer);
console.log('📦 MediaPipeManager:', typeof MediaPipeManager);
console.log('📦 GeometricVisemeAnalyzer:', typeof GeometricVisemeAnalyzer);
console.log('📦 AdvancedMorphEngine:', typeof AdvancedMorphEngine);
console.log('📦 THREE.js version:', THREE.REVISION);

// Initialize geometric analyzer immediately as backup
if (GeometricVisemeAnalyzer) {
    try {
        const geometricAnalyzer = new GeometricVisemeAnalyzer();
        window.geometricAnalyzer = geometricAnalyzer;
        console.log('🔄 Pre-initializing geometric analyzer...');
        geometricAnalyzer.initialize().then(success => {
            if (success) {
                console.log('✅ Geometric analyzer pre-initialized and ready');
            } else {
                console.warn('⚠️ Geometric analyzer pre-initialization failed');
            }
        }).catch(error => {
            console.error('❌ Geometric analyzer pre-initialization error:', error);
        });
    } catch (error) {
        console.error('❌ Failed to create geometric analyzer:', error);
    }
} else {
    console.error('❌ GeometricVisemeAnalyzer not available in module imports');
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Autonomous Viseme Optimizer...');
    
    // Try multiple times to find the initialization function
    let attempts = 0;
    const maxAttempts = 20; // 2 seconds total
    
    const tryInitialize = () => {
        attempts++;
        
        if (typeof window.initializeThreeJS === 'function') {
            console.log('🔄 Starting Three.js initialization...');
            window.initializeThreeJS();
        } else if (attempts < maxAttempts) {
            console.log(`⏳ Waiting for initializeThreeJS function... (attempt ${attempts}/${maxAttempts})`);
            setTimeout(tryInitialize, 100);
        } else {
            console.error('❌ initializeThreeJS function not found after multiple attempts');
            console.log('💡 The HTML script may not have finished parsing. This is not critical - the app can still work.');
        }
    };
    
    // Start trying after a small delay
    setTimeout(tryInitialize, 100);
});