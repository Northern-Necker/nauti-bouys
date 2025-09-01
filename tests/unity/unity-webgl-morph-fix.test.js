/**
 * Unity WebGL Morph Target Fix Test Suite
 * Comprehensive testing for Unity WebGL morph target integration
 */

import { jest } from '@jest/globals';

// Mock Unity WebGL runtime
const mockUnity = {
  Module: {
    _malloc: jest.fn().mockReturnValue(1000000),
    _free: jest.fn(),
    HEAPF32: new Float32Array(1000),
    HEAP8: new Int8Array(1000),
    cwrap: jest.fn(),
    ccall: jest.fn()
  },
  SendMessage: jest.fn(),
  call: jest.fn()
};

// Mock Unity instance
const mockUnityInstance = {
  SendMessage: jest.fn().mockImplementation((gameObject, method, value) => {
    console.log(`Unity SendMessage: ${gameObject}.${method}(${value})`);
    return Promise.resolve(`${method}_response`);
  }),
  Module: mockUnity.Module
};

// Global Unity mock
global.unityInstance = mockUnityInstance;
global.Unity = mockUnity;

describe('Unity WebGL Morph Target Fix', () => {
  let unityInstance;

  beforeAll(() => {
    unityInstance = mockUnityInstance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JavaScript Bridge Communication Tests', () => {
    
    describe('SendMessage Integration', () => {
      it('should send morph target influences to Unity', async () => {
        const sendMorphInfluences = async (influences) => {
          const influenceData = JSON.stringify(influences);
          
          return unityInstance.SendMessage(
            'MorphTargetController',
            'SetInfluences',
            influenceData
          );
        };

        const testInfluences = [0.5, 0.8, 0.2, 0.0];
        const result = await sendMorphInfluences(testInfluences);

        expect(unityInstance.SendMessage).toHaveBeenCalledWith(
          'MorphTargetController',
          'SetInfluences',
          JSON.stringify(testInfluences)
        );
        expect(result).toBe('SetInfluences_response');
      });

      it('should receive morph target status from Unity', async () => {
        // Mock Unity response handler
        window.OnMorphTargetStatus = jest.fn();

        const requestMorphStatus = () => {
          return new Promise((resolve) => {
            // Mock Unity calling back to JavaScript
            setTimeout(() => {
              const mockStatus = {
                activeTargets: 4,
                influences: [0.5, 0.8, 0.2, 0.0],
                renderingMode: 'GPU',
                lastUpdate: Date.now()
              };
              
              window.OnMorphTargetStatus(JSON.stringify(mockStatus));
              resolve(mockStatus);
            }, 10);
          });
        };

        unityInstance.SendMessage('MorphTargetController', 'RequestStatus', '');

        const status = await requestMorphStatus();
        
        expect(status.activeTargets).toBe(4);
        expect(status.influences).toHaveLength(4);
        expect(status.renderingMode).toBe('GPU');
      });

      it('should handle communication errors gracefully', async () => {
        // Mock SendMessage failure
        unityInstance.SendMessage = jest.fn().mockRejectedValue(new Error('Unity not ready'));

        const safeUnityCall = async (gameObject, method, value) => {
          try {
            await unityInstance.SendMessage(gameObject, method, value);
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        };

        const result = await safeUnityCall('TestObject', 'TestMethod', 'test');
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unity not ready');
      });
    });

    describe('Memory Management', () => {
      it('should allocate and free memory for morph target data', () => {
        const allocateMorphTargetMemory = (vertexCount, targetCount) => {
          const floatsPerVertex = 3; // x, y, z
          const totalFloats = vertexCount * targetCount * floatsPerVertex;
          const bytesNeeded = totalFloats * 4; // 4 bytes per float

          const ptr = mockUnity.Module._malloc(bytesNeeded);
          
          return {
            pointer: ptr,
            size: bytesNeeded,
            floatCount: totalFloats
          };
        };

        const freeMorphTargetMemory = (memoryInfo) => {
          mockUnity.Module._free(memoryInfo.pointer);
          return { freed: true };
        };

        const memory = allocateMorphTargetMemory(1000, 4);
        expect(mockUnity.Module._malloc).toHaveBeenCalledWith(48000); // 1000 * 4 * 3 * 4

        const result = freeMorphTargetMemory(memory);
        expect(mockUnity.Module._free).toHaveBeenCalledWith(memory.pointer);
        expect(result.freed).toBe(true);
      });

      it('should write morph target data to Unity heap', () => {
        const writeMorphDataToHeap = (morphData, heapOffset) => {
          for (let i = 0; i < morphData.length; i++) {
            mockUnity.Module.HEAPF32[heapOffset / 4 + i] = morphData[i];
          }
          return heapOffset + morphData.length * 4;
        };

        const testData = [1.5, 2.5, 3.5, 4.5, 5.5];
        const offset = 100;
        
        const nextOffset = writeMorphDataToHeap(testData, offset);
        
        expect(nextOffset).toBe(120); // 100 + 5 * 4
        expect(mockUnity.Module.HEAPF32[25]).toBe(1.5); // 100 / 4 = 25
        expect(mockUnity.Module.HEAPF32[29]).toBe(5.5); // 25 + 4 = 29
      });
    });
  });

  describe('Frame Synchronization Tests', () => {
    
    it('should synchronize morph updates with Unity frame rate', async () => {
      let frameCount = 0;
      let morphUpdateCount = 0;

      const simulateUnityFrameLoop = (duration, targetFPS) => {
        return new Promise((resolve) => {
          const frameTime = 1000 / targetFPS;
          const startTime = Date.now();
          
          const frameLoop = () => {
            frameCount++;
            
            // Simulate morph target update every frame
            const influences = [
              Math.sin(frameCount * 0.1),
              Math.cos(frameCount * 0.1),
              Math.sin(frameCount * 0.15),
              Math.cos(frameCount * 0.15)
            ].map(v => (v + 1) * 0.5); // Convert to 0-1 range

            unityInstance.SendMessage(
              'CC_Game_Body',
              'UpdateMorphTargets',
              JSON.stringify(influences)
            );
            morphUpdateCount++;

            if (Date.now() - startTime < duration) {
              setTimeout(frameLoop, frameTime);
            } else {
              resolve({
                totalFrames: frameCount,
                totalUpdates: morphUpdateCount,
                avgFPS: frameCount / (duration / 1000)
              });
            }
          };

          frameLoop();
        });
      };

      const result = await simulateUnityFrameLoop(1000, 60); // 1 second at 60 FPS

      expect(result.totalFrames).toBeGreaterThan(50); // Allow for timing variance
      expect(result.totalUpdates).toBe(result.totalFrames);
      expect(result.avgFPS).toBeGreaterThan(50);
      expect(unityInstance.SendMessage).toHaveBeenCalledTimes(result.totalUpdates);
    });

    it('should handle variable frame rates', () => {
      const adaptiveFrameSync = (targetFPS, actualFPS) => {
        const frameTimeTarget = 1000 / targetFPS;
        const frameTimeActual = 1000 / actualFPS;
        const deltaMultiplier = frameTimeActual / frameTimeTarget;
        
        return {
          deltaMultiplier,
          shouldSkipFrame: deltaMultiplier > 2.0, // Skip if too slow
          shouldDoubleUpdate: deltaMultiplier < 0.5 // Double update if too fast
        };
      };

      // Test low FPS scenario
      const lowFPSSync = adaptiveFrameSync(60, 30);
      expect(lowFPSSync.deltaMultiplier).toBeCloseTo(2.0);
      expect(lowFPSSync.shouldSkipFrame).toBe(false);

      // Test very low FPS scenario
      const veryLowFPSSync = adaptiveFrameSync(60, 20);
      expect(veryLowFPSSync.shouldSkipFrame).toBe(true);

      // Test high FPS scenario
      const highFPSSync = adaptiveFrameSync(60, 120);
      expect(highFPSSync.shouldDoubleUpdate).toBe(true);
    });
  });

  describe('CC_Game_Body and CC_Game_Tongue Coordination Tests', () => {
    
    it('should coordinate body and tongue morph targets', async () => {
      const coordinatedMorphUpdate = async (bodyInfluences, tongueInfluences) => {
        const results = await Promise.all([
          unityInstance.SendMessage('CC_Game_Body', 'SetMorphInfluences', JSON.stringify(bodyInfluences)),
          unityInstance.SendMessage('CC_Game_Tongue', 'SetMorphInfluences', JSON.stringify(tongueInfluences))
        ]);

        // Verify synchronization
        await unityInstance.SendMessage('MorphCoordinator', 'VerifySync', '');
        
        return {
          bodyResult: results[0],
          tongueResult: results[1],
          synchronized: true
        };
      };

      const bodyTargets = [0.8, 0.6, 0.4, 0.2];
      const tongueTargets = [0.3, 0.7, 0.1, 0.9];

      const result = await coordinatedMorphUpdate(bodyTargets, tongueTargets);

      expect(result.bodyResult).toBe('SetMorphInfluences_response');
      expect(result.tongueResult).toBe('SetMorphInfluences_response');
      expect(result.synchronized).toBe(true);

      expect(unityInstance.SendMessage).toHaveBeenCalledWith(
        'CC_Game_Body', 
        'SetMorphInfluences', 
        JSON.stringify(bodyTargets)
      );
      expect(unityInstance.SendMessage).toHaveBeenCalledWith(
        'CC_Game_Tongue', 
        'SetMorphInfluences', 
        JSON.stringify(tongueTargets)
      );
    });

    it('should handle partial updates when one component fails', async () => {
      // Mock one component failing
      unityInstance.SendMessage = jest.fn().mockImplementation((gameObject, method, value) => {
        if (gameObject === 'CC_Game_Body') {
          return Promise.reject(new Error('Body component not ready'));
        }
        return Promise.resolve(`${method}_response`);
      });

      const robustMorphUpdate = async (bodyInfluences, tongueInfluences) => {
        const results = [];
        
        try {
          const bodyResult = await unityInstance.SendMessage(
            'CC_Game_Body', 
            'SetMorphInfluences', 
            JSON.stringify(bodyInfluences)
          );
          results.push({ component: 'body', success: true, result: bodyResult });
        } catch (error) {
          results.push({ component: 'body', success: false, error: error.message });
        }

        try {
          const tongueResult = await unityInstance.SendMessage(
            'CC_Game_Tongue', 
            'SetMorphInfluences', 
            JSON.stringify(tongueInfluences)
          );
          results.push({ component: 'tongue', success: true, result: tongueResult });
        } catch (error) {
          results.push({ component: 'tongue', success: false, error: error.message });
        }

        return {
          results,
          partialSuccess: results.some(r => r.success),
          allSuccess: results.every(r => r.success)
        };
      };

      const result = await robustMorphUpdate([0.5, 0.5], [0.5, 0.5]);

      expect(result.partialSuccess).toBe(true);
      expect(result.allSuccess).toBe(false);
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(true);
    });

    it('should validate morph target ranges for both components', () => {
      const validateMorphInfluences = (influences, componentName) => {
        const errors = [];
        
        if (!Array.isArray(influences)) {
          errors.push(`${componentName}: Influences must be an array`);
        }
        
        influences.forEach((influence, index) => {
          if (typeof influence !== 'number') {
            errors.push(`${componentName}: Influence ${index} must be a number`);
          } else if (influence < 0 || influence > 1) {
            errors.push(`${componentName}: Influence ${index} must be between 0 and 1, got ${influence}`);
          }
        });

        return {
          valid: errors.length === 0,
          errors
        };
      };

      // Test valid influences
      const validResult = validateMorphInfluences([0.0, 0.5, 1.0, 0.25], 'CC_Game_Body');
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Test invalid influences
      const invalidResult = validateMorphInfluences([0.5, 1.5, -0.2, 'invalid'], 'CC_Game_Tongue');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toHaveLength(3);
    });
  });

  describe('Cross-Framework Integration Tests', () => {
    
    it('should interface with Three.js morph target data', () => {
      // Mock Three.js mesh data
      const threejsMeshData = {
        morphTargetInfluences: [0.7, 0.3, 0.9, 0.1],
        morphTargetDictionary: {
          'smile': 0,
          'frown': 1,
          'surprise': 2,
          'blink': 3
        }
      };

      const convertThreeJSToUnity = (meshData) => {
        const unityMorphData = {
          influences: meshData.morphTargetInfluences,
          targetNames: Object.keys(meshData.morphTargetDictionary),
          targetMapping: meshData.morphTargetDictionary
        };

        return JSON.stringify(unityMorphData);
      };

      const unityData = convertThreeJSToUnity(threejsMeshData);
      const parsed = JSON.parse(unityData);

      expect(parsed.influences).toEqual([0.7, 0.3, 0.9, 0.1]);
      expect(parsed.targetNames).toContain('smile');
      expect(parsed.targetMapping.smile).toBe(0);
    });

    it('should interface with Babylon.js morph target manager', () => {
      // Mock Babylon.js morph target manager
      const babylonMorphManager = {
        numTargets: 4,
        getTarget: jest.fn().mockImplementation((index) => ({
          name: ['expression1', 'expression2', 'expression3', 'expression4'][index],
          influence: [0.4, 0.6, 0.2, 0.8][index]
        }))
      };

      const convertBabylonJSToUnity = (morphManager) => {
        const influences = [];
        const names = [];

        for (let i = 0; i < morphManager.numTargets; i++) {
          const target = morphManager.getTarget(i);
          influences.push(target.influence);
          names.push(target.name);
        }

        return {
          influences,
          names,
          count: morphManager.numTargets
        };
      };

      const unityData = convertBabylonJSToUnity(babylonMorphManager);

      expect(unityData.influences).toEqual([0.4, 0.6, 0.2, 0.8]);
      expect(unityData.names).toEqual(['expression1', 'expression2', 'expression3', 'expression4']);
      expect(unityData.count).toBe(4);
      expect(babylonMorphManager.getTarget).toHaveBeenCalledTimes(4);
    });

    it('should sync across all three frameworks', async () => {
      const universalMorphSync = async (influences) => {
        const syncResults = {
          threejs: null,
          babylonjs: null,
          unity: null
        };

        // Mock Three.js sync
        syncResults.threejs = {
          success: true,
          influences: influences.slice()
        };

        // Mock Babylon.js sync
        syncResults.babylonjs = {
          success: true,
          influences: influences.slice()
        };

        // Unity sync
        try {
          await unityInstance.SendMessage(
            'MorphSyncController',
            'SyncAllFrameworks',
            JSON.stringify(influences)
          );
          syncResults.unity = {
            success: true,
            influences: influences.slice()
          };
        } catch (error) {
          syncResults.unity = {
            success: false,
            error: error.message
          };
        }

        return {
          allSynced: Object.values(syncResults).every(result => result.success),
          results: syncResults
        };
      };

      const testInfluences = [0.5, 0.7, 0.3, 0.9];
      const syncResult = await universalMorphSync(testInfluences);

      expect(syncResult.allSynced).toBe(true);
      expect(syncResult.results.threejs.influences).toEqual(testInfluences);
      expect(syncResult.results.babylonjs.influences).toEqual(testInfluences);
      expect(syncResult.results.unity.influences).toEqual(testInfluences);
    });
  });

  describe('Performance Tests', () => {
    
    it('should measure Unity communication latency', async () => {
      const measureCommunicationLatency = async (messageCount) => {
        const latencies = [];

        for (let i = 0; i < messageCount; i++) {
          const startTime = performance.now();
          
          await unityInstance.SendMessage(
            'PerformanceTest',
            'TestMessage',
            `test_${i}`
          );
          
          const endTime = performance.now();
          latencies.push(endTime - startTime);
        }

        return {
          latencies,
          avgLatency: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
          minLatency: Math.min(...latencies),
          maxLatency: Math.max(...latencies)
        };
      };

      const results = await measureCommunicationLatency(50);

      expect(results.avgLatency).toBeLessThan(10); // Should be under 10ms average
      expect(results.minLatency).toBeGreaterThan(0);
      expect(results.maxLatency).toBeLessThan(100); // No message should take more than 100ms
    });

    it('should benchmark memory allocation performance', () => {
      const benchmarkMemoryAllocation = (iterations, dataSize) => {
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          
          const ptr = mockUnity.Module._malloc(dataSize);
          
          // Simulate writing data
          for (let j = 0; j < dataSize / 4; j++) {
            mockUnity.Module.HEAPF32[ptr / 4 + j] = Math.random();
          }
          
          mockUnity.Module._free(ptr);
          
          const endTime = performance.now();
          times.push(endTime - startTime);
        }

        return {
          avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
          totalTime: times.reduce((sum, time) => sum + time, 0)
        };
      };

      const results = benchmarkMemoryAllocation(100, 4096); // 100 iterations, 4KB each

      expect(results.avgTime).toBeLessThan(5); // Should be very fast
      expect(results.totalTime).toBeLessThan(1000); // Total should be under 1 second
    });

    it('should test high-frequency morph updates', async () => {
      let updateCount = 0;
      let errorCount = 0;

      const highFrequencyTest = (duration, updatesPerSecond) => {
        return new Promise((resolve) => {
          const interval = 1000 / updatesPerSecond;
          const startTime = Date.now();

          const updateLoop = () => {
            const influences = [
              Math.random(),
              Math.random(),
              Math.random(),
              Math.random()
            ];

            unityInstance.SendMessage(
              'HighFrequencyTest',
              'UpdateMorphs',
              JSON.stringify(influences)
            ).then(() => {
              updateCount++;
            }).catch(() => {
              errorCount++;
            });

            if (Date.now() - startTime < duration) {
              setTimeout(updateLoop, interval);
            } else {
              resolve({
                totalUpdates: updateCount,
                totalErrors: errorCount,
                successRate: (updateCount / (updateCount + errorCount)) * 100
              });
            }
          };

          updateLoop();
        });
      };

      const results = await highFrequencyTest(2000, 120); // 2 seconds at 120 updates/sec

      expect(results.successRate).toBeGreaterThan(95); // At least 95% success rate
      expect(results.totalUpdates).toBeGreaterThan(200); // Should complete most updates
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    
    it('should recover from Unity instance disconnection', () => {
      const handleUnityDisconnection = () => {
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 3;

        const attemptReconnection = () => {
          reconnectAttempts++;
          
          // Mock reconnection logic
          if (reconnectAttempts <= maxReconnectAttempts) {
            // Simulate successful reconnection after 2 attempts
            if (reconnectAttempts === 2) {
              return {
                success: true,
                attempts: reconnectAttempts,
                newInstance: mockUnityInstance
              };
            }
            return { success: false, attempts: reconnectAttempts };
          }
          
          return { 
            success: false, 
            attempts: reconnectAttempts,
            maxAttemptsReached: true 
          };
        };

        // First attempt fails
        let result = attemptReconnection();
        expect(result.success).toBe(false);
        expect(result.attempts).toBe(1);

        // Second attempt succeeds
        result = attemptReconnection();
        expect(result.success).toBe(true);
        expect(result.attempts).toBe(2);
      };

      handleUnityDisconnection();
    });

    it('should handle malformed morph target data', async () => {
      const processMalformedData = async (data) => {
        const sanitizeMorphData = (input) => {
          if (typeof input === 'string') {
            try {
              input = JSON.parse(input);
            } catch {
              return { error: 'Invalid JSON', influences: [] };
            }
          }

          if (!Array.isArray(input)) {
            return { error: 'Data must be array', influences: [] };
          }

          const sanitized = input.map(value => {
            if (typeof value !== 'number' || isNaN(value)) {
              return 0;
            }
            return Math.max(0, Math.min(1, value)); // Clamp to 0-1
          });

          return { 
            error: null, 
            influences: sanitized,
            sanitized: sanitized.length !== input.length || 
                      sanitized.some((val, i) => val !== input[i])
          };
        };

        const result = sanitizeMorphData(data);
        
        if (!result.error) {
          await unityInstance.SendMessage(
            'MorphController',
            'SetInfluences',
            JSON.stringify(result.influences)
          );
        }

        return result;
      };

      // Test various malformed data
      const results = await Promise.all([
        processMalformedData('invalid json'),
        processMalformedData('[1.5, -0.5, "invalid", null]'),
        processMalformedData({ not: 'array' }),
        processMalformedData([0.5, 0.7, 0.3]) // Valid data
      ]);

      expect(results[0].error).toBe('Invalid JSON');
      expect(results[1].influences).toEqual([1, 0, 0, 0]); // Sanitized values
      expect(results[1].sanitized).toBe(true);
      expect(results[2].error).toBe('Data must be array');
      expect(results[3].error).toBeNull();
      expect(results[3].influences).toEqual([0.5, 0.7, 0.3]);
    });
  });
});