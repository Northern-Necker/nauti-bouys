import * as THREE from 'three';
import { FBXLoader } from 'three-stdlib';

export const FBX_LIP_SYNC_CONFIG = {
  visemes: {
    A: 4,
    E: 4,
    I: 4,
    O: 4,
    U: 4,
    F: 4,
    M: 4,
    N: 4,
    TH: 4,
    CH: 4,
    T: 4,
    K: 4,
    S: 4,
    SH: 4,
    R: 4,
  },
  remap: (value, viseme) => {
    const { visemes } = FBX_LIP_SYNC_CONFIG;
    const visemeIndex = Object.keys(visemes).indexOf(viseme);
    const visemeCount = Object.keys(visemes).length;
    const visemeSize = 1 / visemeCount;
    const visemeStart = visemeIndex * visemeSize;
    const visemeEnd = visemeStart + visemeSize;
    const visemeValue = (value - visemeStart) / visemeSize;
    return visemeValue;
  },
  init: async (url) => {
    const { scene, camera, object, box } = await createFbxViewer(url);
    const { visemes, remap } = FBX_LIP_SYNC_CONFIG;
    const visemeNames = Object.keys(visemes);
    const visemeValues = {};
    visemeNames.forEach((name) => {
      visemeValues[name] = 0;
    });
    const mixer = new THREE.AnimationMixer(object);
    const clock = new THREE.Clock();
    const fbxLipSync = {
      scene,
      camera,
      object,
      box,
      mixer,
      clock,
      visemes,
      visemeNames,
      visemeValues,
      remap,
    };
    return fbxLipSync;
  },
};
