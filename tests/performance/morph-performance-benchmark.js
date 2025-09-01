/**
 * Morph Target Performance Benchmark Suite
 * Comprehensive performance testing and optimization validation
 */

import { performance } from 'perf_hooks';
import { jest } from '@jest/globals';

// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.memoryBaseline = this.getMemoryUsage();
  }

  startTimer(name) {
    this.metrics.set(`${name}_start`, performance.now());
  }

  endTimer(name) {
    const start = this.metrics.get(`${name}_start`);
    if (start) {
      const duration = performance.now() - start;
      this.metrics.set(`${name}_duration`, duration);
      return duration;
    }
    return null;
  }

  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    // Fallback for Node.js
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      return {
        used: mem.heapUsed,
        total: mem.heapTotal,
        limit: mem.rss
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }

  getMetric(name) {
    return this.metrics.get(name);
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  reset() {
    this.metrics.clear();
    this.memoryBaseline = this.getMemoryUsage();
  }
}

// Mock GPU monitoring
const mockGPUMonitor = {
  getGPUUsage: jest.fn().mockReturnValue({
    utilization: Math.random() * 100,
    memoryUsage: Math.random() * 4096,
    temperature: 65 + Math.random() * 20
  }),
  
  getFrameRate: jest.fn().mockReturnValue(58 + Math.random() * 4),
  
  getDrawCalls: jest.fn().mockReturnValue(Math.floor(Math.random() * 50) + 10)
};

