import * as THREE from 'three';
import { FBXLoader } from 'three-stdlib';

/**
 * Load an FBX model and ensure it is visible by framing the camera to fit it.
 * @param {string} url - URL of the FBX file.
 * @returns {Promise<{scene:THREE.Scene,camera:THREE.PerspectiveCamera,object:THREE.Object3D,box:THREE.Box3}>}
 */
export async function createFbxViewer(url) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

  const loader = new FBXLoader();
  const object = await loader.loadAsync(url);

  // Center model at origin
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
  scene.add(object);
  box.setFromObject(object);

  frameCamera(camera, box);

  return { scene, camera, object, box };
}

/**
 * Position camera so that the entire bounding box fits in view.
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.Box3} box
 */
export function frameCamera(camera, box) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 1.5; // add some distance

  camera.position.set(center.x, center.y, cameraZ);
  camera.near = cameraZ / 100;
  camera.far = cameraZ * 100;
  camera.updateProjectionMatrix();
  camera.lookAt(center);
}
