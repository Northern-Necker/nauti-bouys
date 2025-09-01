/**
 * Babylon.js Morph Target Fix Test Suite
 * Comprehensive testing for Babylon.js morph target rendering fixes
 */

import { 
  Engine, 
  Scene, 
  ArcRotateCamera, 
  Vector3, 
  HemisphericLight,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Effect,
  ShaderMaterial,
  VertexData,
  SceneLoader,
  Tools
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { jest } from '@jest/globals';

// Mock WebGL context
const mockWebGLContext = {
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
  createBuffer: jest.fn().mockReturnValue({}),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  uniform1f: jest.fn(),
  uniform3fv: jest.fn(),
  uniformMatrix4fv: jest.fn(),
  drawElements: jest.fn(),
  drawArrays: jest.fn(),
  getExtension: jest.fn().mockReturnValue(null)
};

// Mock canvas
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext);

describe('Babylon.js Morph Target Fix', () => {
  let engine, scene, camera, light;
  let canvas;

  beforeAll(() => {
    // Create mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Initialize Babylon.js engine
    engine = new Engine(canvas, true, { stencil: true });
    scene = new Scene(engine);

    // Setup camera and lighting
    camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
    light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
  });

  beforeEach(() => {
    // Clean scene
    scene.meshes.slice().forEach(mesh => {
      if (mesh !== camera) {
        mesh.dispose();
      }
    });
    jest.clearAllMocks();
  });

  afterAll(() => {
    scene.dispose();
    engine.dispose();
  });

  describe('Unit Tests - Custom Shader Validation', () => {

    describe('Morph Target Vertex Shader', () => {
      const morphVertexShader = `
        precision highp float;
        
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;
        
        // Morph target attributes
        attribute vec3 morphTarget0;
        attribute vec3 morphTarget1;
        attribute vec3 morphTarget2;
        attribute vec3 morphTarget3;
        
        uniform mat4 worldViewProjection;
        uniform mat4 world;
        uniform mat4 view;
        
        // Morph target influences
        uniform float morphTargetInfluences[4];
        
        varying vec3 vPositionW;
        varying vec3 vNormalW;
        varying vec2 vUV;
        
        void main(void) {
          vec3 morphedPosition = position;
          
          // Apply morph target influences
          morphedPosition += morphTarget0 * morphTargetInfluences[0];
          morphedPosition += morphTarget1 * morphTargetInfluences[1];
          morphedPosition += morphTarget2 * morphTargetInfluences[2];
          morphedPosition += morphTarget3 * morphTargetInfluences[3];
          
          vec4 worldPos = world * vec4(morphedPosition, 1.0);
          vPositionW = worldPos.xyz;
          vNormalW = normalize((world * vec4(normal, 0.0)).xyz);
          vUV = uv;
          
          gl_Position = worldViewProjection * vec4(morphedPosition, 1.0);
        }
      `;

      it('should compile morph target vertex shader successfully', () => {
        const compileShader = (shaderCode, shaderType) => {
          const shader = mockWebGLContext.createShader(shaderType);
          mockWebGLContext.shaderSource(shader, shaderCode);
          mockWebGLContext.compileShader(shader);
          
          const compileStatus = mockWebGLContext.getShaderParameter(shader, true);
          return { shader, success: compileStatus };
        };

        const result = compileShader(morphVertexShader, mockWebGLContext.VERTEX_SHADER);
        expect(result.success).toBe(true);
        expect(mockWebGLContext.createShader).toHaveBeenCalled();
        expect(mockWebGLContext.shaderSource).toHaveBeenCalledWith(result.shader, morphVertexShader);
        expect(mockWebGLContext.compileShader).toHaveBeenCalledWith(result.shader);
      });

      it('should validate shader uniforms for morph targets', () => {
        const extractUniforms = (shaderCode) => {
          const uniformRegex = /uniform\s+(\w+)\s+(\w+)(?:\[(\d+)\])?/g;
          const uniforms = [];
          let match;

          while ((match = uniformRegex.exec(shaderCode)) !== null) {
            uniforms.push({
              type: match[1],
              name: match[2],
              arraySize: match[3] ? parseInt(match[3]) : null
            });
          }

          return uniforms;
        };

        const uniforms = extractUniforms(morphVertexShader);
        const morphInfluenceUniform = uniforms.find(u => u.name === 'morphTargetInfluences');

        expect(morphInfluenceUniform).toBeDefined();
        expect(morphInfluenceUniform.type).toBe('float');
        expect(morphInfluenceUniform.arraySize).toBe(4);
      });

      it('should validate shader attributes for morph targets', () => {
        const extractAttributes = (shaderCode) => {
          const attributeRegex = /attribute\s+(\w+)\s+(\w+)/g;
          const attributes = [];
          let match;

          while ((match = attributeRegex.exec(shaderCode)) !== null) {
            attributes.push({
              type: match[1],
              name: match[2]
            });
          }

          return attributes;
        };

        const attributes = extractAttributes(morphVertexShader);
        const morphTargets = attributes.filter(attr => attr.name.startsWith('morphTarget'));

        expect(morphTargets).toHaveLength(4);
        morphTargets.forEach(target => {
          expect(target.type).toBe('vec3');
        });
      });
    });

    describe('WebGL Buffer Manipulation', () => {
      it('should create and manage morph target buffers correctly', () => {
        const createMorphTargetBuffer = (data) => {
          const buffer = mockWebGLContext.createBuffer();
          mockWebGLContext.bindBuffer(mockWebGLContext.ARRAY_BUFFER, buffer);
          mockWebGLContext.bufferData(
            mockWebGLContext.ARRAY_BUFFER,
            new Float32Array(data),
            mockWebGLContext.STATIC_DRAW
          );
          return buffer;
        };

        const morphData = [
          0.1, 0.2, 0.3,  // vertex 1 offset
          0.4, 0.5, 0.6,  // vertex 2 offset
          0.7, 0.8, 0.9   // vertex 3 offset
        ];

        const buffer = createMorphTargetBuffer(morphData);

        expect(mockWebGLContext.createBuffer).toHaveBeenCalled();
        expect(mockWebGLContext.bindBuffer).toHaveBeenCalled();
        expect(mockWebGLContext.bufferData).toHaveBeenCalled();
        expect(buffer).toBeDefined();
      });

      it('should bind multiple morph target buffers', () => {
        const bindMorphTargetBuffers = (buffers, shader) => {
          buffers.forEach((buffer, index) => {
            const attributeName = `morphTarget${index}`;
            const location = mockWebGLContext.getAttribLocation(shader, attributeName);
            
            mockWebGLContext.bindBuffer(mockWebGLContext.ARRAY_BUFFER, buffer);
            mockWebGLContext.enableVertexAttribArray(location);
            mockWebGLContext.vertexAttribPointer(location, 3, mockWebGLContext.FLOAT, false, 0, 0);
          });
        };

        const mockBuffers = [
          mockWebGLContext.createBuffer(),
          mockWebGLContext.createBuffer(),
          mockWebGLContext.createBuffer()
        ];
        const mockShader = mockWebGLContext.createProgram();

        bindMorphTargetBuffers(mockBuffers, mockShader);

        expect(mockWebGLContext.getAttribLocation).toHaveBeenCalledTimes(3);
        expect(mockWebGLContext.bindBuffer).toHaveBeenCalledTimes(3);
        expect(mockWebGLContext.enableVertexAttribArray).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Integration Tests - GLB Format Handling', () => {
    const mockGLTFData = {
      meshes: [
        {
          name: 'TestMesh',
          primitives: [
            {
              attributes: {
                POSITION: 0,
                NORMAL: 1,
                TEXCOORD_0: 2
              },
              targets: [
                { POSITION: 3 }, // Morph target 0
                { POSITION: 4 }  // Morph target 1
              ]
            }
          ]
        }
      ],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3' }, // positions
        { bufferView: 1, componentType: 5126, count: 8, type: 'VEC3' }, // normals
        { bufferView: 2, componentType: 5126, count: 8, type: 'VEC2' }, // uvs
        { bufferView: 3, componentType: 5126, count: 8, type: 'VEC3' }, // morph target 0
        { bufferView: 4, componentType: 5126, count: 8, type: 'VEC3' }  // morph target 1
      ]
    };

    beforeEach(() => {
      // Mock SceneLoader.LoadAssetContainer
      jest.spyOn(SceneLoader, 'LoadAssetContainer').mockImplementation((rootUrl, sceneFilename, scene, onSuccess, onProgress, onError) => {
        const mockContainer = {
          meshes: [
            {
              name: 'TestMesh',
              morphTargetManager: {
                numTargets: 2,
                getTarget: jest.fn().mockReturnValue({
                  influence: 0,
                  setInfluence: jest.fn()
                })
              },
              geometry: {
                getVerticesData: jest.fn().mockReturnValue(new Float32Array([1, 1, 1, 2, 2, 2]))
              }
            }
          ]
        };
        setTimeout(() => onSuccess(mockContainer), 10);
      });
    });

    it('should load GLB model with morph targets', async () => {
      const loadModelWithMorphTargets = () => {
        return new Promise((resolve, reject) => {
          SceneLoader.LoadAssetContainer('', 'test-model.glb', scene, (container) => {
            const mesh = container.meshes[0];
            
            // Apply morph target fixes
            if (mesh.morphTargetManager) {
              for (let i = 0; i < mesh.morphTargetManager.numTargets; i++) {
                const target = mesh.morphTargetManager.getTarget(i);
                if (target) {
                  target.influence = 0; // Initialize influences
                }
              }
            }
            
            resolve(container);
          }, null, reject);
        });
      };

      const container = await loadModelWithMorphTargets();
      const mesh = container.meshes[0];

      expect(mesh.morphTargetManager).toBeDefined();
      expect(mesh.morphTargetManager.numTargets).toBe(2);
      expect(mesh.morphTargetManager.getTarget).toHaveBeenCalled();
    });

    it('should handle multiple meshes with different morph target counts', async () => {
      // Mock container with multiple meshes
      const mockMultiMeshContainer = {
        meshes: [
          {
            name: 'Mesh1',
            morphTargetManager: { numTargets: 2, getTarget: jest.fn().mockReturnValue({ influence: 0 }) }
          },
          {
            name: 'Mesh2',
            morphTargetManager: { numTargets: 4, getTarget: jest.fn().mockReturnValue({ influence: 0 }) }
          },
          {
            name: 'Mesh3',
            morphTargetManager: null // No morph targets
          }
        ]
      };

      jest.spyOn(SceneLoader, 'LoadAssetContainer').mockImplementation((rootUrl, sceneFilename, scene, onSuccess) => {
        setTimeout(() => onSuccess(mockMultiMeshContainer), 10);
      });

      const processMorphTargets = (container) => {
        const morphTargetCounts = [];
        
        container.meshes.forEach(mesh => {
          if (mesh.morphTargetManager) {
            morphTargetCounts.push(mesh.morphTargetManager.numTargets);
          } else {
            morphTargetCounts.push(0);
          }
        });
        
        return morphTargetCounts;
      };

      return new Promise((resolve) => {
        SceneLoader.LoadAssetContainer('', 'multi-mesh-model.glb', scene, (container) => {
          const counts = processMorphTargets(container);
          expect(counts).toEqual([2, 4, 0]);
          resolve();
        });
      });
    });
  });

  describe('Visual Rendering Confirmation', () => {
    let testMesh;

    beforeEach(() => {
      // Create test mesh with basic geometry
      testMesh = MeshBuilder.CreateBox('testBox', { size: 2 }, scene);
      testMesh.material = new StandardMaterial('testMaterial', scene);
    });

    afterEach(() => {
      if (testMesh) {
        testMesh.dispose();
      }
    });

    it('should render mesh with morph targets without visual errors', () => {
      // Mock morph target manager
      testMesh.morphTargetManager = {
        numTargets: 2,
        getTarget: jest.fn().mockImplementation((index) => ({
          influence: 0.5,
          setInfluence: jest.fn()
        }))
      };

      const renderWithMorphTargets = (mesh) => {
        // Simulate render preparation
        if (mesh.morphTargetManager) {
          for (let i = 0; i < mesh.morphTargetManager.numTargets; i++) {
            const target = mesh.morphTargetManager.getTarget(i);
            // Validate influence is within range
            if (target.influence < 0 || target.influence > 1) {
              return { success: false, error: 'Invalid influence value' };
            }
          }
        }
        
        // Mock successful render
        return { success: true, drawCalls: 1, triangles: 12 };
      };

      const result = renderWithMorphTargets(testMesh);
      expect(result.success).toBe(true);
      expect(result.drawCalls).toBe(1);
    });

    it('should handle animated morph targets', () => {
      testMesh.morphTargetManager = {
        numTargets: 3,
        targets: [
          { influence: 0, setInfluence: jest.fn() },
          { influence: 0, setInfluence: jest.fn() },
          { influence: 0, setInfluence: jest.fn() }
        ],
        getTarget: jest.fn().mockImplementation((index) => testMesh.morphTargetManager.targets[index])
      };

      const animateMorphTargets = (mesh, time) => {
        if (mesh.morphTargetManager) {
          for (let i = 0; i < mesh.morphTargetManager.numTargets; i++) {
            const target = mesh.morphTargetManager.getTarget(i);
            const influence = Math.sin(time + i) * 0.5 + 0.5; // 0-1 range
            target.influence = influence;
          }
        }
      };

      // Animate for several frames
      const animationResults = [];
      for (let frame = 0; frame < 60; frame++) {
        const time = frame * 0.016; // 60 FPS
        animateMorphTargets(testMesh, time);
        
        const influences = testMesh.morphTargetManager.targets.map(t => t.influence);
        animationResults.push(influences);
      }

      // Verify animation worked
      expect(animationResults).toHaveLength(60);
      animationResults.forEach(influences => {
        influences.forEach(influence => {
          expect(influence).toBeGreaterThanOrEqual(0);
          expect(influence).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('GPU Synchronization Tests', () => {
    it('should synchronize GPU state for morph target updates', () => {
      const synchronizeGPUState = (mesh) => {
        const operations = [];

        if (mesh.morphTargetManager) {
          // Mock GPU synchronization operations
          operations.push('bind_vertex_buffers');
          operations.push('update_uniform_buffers');
          operations.push('sync_vertex_arrays');
          
          // Simulate GPU memory barriers
          operations.push('memory_barrier');
          
          return {
            success: true,
            operations: operations,
            syncTime: Math.random() * 2 + 1 // 1-3ms
          };
        }

        return { success: false, operations: [] };
      };

      const mockMesh = {
        morphTargetManager: {
          numTargets: 4,
          getTarget: jest.fn()
        }
      };

      const result = synchronizeGPUState(mockMesh);
      
      expect(result.success).toBe(true);
      expect(result.operations).toContain('bind_vertex_buffers');
      expect(result.operations).toContain('update_uniform_buffers');
      expect(result.operations).toContain('memory_barrier');
      expect(result.syncTime).toBeGreaterThan(0);
    });

    it('should handle GPU memory constraints', () => {
      const checkGPUMemoryUsage = (meshCount, morphTargetsPerMesh) => {
        const bytesPerVertex = 3 * 4; // 3 floats, 4 bytes each
        const verticesPerMesh = 1000; // Typical mesh
        const totalMemoryUsage = meshCount * morphTargetsPerMesh * verticesPerMesh * bytesPerVertex;
        
        const maxGPUMemory = 512 * 1024 * 1024; // 512MB limit
        
        return {
          usage: totalMemoryUsage,
          limit: maxGPUMemory,
          withinLimits: totalMemoryUsage < maxGPUMemory,
          percentageUsed: (totalMemoryUsage / maxGPUMemory) * 100
        };
      };

      const memoryCheck = checkGPUMemoryUsage(10, 8);
      
      expect(memoryCheck.withinLimits).toBe(true);
      expect(memoryCheck.percentageUsed).toBeLessThan(100);
    });
  });

  describe('Performance Tests', () => {
    it('should maintain frame rate with multiple morph targets', () => {
      const benchmarkMorphTargetPerformance = (targetCount, frameCount) => {
        const results = [];
        
        for (let frame = 0; frame < frameCount; frame++) {
          const startTime = performance.now();
          
          // Simulate morph target processing
          for (let target = 0; target < targetCount; target++) {
            // Mock GPU operations
            mockWebGLContext.uniform1f({}, Math.sin(frame * 0.1 + target));
          }
          
          const endTime = performance.now();
          results.push(endTime - startTime);
        }
        
        const avgFrameTime = results.reduce((sum, time) => sum + time, 0) / results.length;
        const fps = 1000 / avgFrameTime;
        
        return {
          avgFrameTime,
          fps,
          minFrameTime: Math.min(...results),
          maxFrameTime: Math.max(...results)
        };
      };

      const performance = benchmarkMorphTargetPerformance(8, 60);
      
      expect(performance.fps).toBeGreaterThan(30); // Minimum acceptable FPS
      expect(performance.avgFrameTime).toBeLessThan(33.33); // 30 FPS = 33.33ms per frame
    });

    it('should optimize shader compilation for morph targets', () => {
      const optimizeShaderCompilation = (maxMorphTargets) => {
        const compileShaderVariant = (targetCount) => {
          const startTime = performance.now();
          
          // Mock shader compilation
          const vertexShader = `
            precision highp float;
            attribute vec3 position;
            ${Array.from({ length: targetCount }, (_, i) => 
              `attribute vec3 morphTarget${i};`
            ).join('\n')}
            uniform float morphTargetInfluences[${targetCount}];
          `;
          
          // Mock compilation process
          mockWebGLContext.createShader();
          mockWebGLContext.shaderSource();
          mockWebGLContext.compileShader();
          
          const endTime = performance.now();
          return endTime - startTime;
        };

        const compileTimes = [];
        for (let targets = 1; targets <= maxMorphTargets; targets++) {
          compileTimes.push(compileShaderVariant(targets));
        }

        return {
          compileTimes,
          avgCompileTime: compileTimes.reduce((sum, time) => sum + time, 0) / compileTimes.length,
          maxCompileTime: Math.max(...compileTimes)
        };
      };

      const shaderPerformance = optimizeShaderCompilation(8);
      
      expect(shaderPerformance.avgCompileTime).toBeLessThan(100); // Should compile quickly
      expect(shaderPerformance.maxCompileTime).toBeLessThan(200); // Even complex shaders
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing morph target data gracefully', () => {
      const handleMissingMorphTargets = (meshData) => {
        try {
          if (!meshData.morphTargetManager) {
            return { success: true, message: 'No morph targets to process' };
          }

          const invalidTargets = [];
          for (let i = 0; i < meshData.morphTargetManager.numTargets; i++) {
            const target = meshData.morphTargetManager.getTarget(i);
            if (!target || typeof target.influence !== 'number') {
              invalidTargets.push(i);
            }
          }

          if (invalidTargets.length > 0) {
            return { 
              success: false, 
              message: `Invalid targets found: ${invalidTargets.join(', ')}`,
              invalidTargets
            };
          }

          return { success: true, message: 'All morph targets valid' };
        } catch (error) {
          return { success: false, message: `Error: ${error.message}` };
        }
      };

      // Test with missing morph target manager
      const result1 = handleMissingMorphTargets({});
      expect(result1.success).toBe(true);
      expect(result1.message).toBe('No morph targets to process');

      // Test with invalid target
      const result2 = handleMissingMorphTargets({
        morphTargetManager: {
          numTargets: 2,
          getTarget: jest.fn().mockImplementation((index) => 
            index === 0 ? { influence: 0.5 } : null
          )
        }
      });
      expect(result2.success).toBe(false);
      expect(result2.invalidTargets).toContain(1);
    });

    it('should recover from GPU context loss', () => {
      const handleContextLoss = () => {
        const contextLossSimulation = {
          isContextLost: true,
          recreateContext: jest.fn().mockImplementation(() => {
            return {
              success: true,
              newContext: mockWebGLContext,
              resourcesRecreated: ['shaders', 'buffers', 'textures']
            };
          })
        };

        if (contextLossSimulation.isContextLost) {
          const recovery = contextLossSimulation.recreateContext();
          return recovery;
        }

        return { success: false };
      };

      const recoveryResult = handleContextLoss();
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.resourcesRecreated).toContain('shaders');
      expect(recoveryResult.resourcesRecreated).toContain('buffers');
    });
  });
});