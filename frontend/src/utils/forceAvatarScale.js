import * as THREE from 'three';

export const forceAvatarScale = (targetScale = 0.001) => {
  console.log('🔧 FORCE AVATAR SCALE - Starting override...');
  
  const findAndScaleAvatar = () => {
    const canvas = document.querySelector('.avatar-canvas');
    if (!canvas) {
      console.log('❌ No canvas found');
      return false;
    }

    const r3f = canvas.__r3f;
    if (!r3f) {
      console.log('❌ No R3F store found');
      return false;
    }

    const { scene } = r3f.store.getState();
    if (!scene) {
      console.log('❌ No scene found');
      return false;
    }

    console.log('🔍 Searching scene for avatar objects...');
    let scaledObjects = 0;

    scene.traverse((child) => {
      // Scale ANY object that might be the avatar
      if (child.isMesh || child.isSkinnedMesh || child.isGroup) {
        if (child.scale.x > 0.01) { // Only scale if it's currently large
          console.log(`📏 Scaling object: ${child.type} ${child.name || 'unnamed'}`);
          console.log(`   Current scale: ${child.scale.x.toFixed(6)}`);
          
          child.scale.setScalar(targetScale);
          child.position.set(0, 0, 0); // Center it
          
          console.log(`   New scale: ${child.scale.x.toFixed(6)}`);
          scaledObjects++;
        }
      }
    });

    console.log(`✅ Scaled ${scaledObjects} objects to ${targetScale}`);
    return scaledObjects > 0;
  };

  // Try multiple times with delays
  let attempts = 0;
  const maxAttempts = 10;
  
  const attemptScale = () => {
    attempts++;
    console.log(`🔄 Scale attempt ${attempts}/${maxAttempts}`);
    
    if (findAndScaleAvatar()) {
      console.log('✅ Successfully scaled avatar!');
      return;
    }
    
    if (attempts < maxAttempts) {
      setTimeout(attemptScale, 1000);
    } else {
      console.log('❌ Failed to find and scale avatar after all attempts');
    }
  };

  attemptScale();
};

// Expose to global scope for manual testing
if (typeof window !== 'undefined') {
  window.forceAvatarScale = forceAvatarScale;
  console.log('🌐 forceAvatarScale available globally');
}