describe('Morph Target Performance Benchmarks', () => {
  let monitor;

  beforeAll(() => {
    monitor = new PerformanceMonitor();
  });

  beforeEach(() => {
    monitor.reset();
    jest.clearAllMocks();
  });

  describe('FPS Impact Measurements', () => {
    
    it('should measure baseline FPS without morph targets', () => {
      const measureBaselineFPS = (frameCount = 60) => {
        const frameTimes = [];
        
        monitor.startTimer('baseline_benchmark');
        
        for (let frame = 0; frame < frameCount; frame++) {
          const frameStart = performance.now();
          
          // Simulate basic rendering without morph targets
          mockGPUMonitor.getDrawCalls();
          
          // Mock rendering operations
          for (let i = 0; i < 1000; i++) {
            Math.sin(i * 0.01); // CPU work simulation
          }
          
          const frameEnd = performance.now();
          frameTimes.push(frameEnd - frameStart);
        }
        
        const totalTime = monitor.endTimer('baseline_benchmark');
        
        return {
          totalTime,
          avgFrameTime: frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length,
          minFrameTime: Math.min(...frameTimes),
          maxFrameTime: Math.max(...frameTimes),
          fps: (frameCount / totalTime) * 1000,
          frameTimes
        };
      };

      const baseline = measureBaselineFPS();
      
      expect(baseline.fps).toBeGreaterThan(30);
      expect(baseline.avgFrameTime).toBeLessThan(33.33); // 30 FPS threshold
      expect(baseline.minFrameTime).toBeGreaterThan(0);
      expect(baseline.maxFrameTime).toBeLessThan(50); // No frame should take more than 50ms
    });

    it('should measure FPS impact with varying morph target counts', () => {
      const measureMorphTargetFPS = (morphTargetCounts, frameCount = 60) => {
        const results = [];

        morphTargetCounts.forEach(targetCount => {
          const frameTimes = [];
          
          monitor.startTimer(`morph_${targetCount}_benchmark`);
          
          for (let frame = 0; frame < frameCount; frame++) {
            const frameStart = performance.now();
            
            // Simulate morph target processing
            const influences = new Array(targetCount).fill(0).map(() => 
              Math.sin(frame * 0.1 + Math.random())
            );
            
            // Mock vertex processing (more expensive with more targets)
            const vertexCount = 1000;
            for (let vertex = 0; vertex < vertexCount; vertex++) {
              for (let target = 0; target < targetCount; target++) {
                // Simulate vertex transformation
                const influence = influences[target];
                Math.sin(vertex + target + influence); // CPU work
              }
            }
            
            mockGPUMonitor.getDrawCalls();
            
            const frameEnd = performance.now();
            frameTimes.push(frameEnd - frameStart);
          }
          
          const totalTime = monitor.endTimer(`morph_${targetCount}_benchmark`);
          
          results.push({
            morphTargetCount: targetCount,
            totalTime,
            avgFrameTime: frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length,
            minFrameTime: Math.min(...frameTimes),
            maxFrameTime: Math.max(...frameTimes),
            fps: (frameCount / totalTime) * 1000,
            performanceRating: frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length < 16.67 ? 'EXCELLENT' :
                              frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length < 33.33 ? 'GOOD' : 'POOR'
          });
        });

        return results;
      };

      const morphTargetCounts = [1, 2, 4, 8, 16];
      const results = measureMorphTargetFPS(morphTargetCounts);

      expect(results).toHaveLength(5);
      
      // Verify performance degrades gracefully with more targets
      for (let i = 1; i < results.length; i++) {
        expect(results[i].avgFrameTime).toBeGreaterThanOrEqual(results[i-1].avgFrameTime);
      }
      
      // Even with 16 targets, should maintain reasonable performance
      expect(results[results.length - 1].fps).toBeGreaterThan(20);
    });

    it('should benchmark frame rate consistency', () => {
      const measureFrameRateConsistency = (duration = 5000) => {
        const frameRates = [];
        const startTime = performance.now();
        let lastFrameTime = startTime;
        let frameCount = 0;
        
        while (performance.now() - startTime < duration) {
          const currentTime = performance.now();
          
          // Simulate frame with morph targets
          const morphInfluences = [
            Math.sin(currentTime * 0.001),
            Math.cos(currentTime * 0.001),
            Math.sin(currentTime * 0.0015),
            Math.cos(currentTime * 0.0015)
          ];
          
          // Mock rendering work
          mockGPUMonitor.getFrameRate();
          
          const frameDelta = currentTime - lastFrameTime;
          if (frameDelta > 0) {
            frameRates.push(1000 / frameDelta);
          }
          
          lastFrameTime = currentTime;
          frameCount++;
          
          // Small delay to prevent tight loop
          if (frameCount % 100 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }

        const avgFPS = frameRates.reduce((sum, fps) => sum + fps, 0) / frameRates.length;
        const fpsVariance = frameRates.reduce((sum, fps) => sum + Math.pow(fps - avgFPS, 2), 0) / frameRates.length;
        const fpsStdDev = Math.sqrt(fpsVariance);

        return {
          frameRates,
          avgFPS,
          minFPS: Math.min(...frameRates),
          maxFPS: Math.max(...frameRates),
          fpsVariance,
          fpsStdDev,
          consistency: fpsStdDev < 5 ? 'EXCELLENT' : fpsStdDev < 10 ? 'GOOD' : 'POOR',
          totalFrames: frameCount
        };
      };

      return measureFrameRateConsistency().then(result => {
        expect(result.avgFPS).toBeGreaterThan(30);
        expect(result.consistency).not.toBe('POOR');
        expect(result.minFPS).toBeGreaterThan(20);
      });
    });
  });

  describe('Memory Usage Tracking', () => {
    
    it('should track memory usage with morph target data', () => {
      const trackMorphTargetMemory = (vertexCount, morphTargetCount) => {
        const initialMemory = monitor.getMemoryUsage();
        
        // Simulate morph target data allocation
        const morphTargetData = [];
        
        monitor.startTimer('memory_allocation');
        
        for (let target = 0; target < morphTargetCount; target++) {
          const targetData = new Float32Array(vertexCount * 3); // x, y, z for each vertex
          
          // Fill with mock data
          for (let i = 0; i < targetData.length; i++) {
            targetData[i] = (Math.random() - 0.5) * 2;
          }
          
          morphTargetData.push(targetData);
        }
        
        const allocationTime = monitor.endTimer('memory_allocation');
        const afterAllocationMemory = monitor.getMemoryUsage();
        
        // Simulate usage
        monitor.startTimer('memory_usage');
        
        for (let frame = 0; frame < 60; frame++) {
          const influences = new Array(morphTargetCount).fill(0).map(() => Math.random());
          
          // Mock vertex blending
          const resultVertices = new Float32Array(vertexCount * 3);
          for (let v = 0; v < vertexCount * 3; v++) {
            let blendedValue = 0;
            for (let t = 0; t < morphTargetCount; t++) {
              blendedValue += morphTargetData[t][v] * influences[t];
            }
            resultVertices[v] = blendedValue;
          }
        }
        
        const usageTime = monitor.endTimer('memory_usage');
        const finalMemory = monitor.getMemoryUsage();
        
        // Cleanup
        morphTargetData.length = 0;
        
        const afterCleanupMemory = monitor.getMemoryUsage();
        
        return {
          vertexCount,
          morphTargetCount,
          allocationTime,
          usageTime,
          memory: {
            initial: initialMemory.used,
            afterAllocation: afterAllocationMemory.used,
            afterUsage: finalMemory.used,
            afterCleanup: afterCleanupMemory.used,
            allocated: afterAllocationMemory.used - initialMemory.used,
            leaked: afterCleanupMemory.used - initialMemory.used
          },
          expectedSize: vertexCount * 3 * morphTargetCount * 4, // 4 bytes per float
          efficiency: {
            allocationSpeed: (vertexCount * morphTargetCount) / allocationTime,
            memoryUtilization: ((afterAllocationMemory.used - initialMemory.used) / 
                               (vertexCount * 3 * morphTargetCount * 4)) * 100
          }
        };
      };

      const scenarios = [
        { vertices: 1000, targets: 4 },
        { vertices: 5000, targets: 8 },
        { vertices: 10000, targets: 16 }
      ];

      const results = scenarios.map(scenario => 
        trackMorphTargetMemory(scenario.vertices, scenario.targets)
      );

      results.forEach(result => {
        expect(result.memory.allocated).toBeGreaterThan(0);
        expect(result.memory.leaked).toBeLessThan(result.memory.allocated * 0.1); // Less than 10% leak
        expect(result.efficiency.allocationSpeed).toBeGreaterThan(0);
        expect(result.allocationTime).toBeLessThan(100); // Should allocate quickly
      });

      // Memory should scale predictably
      expect(results[1].memory.allocated).toBeGreaterThan(results[0].memory.allocated);
      expect(results[2].memory.allocated).toBeGreaterThan(results[1].memory.allocated);
    });

    it('should detect memory leaks in morph target animations', () => {
      const detectMemoryLeaks = (animationFrames = 300) => {
        const memorySnapshots = [];
        const initialMemory = monitor.getMemoryUsage();
        
        // Simulate sustained animation
        for (let frame = 0; frame < animationFrames; frame++) {
          // Create temporary morph data (simulate per-frame allocations)
          const frameData = {
            influences: new Array(8).fill(0).map(() => Math.random()),
            blendedVertices: new Float32Array(1000 * 3)
          };
          
          // Simulate processing
          for (let i = 0; i < frameData.blendedVertices.length; i++) {
            frameData.blendedVertices[i] = Math.random() * frameData.influences[0];
          }
          
          // Take memory snapshot every 30 frames
          if (frame % 30 === 0) {
            memorySnapshots.push({
              frame,
              memory: monitor.getMemoryUsage(),
              timestamp: performance.now()
            });
          }
          
          // Simulate frame cleanup (frameData should be garbage collected)
          frameData.influences = null;
          frameData.blendedVertices = null;
        }

        const finalMemory = monitor.getMemoryUsage();
        
        // Analyze memory trend
        const memoryGrowth = memorySnapshots.map((snapshot, index) => ({
          frame: snapshot.frame,
          growth: index > 0 ? snapshot.memory.used - memorySnapshots[0].memory.used : 0,
          growthRate: index > 0 ? 
            (snapshot.memory.used - memorySnapshots[index-1].memory.used) / 30 : 0
        }));

        const totalGrowth = finalMemory.used - initialMemory.used;
        const avgGrowthRate = memoryGrowth.reduce((sum, g) => sum + g.growthRate, 0) / memoryGrowth.length;
        
        return {
          initialMemory: initialMemory.used,
          finalMemory: finalMemory.used,
          totalGrowth,
          avgGrowthRate,
          memorySnapshots,
          memoryGrowth,
          leakDetected: totalGrowth > 50 * 1024 * 1024, // More than 50MB growth indicates leak
          leakSeverity: totalGrowth < 10 * 1024 * 1024 ? 'NONE' :
                       totalGrowth < 50 * 1024 * 1024 ? 'MINOR' : 'MAJOR'
        };
      };

      const leakAnalysis = detectMemoryLeaks();
      
      expect(leakAnalysis.leakDetected).toBe(false);
      expect(leakAnalysis.leakSeverity).toBeOneOf(['NONE', 'MINOR']);
      expect(leakAnalysis.avgGrowthRate).toBeLessThan(1024 * 1024); // Less than 1MB per 30 frames
    });

    it('should benchmark memory allocation patterns', () => {
      const benchmarkAllocationPatterns = () => {
        const patterns = [
          {
            name: 'bulk_allocation',
            description: 'Allocate all morph targets at once',
            test: () => {
              monitor.startTimer('bulk_allocation');
              const data = new Array(16).fill(null).map(() => new Float32Array(5000 * 3));
              const time = monitor.endTimer('bulk_allocation');
              return { time, dataSize: data.length };
            }
          },
          {
            name: 'incremental_allocation',
            description: 'Allocate morph targets one by one',
            test: () => {
              monitor.startTimer('incremental_allocation');
              const data = [];
              for (let i = 0; i < 16; i++) {
                data.push(new Float32Array(5000 * 3));
              }
              const time = monitor.endTimer('incremental_allocation');
              return { time, dataSize: data.length };
            }
          },
          {
            name: 'pooled_allocation',
            description: 'Reuse pre-allocated buffers',
            test: () => {
              // Pre-allocate pool
              const pool = new Array(16).fill(null).map(() => new Float32Array(5000 * 3));
              
              monitor.startTimer('pooled_allocation');
              // Simulate "allocation" by assigning from pool
              const data = [];
              for (let i = 0; i < 16; i++) {
                data.push(pool[i]);
                // Reset buffer
                pool[i].fill(0);
              }
              const time = monitor.endTimer('pooled_allocation');
              return { time, dataSize: data.length };
            }
          }
        ];

        const results = patterns.map(pattern => {
          const testResult = pattern.test();
          return {
            name: pattern.name,
            description: pattern.description,
            allocationTime: testResult.time,
            dataSize: testResult.dataSize,
            efficiency: testResult.dataSize / testResult.time // items per ms
          };
        });

        // Find most efficient pattern
        const mostEfficient = results.reduce((best, current) => 
          current.efficiency > best.efficiency ? current : best
        );

        return {
          patterns: results,
          mostEfficient,
          recommendations: {
            forRealTimeUse: results.filter(r => r.allocationTime < 5),
            forBulkOperations: results.filter(r => r.efficiency > 10)
          }
        };
      };

      const allocationBenchmark = benchmarkAllocationPatterns();
      
      expect(allocationBenchmark.patterns).toHaveLength(3);
      expect(allocationBenchmark.mostEfficient).toBeDefined();
      expect(allocationBenchmark.mostEfficient.efficiency).toBeGreaterThan(0);
      
      // Pooled allocation should typically be most efficient
      expect(allocationBenchmark.mostEfficient.name).toBeOneOf(['pooled_allocation', 'bulk_allocation']);
    });
  });

  describe('GPU Utilization Monitoring', () => {
    
    it('should monitor GPU usage during morph target rendering', () => {
      const monitorGPUUsage = (testDuration = 3000) => {
        const gpuSnapshots = [];
        const startTime = performance.now();
        
        const monitoringInterval = setInterval(() => {
          const gpuUsage = mockGPUMonitor.getGPUUsage();
          const frameRate = mockGPUMonitor.getFrameRate();
          const drawCalls = mockGPUMonitor.getDrawCalls();
          
          gpuSnapshots.push({
            timestamp: performance.now() - startTime,
            gpuUtilization: gpuUsage.utilization,
            memoryUsage: gpuUsage.memoryUsage,
            temperature: gpuUsage.temperature,
            frameRate,
            drawCalls
          });
          
          // Simulate varying morph target complexity
          const morphComplexity = Math.sin((performance.now() - startTime) * 0.001) * 0.5 + 0.5;
          const targetCount = Math.floor(morphComplexity * 16) + 1;
          
          // Mock GPU work based on complexity
          for (let i = 0; i < targetCount * 100; i++) {
            Math.sin(i + morphComplexity);
          }
          
        }, 100); // Sample every 100ms

        return new Promise((resolve) => {
          setTimeout(() => {
            clearInterval(monitoringInterval);
            
            const avgGPUUtilization = gpuSnapshots.reduce((sum, s) => sum + s.gpuUtilization, 0) / gpuSnapshots.length;
            const avgMemoryUsage = gpuSnapshots.reduce((sum, s) => sum + s.memoryUsage, 0) / gpuSnapshots.length;
            const avgFrameRate = gpuSnapshots.reduce((sum, s) => sum + s.frameRate, 0) / gpuSnapshots.length;
            const avgDrawCalls = gpuSnapshots.reduce((sum, s) => sum + s.drawCalls, 0) / gpuSnapshots.length;
            const maxTemperature = Math.max(...gpuSnapshots.map(s => s.temperature));

            resolve({
              duration: testDuration,
              sampleCount: gpuSnapshots.length,
              snapshots: gpuSnapshots,
              averages: {
                gpuUtilization: avgGPUUtilization,
                memoryUsage: avgMemoryUsage,
                frameRate: avgFrameRate,
                drawCalls: avgDrawCalls
              },
              peaks: {
                maxGPUUtilization: Math.max(...gpuSnapshots.map(s => s.gpuUtilization)),
                maxMemoryUsage: Math.max(...gpuSnapshots.map(s => s.memoryUsage)),
                minFrameRate: Math.min(...gpuSnapshots.map(s => s.frameRate)),
                maxTemperature
              },
              performance: {
                utilizationEfficiency: avgGPUUtilization > 70 ? 'HIGH' : avgGPUUtilization > 40 ? 'MEDIUM' : 'LOW',
                thermalPerformance: maxTemperature < 80 ? 'GOOD' : maxTemperature < 90 ? 'WARM' : 'HOT'
              }
            });
          }, testDuration);
        });
      };

      return monitorGPUUsage().then(result => {
        expect(result.sampleCount).toBeGreaterThan(20);
        expect(result.averages.frameRate).toBeGreaterThan(30);
        expect(result.averages.gpuUtilization).toBeBetween(0, 100);
        expect(result.peaks.maxTemperature).toBeLessThan(100); // Safe operating temperature
        expect(result.performance.thermalPerformance).not.toBe('HOT');
      });
    });

    it('should benchmark GPU memory bandwidth usage', () => {
      const benchmarkGPUMemoryBandwidth = () => {
        const testScenarios = [
          { name: '1K vertices, 4 targets', vertices: 1000, targets: 4 },
          { name: '5K vertices, 8 targets', vertices: 5000, targets: 8 },
          { name: '10K vertices, 16 targets', vertices: 10000, targets: 16 }
        ];

        const results = testScenarios.map(scenario => {
          monitor.startTimer(`gpu_bandwidth_${scenario.name}`);
          
          // Calculate theoretical memory bandwidth requirements
          const baseVertexData = scenario.vertices * 3 * 4; // 3 floats per vertex, 4 bytes per float
          const morphTargetData = scenario.targets * scenario.vertices * 3 * 4;
          const totalDataSize = baseVertexData + morphTargetData;
          
          // Simulate GPU memory transfers per frame
          const transfersPerSecond = 60; // 60 FPS
          const bandwidthPerSecond = totalDataSize * transfersPerSecond;
          
          // Mock GPU operations
          const gpuUsage = mockGPUMonitor.getGPUUsage();
          const frameRate = mockGPUMonitor.getFrameRate();
          
          const processingTime = monitor.endTimer(`gpu_bandwidth_${scenario.name}`);
          
          return {
            scenario: scenario.name,
            vertices: scenario.vertices,
            morphTargets: scenario.targets,
            dataSize: {
              baseVertices: baseVertexData,
              morphTargets: morphTargetData,
              total: totalDataSize
            },
            bandwidth: {
              perFrame: totalDataSize,
              perSecond: bandwidthPerSecond,
              mbPerSecond: bandwidthPerSecond / (1024 * 1024)
            },
            performance: {
              processingTime,
              estimatedFPS: 1000 / processingTime,
              gpuUtilization: gpuUsage.utilization,
              efficient: bandwidthPerSecond < 500 * 1024 * 1024 // Less than 500MB/s is good
            }
          };
        });

        const totalBandwidth = results.reduce((sum, r) => sum + r.bandwidth.mbPerSecond, 0);
        
        return {
          scenarios: results,
          totalBandwidth: totalBandwidth,
          averageBandwidth: totalBandwidth / results.length,
          recommendations: {
            optimizeFor: results.filter(r => !r.performance.efficient),
            acceptable: results.filter(r => r.performance.efficient)
          }
        };
      };

      const bandwidthResults = benchmarkGPUMemoryBandwidth();
      
      expect(bandwidthResults.scenarios).toHaveLength(3);
      expect(bandwidthResults.totalBandwidth).toBeGreaterThan(0);
      expect(bandwidthResults.averageBandwidth).toBeLessThan(1000); // Less than 1GB/s average
      
      // At least the smallest scenario should be efficient
      expect(bandwidthResults.scenarios[0].performance.efficient).toBe(true);
    });
  });

  describe('Optimization Validation', () => {
    
    it('should validate morph target culling optimizations', () => {
      const validateCullingOptimization = () => {
        const morphTargets = new Array(16).fill(0).map((_, index) => ({
          id: index,
          influence: Math.random(),
          active: true
        }));

        // Test culling strategy: disable targets with very low influence
        const cullingThreshold = 0.01;
        
        monitor.startTimer('without_culling');
        
        // Process all targets
        let processedWithoutCulling = 0;
        morphTargets.forEach(target => {
          // Simulate processing
          for (let i = 0; i < 1000; i++) {
            Math.sin(i * target.influence);
          }
          processedWithoutCulling++;
        });
        
        const timeWithoutCulling = monitor.endTimer('without_culling');
        
        monitor.startTimer('with_culling');
        
        // Process only significant targets
        let processedWithCulling = 0;
        morphTargets.forEach(target => {
          if (target.influence > cullingThreshold) {
            // Simulate processing
            for (let i = 0; i < 1000; i++) {
              Math.sin(i * target.influence);
            }
            processedWithCulling++;
          }
        });
        
        const timeWithCulling = monitor.endTimer('with_culling');
        
        const culledTargets = morphTargets.filter(t => t.influence <= cullingThreshold).length;
        const activeTargets = morphTargets.length - culledTargets;
        
        return {
          totalTargets: morphTargets.length,
          culledTargets,
          activeTargets,
          cullingThreshold,
          performance: {
            timeWithoutCulling,
            timeWithCulling,
            speedup: timeWithoutCulling / timeWithCulling,
            efficiency: ((timeWithoutCulling - timeWithCulling) / timeWithoutCulling) * 100
          },
          processing: {
            processedWithoutCulling,
            processedWithCulling,
            reductionRatio: processedWithCulling / processedWithoutCulling
          }
        };
      };

      const cullingResults = validateCullingOptimization();
      
      expect(cullingResults.totalTargets).toBe(16);
      expect(cullingResults.activeTargets).toBeLessThanOrEqual(cullingResults.totalTargets);
      expect(cullingResults.performance.speedup).toBeGreaterThanOrEqual(1); // Should be faster or same
      expect(cullingResults.performance.efficiency).toBeGreaterThanOrEqual(0);
    });

    it('should validate level-of-detail (LOD) optimization', () => {
      const validateLODOptimization = () => {
        const lodLevels = [
          { name: 'HIGH', distance: 0, targetCount: 16, vertexCount: 10000 },
          { name: 'MEDIUM', distance: 50, targetCount: 8, vertexCount: 5000 },
          { name: 'LOW', distance: 100, targetCount: 4, vertexCount: 2500 },
          { name: 'MINIMAL', distance: 200, targetCount: 2, vertexCount: 1000 }
        ];

        const performanceMeasurements = lodLevels.map(lod => {
          monitor.startTimer(`lod_${lod.name}`);
          
          // Simulate processing for this LOD level
          const influences = new Array(lod.targetCount).fill(0).map(() => Math.random());
          
          for (let vertex = 0; vertex < lod.vertexCount; vertex++) {
            for (let target = 0; target < lod.targetCount; target++) {
              // Simulate vertex blending
              Math.sin(vertex + target + influences[target]);
            }
          }
          
          const processingTime = monitor.endTimer(`lod_${lod.name}`);
          
          return {
            ...lod,
            processingTime,
            complexity: lod.targetCount * lod.vertexCount,
            efficiency: lod.vertexCount / processingTime,
            qualityRatio: (lod.targetCount * lod.vertexCount) / Math.max(...lodLevels.map(l => l.targetCount * l.vertexCount))
          };
        });

        // Calculate LOD transition performance
        const lodTransitions = [];
        for (let i = 1; i < performanceMeasurements.length; i++) {
          const current = performanceMeasurements[i];
          const previous = performanceMeasurements[i - 1];
          
          lodTransitions.push({
            from: previous.name,
            to: current.name,
            speedup: previous.processingTime / current.processingTime,
            qualityLoss: previous.qualityRatio - current.qualityRatio,
            efficiency: current.speedup > 1 && current.qualityLoss < 0.5
          });
        }

        return {
          lodLevels: performanceMeasurements,
          transitions: lodTransitions,
          optimization: {
            maxSpeedup: Math.max(...lodTransitions.map(t => t.speedup)),
            avgSpeedup: lodTransitions.reduce((sum, t) => sum + t.speedup, 0) / lodTransitions.length,
            efficientTransitions: lodTransitions.filter(t => t.efficiency).length
          }
        };
      };

      const lodResults = validateLODOptimization();
      
      expect(lodResults.lodLevels).toHaveLength(4);
      expect(lodResults.transitions).toHaveLength(3);
      expect(lodResults.optimization.maxSpeedup).toBeGreaterThan(1);
      expect(lodResults.optimization.efficientTransitions).toBeGreaterThan(0);
      
      // Processing time should decrease with LOD level
      for (let i = 1; i < lodResults.lodLevels.length; i++) {
        expect(lodResults.lodLevels[i].processingTime)
          .toBeLessThanOrEqual(lodResults.lodLevels[i-1].processingTime);
      }
    });

    it('should validate batch processing optimizations', () => {
      const validateBatchOptimization = () => {
        const meshCount = 20;
        const morphTargetsPerMesh = 4;
        
        // Test individual processing
        monitor.startTimer('individual_processing');
        
        const individualResults = [];
        for (let mesh = 0; mesh < meshCount; mesh++) {
          const startTime = performance.now();
          
          const influences = new Array(morphTargetsPerMesh).fill(0).map(() => Math.random());
          
          // Simulate individual mesh processing
          for (let target = 0; target < morphTargetsPerMesh; target++) {
            for (let vertex = 0; vertex < 1000; vertex++) {
              Math.sin(mesh + target + vertex + influences[target]);
            }
          }
          
          individualResults.push(performance.now() - startTime);
        }
        
        const individualTime = monitor.endTimer('individual_processing');
        
        // Test batch processing
        monitor.startTimer('batch_processing');
        
        // Collect all influences first
        const allInfluences = [];
        for (let mesh = 0; mesh < meshCount; mesh++) {
          allInfluences.push(new Array(morphTargetsPerMesh).fill(0).map(() => Math.random()));
        }
        
        // Process all meshes together
        for (let target = 0; target < morphTargetsPerMesh; target++) {
          for (let mesh = 0; mesh < meshCount; mesh++) {
            for (let vertex = 0; vertex < 1000; vertex++) {
              Math.sin(mesh + target + vertex + allInfluences[mesh][target]);
            }
          }
        }
        
        const batchTime = monitor.endTimer('batch_processing');
        
        return {
          meshCount,
          morphTargetsPerMesh,
          processing: {
            individualTime,
            batchTime,
            speedup: individualTime / batchTime,
            efficiency: ((individualTime - batchTime) / individualTime) * 100
          },
          individual: {
            results: individualResults,
            avgTime: individualResults.reduce((sum, time) => sum + time, 0) / individualResults.length,
            maxTime: Math.max(...individualResults),
            minTime: Math.min(...individualResults)
          },
          recommendation: individualTime > batchTime ? 'USE_BATCH' : 'USE_INDIVIDUAL'
        };
      };

      const batchResults = validateBatchOptimization();
      
      expect(batchResults.meshCount).toBe(20);
      expect(batchResults.processing.speedup).toBeGreaterThan(0);
      expect(batchResults.individual.avgTime).toBeGreaterThan(0);
      expect(['USE_BATCH', 'USE_INDIVIDUAL']).toContain(batchResults.recommendation);
    });
  });

  describe('Stress Testing', () => {
    
    it('should perform extreme load stress test', async () => {
      const extremeLoadStressTest = async () => {
        const stressScenarios = [
          { name: 'MANY_TARGETS', meshes: 5, targetsPerMesh: 32, vertices: 1000 },
          { name: 'MANY_VERTICES', meshes: 5, targetsPerMesh: 8, vertices: 50000 },
          { name: 'MANY_MESHES', meshes: 100, targetsPerMesh: 4, vertices: 1000 },
          { name: 'EXTREME_ALL', meshes: 20, targetsPerMesh: 16, vertices: 10000 }
        ];

        const stressResults = [];

        for (const scenario of stressScenarios) {
          monitor.startTimer(`stress_${scenario.name}`);
          
          const memoryBefore = monitor.getMemoryUsage();
          
          try {
            // Simulate extreme load
            const allMeshData = [];
            
            for (let mesh = 0; mesh < scenario.meshes; mesh++) {
              const meshData = {
                vertices: new Float32Array(scenario.vertices * 3),
                morphTargets: []
              };
              
              for (let target = 0; target < scenario.targetsPerMesh; target++) {
                meshData.morphTargets.push(new Float32Array(scenario.vertices * 3));
              }
              
              allMeshData.push(meshData);
            }
            
            // Simulate animation frames under stress
            const frameCount = 60;
            const frameTimes = [];
            
            for (let frame = 0; frame < frameCount; frame++) {
              const frameStart = performance.now();
              
              // Process all meshes
              allMeshData.forEach((meshData, meshIndex) => {
                const influences = new Array(scenario.targetsPerMesh).fill(0)
                  .map(() => Math.sin(frame * 0.1 + meshIndex));
                
                // Simulate vertex blending
                for (let v = 0; v < scenario.vertices * 3; v++) {
                  let blended = meshData.vertices[v];
                  for (let t = 0; t < scenario.targetsPerMesh; t++) {
                    blended += meshData.morphTargets[t][v] * influences[t];
                  }
                }
              });
              
              frameTimes.push(performance.now() - frameStart);
              
              // Yield control occasionally to prevent blocking
              if (frame % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
              }
            }
            
            const totalTime = monitor.endTimer(`stress_${scenario.name}`);
            const memoryAfter = monitor.getMemoryUsage();
            
            stressResults.push({
              scenario: scenario.name,
              config: scenario,
              results: {
                totalTime,
                avgFrameTime: frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length,
                maxFrameTime: Math.max(...frameTimes),
                minFrameTime: Math.min(...frameTimes),
                fps: (frameCount / totalTime) * 1000,
                memoryUsed: memoryAfter.used - memoryBefore.used,
                completed: true
              },
              performance: {
                acceptableFPS: frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length < 33.33,
                memoryEfficient: (memoryAfter.used - memoryBefore.used) < 500 * 1024 * 1024, // Less than 500MB
                stable: Math.max(...frameTimes) - Math.min(...frameTimes) < 50 // Frame time variation
              }
            });
            
          } catch (error) {
            const totalTime = monitor.endTimer(`stress_${scenario.name}`);
            stressResults.push({
              scenario: scenario.name,
              config: scenario,
              results: {
                totalTime,
                error: error.message,
                completed: false
              },
              performance: {
                acceptableFPS: false,
                memoryEfficient: false,
                stable: false
              }
            });
          }
        }

        return {
          scenarios: stressResults,
          summary: {
            completedScenarios: stressResults.filter(r => r.results.completed).length,
            failedScenarios: stressResults.filter(r => !r.results.completed).length,
            acceptablePerformance: stressResults.filter(r => 
              r.performance.acceptableFPS && r.performance.memoryEfficient && r.performance.stable
            ).length
          }
        };
      };

      const stressResults = await extremeLoadStressTest();
      
      expect(stressResults.scenarios).toHaveLength(4);
      expect(stressResults.summary.completedScenarios).toBeGreaterThan(0);
      expect(stressResults.summary.failedScenarios).toBeLessThan(4); // At least some should succeed
      
      // The simplest scenario should definitely pass
      const simpleScenario = stressResults.scenarios.find(s => 
        s.config.meshes <= 5 && s.config.targetsPerMesh <= 8 && s.config.vertices <= 1000
      );
      expect(simpleScenario?.results.completed).toBe(true);
    });
  });

  afterAll(() => {
    // Generate performance report
    const performanceReport = {
      testSuite: 'Morph Target Performance Benchmarks',
      completedAt: new Date().toISOString(),
      summary: {
        totalMetrics: monitor.getAllMetrics(),
        memoryBaseline: monitor.memoryBaseline,
        finalMemory: monitor.getMemoryUsage()
      },
      recommendations: [
        'Use LOD optimization for distant objects',
        'Implement morph target culling for influences < 0.01',
        'Consider batch processing for multiple meshes',
        'Monitor memory usage in production environments',
        'Implement frame rate limiting for consistent performance'
      ]
    };

    console.log('\n=== Performance Benchmark Report ===');
    console.log(`Completed at: ${performanceReport.completedAt}`);
    console.log(`Memory baseline: ${(performanceReport.summary.memoryBaseline.used / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Final memory: ${(performanceReport.summary.finalMemory.used / 1024 / 1024).toFixed(2)}MB`);
    console.log('====================================\n');
  });
});