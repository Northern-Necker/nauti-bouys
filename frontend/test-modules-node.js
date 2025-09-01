// Test ES6 module imports in Node.js
import MediaPipeVisemeAnalyzer from './mediapipe-viseme-analyzer.js';
import AdvancedMorphEngine from './advanced-morph-engine.js';

console.log('🧪 Testing ES6 module imports in Node.js...');

try {
    console.log('✅ MediaPipeVisemeAnalyzer imported:', typeof MediaPipeVisemeAnalyzer);
    console.log('✅ AdvancedMorphEngine imported:', typeof AdvancedMorphEngine);
    
    // Test instantiation
    const analyzer = new MediaPipeVisemeAnalyzer();
    console.log('✅ MediaPipeVisemeAnalyzer instantiated:', analyzer.constructor.name);
    
    const morphEngine = new AdvancedMorphEngine([], console.log);
    console.log('✅ AdvancedMorphEngine instantiated:', morphEngine.constructor.name);
    
    console.log('🎉 All ES6 module tests passed!');
    
} catch (error) {
    console.error('❌ ES6 module test failed:', error.message);
    console.error('Stack:', error.stack);
}