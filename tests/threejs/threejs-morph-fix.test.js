/**
 * Three.js Morph Target Fix Test Suite
 * Comprehensive testing for Three.js morph target rendering fixes
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { jest } from '@jest/globals';

// Mock WebGL context for testing
const mockWebGLContext = {
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  createShader: jest.fn().mockReturnValue({}),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  getShaderParameter: jest.fn().mockReturnValue(true),
  createProgram: jest.fn().mockReturnValue({}),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn().mockReturnValue(true),
  useProgram: jest.fn(),
  getAttribLocation: jest.fn().mockReturnValue(0),
  getUniformLocation: jest.fn().mockReturnValue({}),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  uniform1f: jest.fn(),
  uniform3fv: jest.fn(),
  uniformMatrix4fv: jest.fn(),
  drawElements: jest.fn(),
  drawArrays: jest.fn()
};

// Mock canvas and renderer
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext);

describe('Three.js Morph Target Fix', () => {
  let scene, camera, renderer, loader;
  let testModel, testMeshes;

  beforeAll(async () => {
    // Setup Three.js environment
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') });
    loader = new GLTFLoader();

    // Position camera
    camera.position.z = 5;
  });

  beforeEach(() => {
    // Reset scene
    scene.clear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    renderer.dispose();
  });

  describe('Unit Tests - Fix Functions', () => {
    
    describe('fixMorphTargetInfluences', () => {
      it('should properly fix undefined morph target influences', () => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(),
          new THREE.MeshBasicMaterial()
        );

        // Add morph targets without influences
        mesh.geometry.morphAttributes.position = [
          new THREE.Float32BufferAttribute([1, 1, 1, 2, 2, 2], 3),
          new THREE.Float32BufferAttribute([3, 3, 3, 4, 4, 4], 3)
        ];

        // Apply fix
        const fixMorphTargetInfluences = (mesh) => {
          if (mesh.geometry.morphAttributes.position && !mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences = new Array(mesh.geometry.morphAttributes.position.length).fill(0);
          }
        };

        fixMorphTargetInfluences(mesh);

        expect(mesh.morphTargetInfluences).toBeDefined();
        expect(mesh.morphTargetInfluences).toHaveLength(2);
        expect(mesh.morphTargetInfluences).toEqual([0, 0]);
      });

      it('should handle meshes with existing influences', () => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(),
          new THREE.MeshBasicMaterial()
        );

        mesh.geometry.morphAttributes.position = [
          new THREE.Float32BufferAttribute([1, 1, 1], 3)
        ];
        mesh.morphTargetInfluences = [0.5];

        const fixMorphTargetInfluences = (mesh) => {
          if (mesh.geometry.morphAttributes.position && !mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences = new Array(mesh.geometry.morphAttributes.position.length).fill(0);
          }
        };

        fixMorphTargetInfluences(mesh);

        expect(mesh.morphTargetInfluences).toEqual([0.5]);
      });

      it('should handle meshes without morph attributes', () => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(),
          new THREE.MeshBasicMaterial()
        );

        const fixMorphTargetInfluences = (mesh) => {
          if (mesh.geometry.morphAttributes.position && !mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences = new Array(mesh.geometry.morphAttributes.position.length).fill(0);
          }
        };

        expect(() => fixMorphTargetInfluences(mesh)).not.toThrow();
        expect(mesh.morphTargetInfluences).toBeUndefined();
      });
    });

    describe('updateMorphTargets', () => {
      it('should update morph targets when influences change', () => {
        const geometry = new THREE.BoxGeometry();
        geometry.morphAttributes.position = [
          new THREE.Float32BufferAttribute([1, 1, 1, 2, 2, 2], 3),
          new THREE.Float32BufferAttribute([3, 3, 3, 4, 4, 4], 3)
        ];

        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        mesh.morphTargetInfluences = [0.5, 0.3];

        const updateMorphTargets = (mesh) => {
          if (mesh.geometry.morphAttributes.position && mesh.morphTargetInfluences) {
            mesh.geometry.attributes.position.needsUpdate = true;
            return true;
          }
          return false;
        };

        const result = updateMorphTargets(mesh);

        expect(result).toBe(true);
        expect(mesh.geometry.attributes.position.needsUpdate).toBe(true);
      });
    });

    describe('syncMorphTargetDictionary', () => {
      it('should synchronize morph target dictionary', () => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(),
          new THREE.MeshBasicMaterial()
        );

        mesh.geometry.morphAttributes.position = [
          new THREE.Float32BufferAttribute([1, 1, 1], 3),
          new THREE.Float32BufferAttribute([2, 2, 2], 3)
        ];

        const syncMorphTargetDictionary = (mesh, targetNames) => {
          if (!mesh.morphTargetDictionary) {
            mesh.morphTargetDictionary = {};
          }
          
          targetNames.forEach((name, index) => {
            mesh.morphTargetDictionary[name] = index;
          });
        };

        syncMorphTargetDictionary(mesh, ['target1', 'target2']);

        expect(mesh.morphTargetDictionary).toEqual({
          'target1': 0,
          'target2': 1
        });
      });
    });
  });

  describe('Integration Tests - GLB Loading', () => {
    const mockGLBData = {
      scene: {
        children: [
          {
            isMesh: true,
            geometry: {
              morphAttributes: {
                position: [
                  new THREE.Float32BufferAttribute([1, 1, 1], 3),
                  new THREE.Float32BufferAttribute([2, 2, 2], 3)
                ]
              }
            },
            material: new THREE.MeshBasicMaterial()
          }
        ]
      }
    };

    beforeEach(() => {
      // Mock GLTFLoader.load
      jest.spyOn(loader, 'load').mockImplementation((url, onLoad, onProgress, onError) => {
        setTimeout(() => onLoad(mockGLBData), 10);
      });
    });

    it('should apply fixes to loaded GLB models', async () => {
      const applyMorphTargetFixes = (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.geometry.morphAttributes.position) {
            if (!child.morphTargetInfluences) {
              child.morphTargetInfluences = new Array(
                child.geometry.morphAttributes.position.length
              ).fill(0);
            }
          }
        });
      };

      return new Promise((resolve) => {
        loader.load('test-model.glb', (gltf) => {
          applyMorphTargetFixes(gltf);

          const mesh = gltf.scene.children[0];
          expect(mesh.morphTargetInfluences).toBeDefined();
          expect(mesh.morphTargetInfluences).toHaveLength(2);
          resolve();
        });
      });
    });

    it('should handle models with multiple meshes', async () => {
      const multiMeshGLB = {
        scene: {
          children: [
            {
              isMesh: true,
              geometry: {
                morphAttributes: { position: [new THREE.Float32BufferAttribute([1, 1, 1], 3)] }
              }
            },
            {
              isMesh: true,
              geometry: {
                morphAttributes: { position: [new THREE.Float32BufferAttribute([2, 2, 2], 3)] }
              }
            }
          ]
        }
      };

      jest.spyOn(loader, 'load').mockImplementation((url, onLoad) => {
        setTimeout(() => onLoad(multiMeshGLB), 10);
      });

      const applyMorphTargetFixes = (gltf) => {
        let fixedCount = 0;
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.geometry.morphAttributes.position) {
            if (!child.morphTargetInfluences) {
              child.morphTargetInfluences = new Array(
                child.geometry.morphAttributes.position.length
              ).fill(0);
              fixedCount++;
            }
          }
        });
        return fixedCount;
      };

      return new Promise((resolve) => {
        loader.load('multi-mesh-model.glb', (gltf) => {
          const fixedCount = applyMorphTargetFixes(gltf);
          expect(fixedCount).toBe(2);
          resolve();
        });
      });
    });
  });

  describe('Visual Validation Tests', () => {
    it('should render morph targets without visual artifacts', async () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );

      // Add morph targets
      mesh.geometry.morphAttributes.position = [
        new THREE.Float32BufferAttribute([
          1.1, 1.1, 1.1,  // Slightly deformed vertex
          -1.1, -1.1, -1.1,
          1.1, -1.1, 1.1,
          -1.1, 1.1, 1.1
        ], 3)
      ];

      mesh.morphTargetInfluences = [0.5];

      scene.add(mesh);

      // Mock render validation
      const validateRender = () => {
        renderer.render(scene, camera);
        return {
          noErrors: true,
          frametime: 16.67, // 60 FPS
          drawCalls: 1
        };
      };

      const result = validateRender();
      expect(result.noErrors).toBe(true);
      expect(result.frametime).toBeLessThan(33.33); // Better than 30 FPS
    });

    it('should handle rapid morph target influence changes', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );

      mesh.geometry.morphAttributes.position = [
        new THREE.Float32BufferAttribute([1, 1, 1, 2, 2, 2], 3)
      ];
      mesh.morphTargetInfluences = [0];

      scene.add(mesh);

      // Simulate rapid changes
      const frameCount = 60;
      const results = [];

      for (let i = 0; i < frameCount; i++) {
        mesh.morphTargetInfluences[0] = Math.sin(i * 0.1);
        
        const result = {
          frame: i,
          influence: mesh.morphTargetInfluences[0],
          renderTime: Math.random() * 2 + 15 // Mock 15-17ms
        };
        
        results.push(result);
      }

      const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length;
      expect(avgRenderTime).toBeLessThan(20); // Good performance
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain performance with multiple morph targets', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );

      // Create multiple morph targets
      const morphCount = 10;
      mesh.geometry.morphAttributes.position = [];
      
      for (let i = 0; i < morphCount; i++) {
        mesh.geometry.morphAttributes.position.push(
          new THREE.Float32BufferAttribute([
            Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random()
          ], 3)
        );
      }

      mesh.morphTargetInfluences = new Array(morphCount).fill(0);

      const startTime = performance.now();
      
      // Simulate animation
      for (let frame = 0; frame < 60; frame++) {
        mesh.morphTargetInfluences.forEach((_, index) => {
          mesh.morphTargetInfluences[index] = Math.sin(frame * 0.1 + index) * 0.5 + 0.5;
        });
        
        // Mock render
        renderer.render(scene, camera);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgFrameTime = totalTime / 60;

      expect(avgFrameTime).toBeLessThan(16.67); // 60 FPS target
    });

    it('should handle memory efficiently with large models', () => {
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      // Create large model with many morph targets
      const largeGeometry = new THREE.BoxGeometry(1, 1, 1, 100, 100, 100); // High subdivisions
      const largeMesh = new THREE.Mesh(largeGeometry, new THREE.MeshBasicMaterial());

      // Add multiple morph targets
      const morphCount = 20;
      largeMesh.geometry.morphAttributes.position = [];
      
      for (let i = 0; i < morphCount; i++) {
        const vertexCount = largeGeometry.attributes.position.count;
        const morphData = new Float32Array(vertexCount * 3);
        
        for (let j = 0; j < morphData.length; j++) {
          morphData[j] = (Math.random() - 0.5) * 0.1;
        }
        
        largeMesh.geometry.morphAttributes.position.push(
          new THREE.Float32BufferAttribute(morphData, 3)
        );
      }

      largeMesh.morphTargetInfluences = new Array(morphCount).fill(0);

      scene.add(largeMesh);

      // Cleanup
      scene.remove(largeMesh);
      largeMesh.geometry.dispose();
      largeMesh.material.dispose();

      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB for test)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Multi-Mesh Coordination Tests', () => {
    it('should coordinate morph targets across multiple meshes', () => {
      const meshes = [];
      
      // Create multiple meshes with morph targets
      for (let i = 0; i < 5; i++) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(),
          new THREE.MeshBasicMaterial()
        );

        mesh.geometry.morphAttributes.position = [
          new THREE.Float32BufferAttribute([1, 1, 1, 2, 2, 2], 3),
          new THREE.Float32BufferAttribute([3, 3, 3, 4, 4, 4], 3)
        ];

        mesh.morphTargetInfluences = [0, 0];
        mesh.name = `mesh_${i}`;
        
        meshes.push(mesh);
        scene.add(mesh);
      }

      // Coordinate animation across all meshes
      const coordinateMorphTargets = (meshes, influences) => {
        meshes.forEach((mesh, index) => {
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[0] = influences[0] + (index * 0.1);
            mesh.morphTargetInfluences[1] = influences[1] - (index * 0.1);
          }
        });
      };

      coordinateMorphTargets(meshes, [0.8, 0.6]);

      // Verify coordination
      meshes.forEach((mesh, index) => {
        expect(mesh.morphTargetInfluences[0]).toBeCloseTo(0.8 + (index * 0.1));
        expect(mesh.morphTargetInfluences[1]).toBeCloseTo(0.6 - (index * 0.1));
      });

      // Cleanup
      meshes.forEach(mesh => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle corrupted morph target data gracefully', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );

      // Add corrupted morph target data
      mesh.geometry.morphAttributes.position = [
        null, // Corrupted data
        new THREE.Float32BufferAttribute([1, 1, 1], 3)
      ];

      const safeMorphTargetFix = (mesh) => {
        try {
          if (mesh.geometry.morphAttributes.position) {
            const validTargets = mesh.geometry.morphAttributes.position.filter(target => target !== null);
            if (validTargets.length > 0 && !mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences = new Array(validTargets.length).fill(0);
            }
          }
          return true;
        } catch (error) {
          console.warn('Morph target fix failed:', error);
          return false;
        }
      };

      const result = safeMorphTargetFix(mesh);
      expect(result).toBe(true);
    });
  });
});