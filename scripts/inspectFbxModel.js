#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

let THREE;
try {
  THREE = require('three');
} catch (err) {
  console.error('three package is required but not installed.');
  process.exit(1);
}

async function loadFbx(filePath) {
  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
  const loader = new FBXLoader();
  return await new Promise((resolve, reject) => {
    loader.load(filePath, resolve, undefined, reject);
  });
}

async function generateScreenshot(scene, box, size) {
  try {
    const { createCanvas } = require('canvas');
    const gl = require('gl')(512, 512);
    const renderer = new THREE.WebGLRenderer({ context: gl, canvas: createCanvas(512, 512) });
    renderer.setSize(512, 512);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(size.x * 2, size.y * 2, size.z * 2);
    camera.lookAt(box.getCenter(new THREE.Vector3()));
    renderer.render(scene, camera);
    const buffer = renderer.domElement.toBuffer('image/png');
    const outPath = path.join(process.cwd(), `fbx-${Date.now()}.png`);
    fs.writeFileSync(outPath, buffer);
    return outPath;
  } catch (err) {
    console.warn('Unable to create screenshot:', err.message);
    return null;
  }
}

async function analyzeWithAI(imagePath, meta) {
  let OpenAI;
  try {
    OpenAI = require('openai');
  } catch (err) {
    console.warn('openai package not installed; skipping AI analysis');
    return null;
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const b64 = fs.readFileSync(imagePath, { encoding: 'base64' });
  try {
    const resp = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: `Analyze the FBX model for anomalies. Metadata: ${JSON.stringify(meta)}` },
            { type: 'input_image', image_base64: b64 }
          ]
        }
      ]
    });
    return resp.output_text;
  } catch (err) {
    console.warn('AI request failed:', err.message);
    return null;
  }
}

async function inspect(filePath, opts) {
  const scene = await loadFbx(filePath);
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const meshes = [];
  const materials = new Set();
  scene.traverse(obj => {
    if (obj.isMesh) {
      meshes.push(obj);
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m.name && materials.add(m.name));
      }
    }
  });
  const result = {
    file: filePath,
    boundingBox: {
      min: box.min.toArray(),
      max: box.max.toArray(),
      size: size.toArray()
    },
    meshCount: meshes.length,
    materialNames: Array.from(materials),
    screenshot: null,
    aiAnalysis: null,
    status: meshes.length > 0 ? 'pass' : 'fail'
  };
  if (opts.screenshot) {
    result.screenshot = await generateScreenshot(scene, box, size);
    if (opts.analyze && result.screenshot) {
      result.aiAnalysis = await analyzeWithAI(result.screenshot, result);
    }
  }
  console.log(JSON.stringify(result, null, 2));
  return result;
}

const file = process.argv[2];
const args = process.argv.slice(3);
const opts = {
  screenshot: args.includes('--screenshot'),
  analyze: args.includes('--analyze')
};
if (!file) {
  console.error('Usage: node scripts/inspectFbxModel.js <file.fbx> [--screenshot] [--analyze]');
  process.exit(1);
}
inspect(file, opts).catch(err => {
  console.error('Failed to inspect FBX:', err);
  process.exit(1);
});
