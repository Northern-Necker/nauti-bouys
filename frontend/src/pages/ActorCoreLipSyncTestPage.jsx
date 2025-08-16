import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { ActorCoreLipSync } from '../utils/actorCoreLipSync';

// Component to load and test the ActorCore lip sync system
function ActorCoreTestAvatar() {
  const group = useRef();
  const [lipSync, setLipSync] = useState(null);
  const [morphTargets, setMorphTargets] = useState([]);
  const [faceMesh, setFaceMesh] = useState(null);
  
  // Load the GLB model
  const gltf = useGLTF('/assets/SavannahAvatar.glb');
  
  useEffect(() => {
    if (!gltf || !gltf.scene) return;
    
    console.log('=== ACTORCORE MORPH TARGET ANALYSIS ===');
    console.log('GLB model loaded:', gltf);
    
    // Find all meshes with morph targets
    const meshesWithMorphs = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        meshesWithMorphs.push({
          name: child.name,
          morphCount: Object.keys(child.morphTargetDictionary).length,
          dictionary: child.morphTargetDictionary,
          mesh: child
        });
        
        console.log(`\n--- MESH: ${child.name} ---`);
        console.log(`Morph target count: ${Object.keys(child.morphTargetDictionary).length}`);
        console.log('Morph target dictionary:', child.morphTargetDictionary);
        console.log('Morph target names:', Object.keys(child.morphTargetDictionary).sort());
        
        // Log each morph target with its index
        Object.entries(child.morphTargetDictionary).forEach(([name, index]) => {
          console.log(`  ${index}: ${name}`);
        });
      }
    });
    
    setMorphTargets(meshesWithMorphs);
    
    // Try to find the face mesh (usually the one with the most morph targets)
    const faceCandidate = meshesWithMorphs.reduce((prev, current) => 
      (prev.morphCount > current.morphCount) ? prev : current
    );
    
    if (faceCandidate) {
      console.log(`\n=== SELECTED FACE MESH: ${faceCandidate.name} ===`);
      console.log('This mesh has the most morph targets and will be used for lip sync');
      setFaceMesh(faceCandidate.mesh);
      
      // Initialize ActorCore lip sync
      try {
        const lipSyncInstance = new ActorCoreLipSync(faceCandidate.mesh);
        setLipSync(lipSyncInstance);
        console.log('ActorCore Lip Sync initialized successfully');
      } catch (error) {
        console.error('Failed to initialize ActorCore Lip Sync:', error);
      }
    }
    
    // Scale and position the model
    gltf.scene.scale.setScalar(0.02);
    gltf.scene.position.set(0, -1, 0);
    
  }, [gltf]);
  
  // Test functions
  const testViseme = (viseme) => {
    if (lipSync) {
      console.log(`Testing viseme: ${viseme}`);
      lipSync.testViseme(viseme, 1.0, 3000);
    }
  };
  
  const speakTest = async () => {
    if (lipSync) {
      console.log('Speaking test phrase...');
      await lipSync.speakText("Hello, welcome to Nauti Bouys! How are you today?");
    }
  };
  
  const getMappingInfo = () => {
    if (lipSync) {
      const info = lipSync.getMappingInfo();
      console.log('=== MAPPING INFO ===');
      console.log('Resolved mappings:', info.resolved);
      console.log('Missing mappings:', info.missing);
      console.log('Available visemes:', info.availableVisemes);
      return info;
    }
    return null;
  };
  
  // Expose functions to window for easy testing
  useEffect(() => {
    window.testViseme = testViseme;
    window.speakTest = speakTest;
    window.getMappingInfo = getMappingInfo;
    window.lipSync = lipSync;
    window.faceMesh = faceMesh;
    
    if (faceMesh) {
      console.log('\n=== TESTING FUNCTIONS AVAILABLE ===');
      console.log('Use these in the browser console:');
      console.log('- testViseme("AI") - Test specific viseme');
      console.log('- speakTest() - Test TTS with lip sync');
      console.log('- getMappingInfo() - Get mapping details');
      console.log('- faceMesh.morphTargetDictionary - See all morph targets');
      console.log('- Object.keys(faceMesh.morphTargetDictionary).sort() - Sorted morph target names');
    }
  }, [lipSync, faceMesh]);
  
  if (!gltf.scene) {
    return null;
  }
  
  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// Main test page component
export default function ActorCoreLipSyncTestPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            ActorCore Lip Sync Test
          </h1>
          <p className="text-xl text-blue-200 mb-6">
            Testing SavannahAvatar.glb with ActorCore facial blendshapes
          </p>
          
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Instructions</h2>
            <div className="text-left text-blue-100 space-y-2">
              <p>1. Open browser console (F12) to see morph target analysis</p>
              <p>2. Look for "ACTORCORE MORPH TARGET ANALYSIS" section</p>
              <p>3. Copy the morph target names and send them to get tailored aliases</p>
              <p>4. Use console functions to test lip sync:</p>
              <ul className="ml-6 mt-2 space-y-1">
                <li>• <code className="bg-black/50 px-2 py-1 rounded">testViseme("AI")</code> - Test specific viseme</li>
                <li>• <code className="bg-black/50 px-2 py-1 rounded">speakTest()</code> - Test TTS with lip sync</li>
                <li>• <code className="bg-black/50 px-2 py-1 rounded">getMappingInfo()</code> - Get mapping details</li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button 
              onClick={() => window.testViseme?.('AI')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Test "AI"
            </button>
            <button 
              onClick={() => window.testViseme?.('E')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Test "E"
            </button>
            <button 
              onClick={() => window.testViseme?.('O')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Test "O"
            </button>
            <button 
              onClick={() => window.testViseme?.('M')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Test "M"
            </button>
          </div>
          
          <button 
            onClick={() => window.speakTest?.()}
            className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
          >
            🎤 Test Speech + Lip Sync
          </button>
        </div>
        
        {isLoading && (
          <div className="text-center text-white mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p>Loading SavannahAvatar.glb model...</p>
          </div>
        )}
        
        <div className="bg-black/20 backdrop-blur-sm rounded-xl overflow-hidden">
          <Canvas
            className="w-full h-[600px]"
            camera={{ position: [0, 0, 5], fov: 50 }}
            onCreated={handleLoadingComplete}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.3} />
            
            <React.Suspense fallback={null}>
              <ActorCoreTestAvatar />
            </React.Suspense>
            
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={15}
              enableDamping={true}
              dampingFactor={0.05}
            />
          </Canvas>
        </div>
        
        <div className="mt-8 bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Expected Output in Console</h3>
          <div className="text-blue-100 text-sm font-mono bg-black/50 p-4 rounded">
            <p>=== ACTORCORE MORPH TARGET ANALYSIS ===</p>
            <p>--- MESH: [MeshName] ---</p>
            <p>Morph target count: 60 (or similar)</p>
            <p>Morph target dictionary: {`{...}`}</p>
            <p>Morph target names: [Array of names]</p>
            <p className="mt-2 text-yellow-300">
              📋 Copy the morph target names from the console and share them!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
