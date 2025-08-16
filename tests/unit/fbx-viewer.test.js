import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createFbxViewer } from '../../frontend/src/utils/fbxViewer.js';

// Use a small public FBX model
const MODEL_URL = 'https://threejs.org/examples/models/fbx/Simple.fbx';

describe('FBX viewer', () => {
  it('frames the model so it is visible', async () => {
    const { camera, box } = await createFbxViewer(MODEL_URL);
    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    expect(frustum.intersectsBox(box)).toBe(true);
  }, 30000);
});
