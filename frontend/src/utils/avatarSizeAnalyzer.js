import * as THREE from 'three';

export const analyzeAvatarSize = (gltf) => {
  if (!gltf || !gltf.scene) {
    console.log('No GLTF scene to analyze');
    return null;
  }

  // Get original bounds
  const originalBox = new THREE.Box3().setFromObject(gltf.scene);
  const originalSize = originalBox.getSize(new THREE.Vector3());
  const originalCenter = originalBox.getCenter(new THREE.Vector3());

  console.log('=== AVATAR SIZE ANALYSIS ===');
  console.log('Original size:', {
    x: originalSize.x.toFixed(2),
    y: originalSize.y.toFixed(2), 
    z: originalSize.z.toFixed(2)
  });
  console.log('Original center:', {
    x: originalCenter.x.toFixed(2),
    y: originalCenter.y.toFixed(2),
    z: originalCenter.z.toFixed(2)
  });

  // Calculate what scale would make it fit nicely in view
  const maxDimension = Math.max(originalSize.x, originalSize.y, originalSize.z);
  console.log('Max dimension:', maxDimension.toFixed(2));

  // Different target sizes to test
  const targetSizes = [0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 1.0, 2.0];
  
  console.log('\n=== SCALE RECOMMENDATIONS ===');
  targetSizes.forEach(target => {
    const scale = target / maxDimension;
    const finalHeight = originalSize.y * scale;
    console.log(`Target: ${target} -> Scale: ${scale.toFixed(4)} -> Final height: ${finalHeight.toFixed(3)}`);
  });

  // For a camera at distance 1.5 with FOV 60, visible height at origin is approximately:
  const cameraDistance = 1.5;
  const fovRad = (60 * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(fovRad / 2) * cameraDistance;
  
  console.log('\n=== CAMERA ANALYSIS ===');
  console.log('Camera distance:', cameraDistance);
  console.log('Visible height at origin:', visibleHeight.toFixed(3));
  
  // Recommend scale for avatar to be 80% of visible height
  const recommendedScale = (visibleHeight * 0.8) / originalSize.y;
  console.log('Recommended scale for 80% of view:', recommendedScale.toFixed(6));
  
  return {
    originalSize,
    originalCenter,
    maxDimension,
    visibleHeight,
    recommendedScale
  };
};

// Emergency tiny scale function
export const applyEmergencyScale = (gltf) => {
  if (!gltf || !gltf.scene) return;
  
  console.log('APPLYING EMERGENCY TINY SCALE');
  
  // Reset any existing scaling
  gltf.scene.scale.set(1, 1, 1);
  gltf.scene.position.set(0, 0, 0);
  
  const analysis = analyzeAvatarSize(gltf);
  
  if (analysis) {
    // Use much smaller scale - 5% of recommended
    const emergencyScale = analysis.recommendedScale * 0.05;
    console.log('Emergency scale:', emergencyScale);
    
    gltf.scene.scale.setScalar(emergencyScale);
    
    // Recalculate center after scaling
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    
    // Move to origin
    gltf.scene.position.sub(center);
    
    console.log('Applied emergency scale:', emergencyScale.toFixed(6));
  }
};