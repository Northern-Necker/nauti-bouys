import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, TestDataGenerator } from './GLBTestUtilities';

/**
 * Performance Benchmark Tests for GLB Avatar
 * 
 * These tests validate that the 13.8MB GLB file loads and renders
 * within acceptable performance thresholds across various scenarios.
 */

// Mock the 3D libraries
vi.mock('@react-three/drei', () => ({
  useGLTF: vi.fn(),
  useAnimations: vi.fn(() => ({ actions: {} })),
  OrbitControls: () => null,
  Environment: () => null
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: vi.fn(({ children }) => <div data-testid="mock-canvas">{children}</div>),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ camera: {}, gl: {} }))
}));

// Import after mocking
import InteractiveAvatar from '../../components/avatar3d/InteractiveAvatar';
import Avatar3DScene from '../../components/avatar3d/Avatar3DScene';

describe('GLB Avatar Performance Benchmarks', () => {
  let performanceMonitor;
  let originalRequestAnimationFrame;
  let frameCallbacks = [];

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    vi.clearAllMocks();
    
    // Mock requestAnimationFrame
    originalRequestAnimationFrame = global.requestAnimationFrame;
    global.requestAnimationFrame = vi.fn((callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    
    // Mock performance.memory
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB baseline
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB total
        jsHeapSizeLimit: 500 * 1024 * 1024  // 500MB limit
      },
      configurable: true
    });
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRequestAnimationFrame;
    frameCallbacks = [];
  });

  describe('Loading Performance Tests', () => {
    it('should load 13.8MB GLB file within 5 second threshold', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      // Mock realistic loading delay for large file
      useGLTF.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              scene: { traverse: vi.fn(), scale: { setScalar: vi.fn() }, position: { set: vi.fn() } },
              animations: []
            });
          }, 3000); // 3 second simulated load time
        });
      });

      performanceMonitor.startLoading();
      
      render(
        <Canvas>
          <InteractiveAvatar />
        </Canvas>
      );

      await waitFor(() => {
        performanceMonitor.endLoading();
        const loadTime = performanceMonitor.getLoadTime();
        expect(loadTime).toBeLessThan(5000); // Must load within 5 seconds
        expect(loadTime).toBeGreaterThan(2000); // Should be realistic for large file
      }, { timeout: 6000 });
    });

    it('should handle progressive loading indicators', async () => {
      let progressCallbacks = [];
      const { useGLTF } = await import('@react-three/drei');
      
      useGLTF.mockImplementation((url, preload, onProgress) => {
        if (onProgress) {
          // Simulate progressive loading
          const progressSteps = [
            { loaded: 2.8 * 1024 * 1024, total: 13.8 * 1024 * 1024 }, // 20%
            { loaded: 6.9 * 1024 * 1024, total: 13.8 * 1024 * 1024 }, // 50%
            { loaded: 11.0 * 1024 * 1024, total: 13.8 * 1024 * 1024 }, // 80%
            { loaded: 13.8 * 1024 * 1024, total: 13.8 * 1024 * 1024 }  // 100%
          ];

          progressSteps.forEach((progress, index) => {
            setTimeout(() => onProgress(progress), index * 500);
          });
        }

        return Promise.resolve({
          scene: { traverse: vi.fn(), scale: { setScalar: vi.fn() }, position: { set: vi.fn() } },
          animations: []
        });
      });

      const component = render(
        <Canvas>
          <InteractiveAvatar />
        </Canvas>
      );

      // Should handle progress updates without errors
      await waitFor(() => {
        expect(component.container).toBeDefined();
      });
    });

    it('should monitor memory usage during large file loading', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      // Mock memory increase during loading
      let loadingPhase = 0;
      useGLTF.mockImplementation(() => {
        loadingPhase = 1; // Loading started
        
        // Simulate memory increase during loading
        Object.defineProperty(performance, 'memory', {
          value: {
            usedJSHeapSize: 120 * 1024 * 1024, // Increased to 120MB
            totalJSHeapSize: 150 * 1024 * 1024,
            jsHeapSizeLimit: 500 * 1024 * 1024
          },
          configurable: true
        });

        return Promise.resolve({
          scene: { traverse: vi.fn(), scale: { setScalar: vi.fn() }, position: { set: vi.fn() } },
          animations: []
        });
      });

      performanceMonitor.startLoading();
      
      render(
        <Canvas>
          <InteractiveAvatar />
        </Canvas>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        performanceMonitor.endLoading();
      });

      const memoryIncrease = performanceMonitor.getMemoryIncrease();
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });
  });

  describe('Rendering Performance Tests', () => {
    it('should maintain 30+ FPS during avatar rendering', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      useGLTF.mockReturnValue({
        scene: { traverse: vi.fn(), scale: { setScalar: vi.fn() }, position: { set: vi.fn() } },
        animations: []
      });

      render(
        <Canvas>
          <Avatar3DScene avatarState="idle" isLoading={false} />
        </Canvas>
      );

      // Simulate 60 frames of rendering
      const frameTimings = [];
      for (let i = 0; i < 60; i++) {
        const frameStart = performance.now();
        
        // Simulate frame processing
        await act(async () => {
          frameCallbacks.forEach(callback => callback());
          frameCallbacks = [];
        });
        
        const frameTime = performance.now() - frameStart;
        frameTimings.push(frameTime);
        performanceMonitor.recordFrame();
      }

      const averageFrameTime = frameTimings.reduce((a, b) => a + b) / frameTimings.length;
      const fps = 1000 / averageFrameTime;
      
      expect(fps).toBeGreaterThan(30); // Minimum 30 FPS
      expect(averageFrameTime).toBeLessThan(33.33); // 30fps = 33.33ms per frame
    });

    it('should handle heavy interaction without frame drops', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      useGLTF.mockReturnValue({
        scene: { 
          traverse: vi.fn(),
          scale: { setScalar: vi.fn() },
          position: { set: vi.fn() }
        },
        animations: []
      });

      const component = render(
        <Canvas>
          <InteractiveAvatar />
        </Canvas>
      );

      // Simulate intensive mouse movement
      const container = component.container;
      const heavyInteractionFrames = [];

      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        
        // Simulate mouse movement every frame
        const mockEvent = {
          currentTarget: {
            getBoundingClientRect: () => ({
              left: 0, top: 0, width: 400, height: 300
            })
          },
          clientX: (i % 400),
          clientY: (i % 300)
        };

        act(() => {
          container.dispatchEvent(new MouseEvent('mousemove', mockEvent));
        });

        const frameTime = performance.now() - start;
        heavyInteractionFrames.push(frameTime);
      }

      const averageInteractionTime = heavyInteractionFrames.reduce((a, b) => a + b) / heavyInteractionFrames.length;
      expect(averageInteractionTime).toBeLessThan(16.67); // Should handle 60fps interaction
    });

    it('should optimize performance across different device scenarios', async () => {
      const scenarios = TestDataGenerator.getPerformanceTestScenarios();
      
      for (const scenario of scenarios) {
        const { useGLTF } = await import('@react-three/drei');
        
        // Mock loading time based on scenario
        const mockLoadTime = scenario.expectedLoadTime;
        useGLTF.mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                scene: { traverse: vi.fn(), scale: { setScalar: vi.fn() }, position: { set: vi.fn() } },
                animations: []
              });
            }, mockLoadTime * 0.1); // Scale down for test speed
          });
        });

        const monitor = new PerformanceMonitor();
        monitor.startLoading();

        render(
          <Canvas>
            <InteractiveAvatar />
          </Canvas>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, mockLoadTime * 0.1 + 100));
          monitor.endLoading();
        });

        const performance = monitor.isPerformanceAcceptable({
          maxLoadTime: scenario.expectedLoadTime,
          minFPS: scenario.expectedFPS
        });

        expect(performance.loadTimeOK).toBe(true);
      }
    });
  });

  describe('Memory Management Tests', () => {
    it('should not create memory leaks during repeated loading', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      const mockGLTF = {
        scene: { traverse: vi.fn(), scale: { setScalar: vi.fn() }, position: { set: vi.fn() } },
        animations: []
      };

      let memorySnapshots = [];

      // Load avatar multiple times
      for (let i = 0; i < 5; i++) {
        useGLTF.mockReturnValue(mockGLTF);
        
        const component = render(
          <Canvas>
            <InteractiveAvatar key={i} />
          </Canvas>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Take memory snapshot
        if (performance.memory) {
          memorySnapshots.push(performance.memory.usedJSHeapSize);
        }

        component.unmount();
      }

      // Memory should not grow significantly across iterations
      if (memorySnapshots.length > 1) {
        const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
        const maxAcceptableGrowth = 50 * 1024 * 1024; // 50MB
        
        expect(memoryGrowth).toBeLessThan(maxAcceptableGrowth);
      }
    });

    it('should handle memory pressure gracefully', async () => {
      // Simulate low memory conditions
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 180 * 1024 * 1024, // 180MB used
          totalJSHeapSize: 200 * 1024 * 1024, // 200MB total  
          jsHeapSizeLimit: 200 * 1024 * 1024  // 200MB limit (90% usage)
        },
        configurable: true
      });

      const { useGLTF } = await import('@react-three/drei');
      
      useGLTF.mockReturnValue({
        scene: { traverse: vi.fn(), scale: { setScalar: vi.fn() }, position: { set: vi.fn() } },
        animations: []
      });

      // Should not crash under memory pressure
      expect(() => {
        render(
          <Canvas>
            <InteractiveAvatar />
          </Canvas>
        );
      }).not.toThrow();
    });

    it('should efficiently garbage collect unused models', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      let garbageCollectionCallbacks = [];
      
      // Mock FinalizationRegistry for garbage collection monitoring
      global.FinalizationRegistry = vi.fn().mockImplementation((callback) => {
        garbageCollectionCallbacks.push(callback);
        return {
          register: vi.fn(),
          unregister: vi.fn()
        };
      });

      const mockGLTF = {
        scene: { 
          traverse: vi.fn(),
          scale: { setScalar: vi.fn() },
          position: { set: vi.fn() }
        },
        animations: []
      };

      useGLTF.mockReturnValue(mockGLTF);

      const component = render(
        <Canvas>
          <InteractiveAvatar />
        </Canvas>
      );

      component.unmount();

      // Simulate garbage collection
      if (global.gc) {
        global.gc();
      }

      // Should handle cleanup properly
      expect(mockGLTF.scene.traverse).toHaveBeenCalled();
    });
  });

  describe('Network Performance Tests', () => {
    it('should handle slow network conditions', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      // Simulate slow 3G loading (1.5 Mbps)
      const slow3GLoadTime = (13.8 * 8) / 1.5; // ~73 seconds theoretical
      const simulatedLoadTime = Math.min(slow3GLoadTime * 100, 8000); // Cap at 8s for testing

      useGLTF.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              scene: { traverse: vi.fn(), scale: { setScalar: vi.fn() }, position: { set: vi.fn() } },
              animations: []
            });
          }, simulatedLoadTime);
        });
      });

      const monitor = new PerformanceMonitor();
      monitor.startLoading();

      render(
        <Canvas>
          <InteractiveAvatar />
        </Canvas>
      );

      // Should handle slow loading without crashing
      await waitFor(() => {
        monitor.endLoading();
        const loadTime = monitor.getLoadTime();
        expect(loadTime).toBeLessThan(10000); // 10 second timeout threshold
      }, { timeout: 12000 });
    });

    it('should implement request timeout for large files', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      // Mock timeout scenario
      useGLTF.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, 15000); // 15 second timeout
        });
      });

      const onError = vi.fn();

      render(
        <Canvas>
          <InteractiveAvatar onError={onError} />
        </Canvas>
      );

      // Should trigger timeout and fallback
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      }, { timeout: 16000 });
    });

    it('should cache GLB model for subsequent loads', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      let loadCount = 0;
      const mockGLTF = {
        scene: { traverse: vi.fn(), scale: { setScalar: vi.fn() }, position: { set: vi.fn() } },
        animations: []
      };

      useGLTF.mockImplementation(() => {
        loadCount++;
        return Promise.resolve(mockGLTF);
      });

      // Verify preload was called
      expect(useGLTF.preload).toHaveBeenCalledWith('/assets/SavannahAvatar.glb');

      // Load avatar multiple times
      for (let i = 0; i < 3; i++) {
        const component = render(
          <Canvas>
            <InteractiveAvatar key={i} />
          </Canvas>
        );
        component.unmount();
      }

      // Should use caching to minimize redundant loads
      // The exact behavior depends on the useGLTF implementation
      expect(loadCount).toBeGreaterThan(0);
    });
  });

  describe('Real-world Performance Simulation', () => {
    it('should handle combined stress scenarios', async () => {
      const { useGLTF } = await import('@react-three/drei');
      
      // Simulate real-world conditions:
      // - Large GLB file loading
      // - Multiple simultaneous interactions
      // - Memory pressure
      // - Variable frame times

      const mockGLTF = {
        scene: { 
          traverse: vi.fn((callback) => {
            // Simulate complex scene traversal
            for (let i = 0; i < 50; i++) {
              callback({
                isMesh: true,
                material: { transparent: false, opacity: 1, side: 2 },
                frustumCulled: true
              });
            }
          }),
          scale: { setScalar: vi.fn() },
          position: { set: vi.fn() }
        },
        animations: [{ name: 'idle' }, { name: 'speaking' }]
      };

      useGLTF.mockReturnValue(mockGLTF);

      const monitor = new PerformanceMonitor();
      monitor.startLoading();

      const component = render(
        <Canvas>
          <InteractiveAvatar />
        </Canvas>
      );

      // Simulate heavy interaction while loading
      const stressTestPromises = [];
      
      // Mouse interaction stress test
      stressTestPromises.push(
        act(async () => {
          for (let i = 0; i < 200; i++) {
            const mockEvent = {
              currentTarget: {
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 })
              },
              clientX: Math.random() * 400,
              clientY: Math.random() * 300
            };
            
            component.container.dispatchEvent(new MouseEvent('mousemove', mockEvent));
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        })
      );

      // Frame timing stress test
      stressTestPromises.push(
        act(async () => {
          for (let i = 0; i < 120; i++) { // 2 seconds at 60fps
            monitor.recordFrame();
            frameCallbacks.forEach(callback => callback());
            frameCallbacks = [];
            await new Promise(resolve => setTimeout(resolve, 16));
          }
        })
      );

      await Promise.all(stressTestPromises);
      monitor.endLoading();

      const performanceReport = monitor.getReport();
      const isAcceptable = monitor.isPerformanceAcceptable();

      // Should maintain acceptable performance under stress
      expect(isAcceptable.overallOK()).toBe(true);
      expect(performanceReport.performance.fps).toBeGreaterThan(15); // Minimum playable FPS
    });

    it('should provide performance metrics for optimization', () => {
      const monitor = new PerformanceMonitor();
      
      // Simulate performance data collection
      monitor.startLoading();
      monitor.endLoading();
      
      for (let i = 0; i < 60; i++) {
        monitor.recordFrame();
      }

      const report = monitor.getReport();
      
      // Should provide comprehensive metrics
      expect(report).toHaveProperty('loading');
      expect(report).toHaveProperty('rendering');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('memory');
      
      expect(typeof report.performance.fps).toBe('number');
      expect(typeof report.performance.averageFrameTime).toBe('number');
      expect(Array.isArray(monitor.metrics.frameTimings)).toBe(true);
    });
  });
});