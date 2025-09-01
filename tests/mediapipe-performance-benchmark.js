/**
 * MediaPipe Face Landmarker v2 - Performance Benchmark Suite
 * Comprehensive performance testing, profiling, and optimization analysis
 */

class MediaPipePerformanceBenchmark {
    constructor() {
        this.faceLandmarker = null;
        this.benchmarkResults = {};
        this.performanceProfiles = [];
        this.memorySnapshots = [];
        this.testConfigurations = {
            // Different test scenarios
            scenarios: [
                { name: 'Standard', width: 640, height: 480, fps: 30 },
                { name: 'HD', width: 1280, height: 720, fps: 30 },
                { name: 'Low Resolution', width: 320, height: 240, fps: 30 },
                { name: 'High FPS', width: 640, height: 480, fps: 60 },
                { name: 'Ultra HD', width: 1920, height: 1080, fps: 30 }
            ],
            // Test durations
            shortTest: 5000,   // 5 seconds
            standardTest: 15000, // 15 seconds
            longTest: 30000,    // 30 seconds
            stressTest: 60000,  // 60 seconds
            
            // Performance thresholds
            thresholds: {
                excellent: { fps: 55, latency: 20, memory: 100 },
                good: { fps: 40, latency: 35, memory: 150 },
                acceptable: { fps: 25, latency: 50, memory: 200 },
                poor: { fps: 15, latency: 80, memory: 300 }
            }
        };
        this.realTimeMetrics = {
            fps: [],
            latency: [],
            memory: [],
            cpuUsage: [],
            frameDrops: 0,
            totalFrames: 0
        };
    }

    /**
     * Run comprehensive performance benchmark suite
     */
    async runBenchmarkSuite() {
        console.log('🚀 Starting MediaPipe Performance Benchmark Suite...\n');
        
        try {
            // Initialize MediaPipe
            console.log('📋 Initializing MediaPipe...');
            const initResult = await this.initializeMediaPipe();
            if (!initResult.success) {
                throw new Error(`Initialization failed: ${initResult.error}`);
            }
            console.log(`✅ MediaPipe initialized in ${initResult.time}ms\n`);

            // Run benchmark tests
            const benchmarks = [
                { name: 'Initialization Performance', fn: this.benchmarkInitialization },
                { name: 'Frame Processing Speed', fn: this.benchmarkFrameProcessing },
                { name: 'Memory Usage Analysis', fn: this.benchmarkMemoryUsage },
                { name: 'Stress Test', fn: this.benchmarkStressTest },
                { name: 'Cross-Resolution Performance', fn: this.benchmarkResolutions },
                { name: 'Concurrent Processing', fn: this.benchmarkConcurrency },
                { name: 'Memory Leak Detection', fn: this.benchmarkMemoryLeaks },
                { name: 'GPU vs CPU Performance', fn: this.benchmarkGpuVsCpu },
                { name: 'Real-time Performance', fn: this.benchmarkRealTime },
                { name: 'Battery Impact Analysis', fn: this.benchmarkBatteryImpact }
            ];

            let completedBenchmarks = 0;
            for (const benchmark of benchmarks) {
                try {
                    console.log(`\n📊 Running ${benchmark.name}...`);
                    const result = await benchmark.fn.call(this);
                    this.benchmarkResults[benchmark.name] = result;
                    
                    if (result.success) {
                        console.log(`✅ ${benchmark.name}: ${result.summary}`);
                    } else {
                        console.log(`❌ ${benchmark.name}: ${result.error}`);
                    }
                    
                    completedBenchmarks++;
                } catch (error) {
                    console.log(`❌ ${benchmark.name}: Benchmark failed - ${error.message}`);
                    this.benchmarkResults[benchmark.name] = { success: false, error: error.message };
                }
            }

            // Generate comprehensive report
            this.generatePerformanceReport(completedBenchmarks, benchmarks.length);
            
            return {
                success: true,
                completed: completedBenchmarks,
                total: benchmarks.length,
                results: this.benchmarkResults
            };

        } catch (error) {
            console.error('💥 Benchmark suite failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Initialize MediaPipe with performance monitoring
     */
    async initializeMediaPipe() {
        const startTime = performance.now();
        const startMemory = this.getMemoryUsage();

        try {
            const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0');
            
            const wasmLoadStart = performance.now();
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            const wasmLoadTime = performance.now() - wasmLoadStart;

            const modelLoadStart = performance.now();
            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: "VIDEO",
                numFaces: 1
            });
            const modelLoadTime = performance.now() - modelLoadStart;

            const totalTime = performance.now() - startTime;
            const endMemory = this.getMemoryUsage();
            const memoryUsed = endMemory - startMemory;

            return {
                success: true,
                time: totalTime,
                wasmLoadTime,
                modelLoadTime,
                memoryUsed,
                details: {
                    wasmLoad: `${wasmLoadTime.toFixed(2)}ms`,
                    modelLoad: `${modelLoadTime.toFixed(2)}ms`,
                    memory: `${(memoryUsed / 1024 / 1024).toFixed(2)}MB`
                }
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Benchmark initialization performance across multiple runs
     */
    async benchmarkInitialization() {
        const runs = 5;
        const results = [];

        for (let i = 0; i < runs; i++) {
            console.log(`   Run ${i + 1}/${runs}...`);
            
            // Clear previous instance
            if (this.faceLandmarker && this.faceLandmarker.close) {
                this.faceLandmarker.close();
            }
            
            const result = await this.initializeMediaPipe();
            if (result.success) {
                results.push({
                    totalTime: result.time,
                    wasmTime: result.wasmLoadTime,
                    modelTime: result.modelLoadTime,
                    memory: result.memoryUsed
                });
            }
        }

        if (results.length === 0) {
            return { success: false, error: 'All initialization attempts failed' };
        }

        const avgTotalTime = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
        const avgWasmTime = results.reduce((sum, r) => sum + r.wasmTime, 0) / results.length;
        const avgModelTime = results.reduce((sum, r) => sum + r.modelTime, 0) / results.length;
        const avgMemory = results.reduce((sum, r) => sum + r.memory, 0) / results.length;

        return {
            success: true,
            summary: `Avg: ${avgTotalTime.toFixed(2)}ms (WASM: ${avgWasmTime.toFixed(2)}ms, Model: ${avgModelTime.toFixed(2)}ms)`,
            details: {
                averages: {
                    total: avgTotalTime,
                    wasm: avgWasmTime,
                    model: avgModelTime,
                    memory: avgMemory
                },
                runs: results,
                consistency: this.calculateConsistency(results.map(r => r.totalTime))
            }
        };
    }

    /**
     * Benchmark frame processing speed
     */
    async benchmarkFrameProcessing() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        const testDuration = this.testConfigurations.standardTest;
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        // Create test frame with face-like pattern
        this.drawTestFace(ctx, canvas.width, canvas.height);

        const startTime = performance.now();
        let frameCount = 0;
        const frameTimes = [];
        const detectionResults = [];

        while (performance.now() - startTime < testDuration) {
            const frameStart = performance.now();
            
            const results = this.faceLandmarker.detectForVideo(canvas, frameStart);
            
            const frameEnd = performance.now();
            const frameTime = frameEnd - frameStart;
            
            frameTimes.push(frameTime);
            detectionResults.push({
                hasDetection: results.faceLandmarks && results.faceLandmarks.length > 0,
                landmarkCount: results.faceLandmarks ? results.faceLandmarks[0]?.length || 0 : 0,
                hasBlendshapes: results.faceBlendshapes && results.faceBlendshapes.length > 0
            });
            
            frameCount++;
        }

        const actualDuration = performance.now() - startTime;
        const avgFps = (frameCount / actualDuration) * 1000;
        const avgLatency = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
        const minLatency = Math.min(...frameTimes);
        const maxLatency = Math.max(...frameTimes);
        const detectionRate = detectionResults.filter(r => r.hasDetection).length / detectionResults.length;

        const performanceGrade = this.getPerformanceGrade(avgFps, avgLatency);

        return {
            success: true,
            summary: `${avgFps.toFixed(1)} FPS, ${avgLatency.toFixed(2)}ms avg latency (${performanceGrade})`,
            details: {
                fps: avgFps,
                avgLatency,
                minLatency,
                maxLatency,
                frameCount,
                detectionRate: detectionRate * 100,
                performanceGrade,
                frameTimeDistribution: this.analyzeFrameTimeDistribution(frameTimes)
            }
        };
    }

    /**
     * Benchmark memory usage patterns
     */
    async benchmarkMemoryUsage() {
        if (!performance.memory) {
            return { success: false, error: 'Memory API not available' };
        }

        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        this.drawTestFace(ctx, canvas.width, canvas.height);

        const memorySnapshots = [];
        const testDuration = this.testConfigurations.standardTest;
        const startTime = performance.now();
        const startMemory = performance.memory.usedJSHeapSize;

        // Monitor memory usage during processing
        const memoryMonitor = setInterval(() => {
            const snapshot = {
                time: performance.now() - startTime,
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
            memorySnapshots.push(snapshot);
        }, 100);

        // Process frames while monitoring
        while (performance.now() - startTime < testDuration) {
            this.faceLandmarker.detectForVideo(canvas, performance.now());
        }

        clearInterval(memoryMonitor);

        const endMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = endMemory - startMemory;
        const peakMemory = Math.max(...memorySnapshots.map(s => s.used));
        const avgMemory = memorySnapshots.reduce((sum, s) => sum + s.used, 0) / memorySnapshots.length;

        // Memory efficiency analysis
        const memoryEfficient = memoryIncrease < 50 * 1024 * 1024; // Less than 50MB increase
        const memoryStable = this.isMemoryStable(memorySnapshots);

        return {
            success: true,
            summary: `Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB, Peak: ${(peakMemory / 1024 / 1024).toFixed(2)}MB`,
            details: {
                startMemory: startMemory / 1024 / 1024,
                endMemory: endMemory / 1024 / 1024,
                memoryIncrease: memoryIncrease / 1024 / 1024,
                peakMemory: peakMemory / 1024 / 1024,
                avgMemory: avgMemory / 1024 / 1024,
                isEfficient: memoryEfficient,
                isStable: memoryStable,
                snapshots: memorySnapshots.slice(0, 10) // First 10 snapshots for analysis
            }
        };
    }

    /**
     * Stress test with high load
     */
    async benchmarkStressTest() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        console.log('   Running stress test (may take up to 60 seconds)...');
        
        const testDuration = this.testConfigurations.stressTest;
        const canvases = [];
        
        // Create multiple test canvases
        for (let i = 0; i < 4; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            this.drawTestFace(ctx, canvas.width, canvas.height, i * 45); // Different face orientations
            canvases.push(canvas);
        }

        const startTime = performance.now();
        let frameCount = 0;
        let errorCount = 0;
        const performanceMetrics = [];
        const memorySnapshots = [];

        // High-intensity processing loop
        while (performance.now() - startTime < testDuration) {
            const cycleStart = performance.now();
            
            try {
                // Process multiple frames rapidly
                for (const canvas of canvases) {
                    this.faceLandmarker.detectForVideo(canvas, performance.now());
                    frameCount++;
                }
                
                // Record performance metrics
                const cycleTime = performance.now() - cycleStart;
                performanceMetrics.push({
                    time: performance.now() - startTime,
                    cycleTime,
                    framesPerCycle: canvases.length
                });

                // Memory snapshot every 5 seconds
                if (performance.memory && frameCount % 300 === 0) {
                    memorySnapshots.push({
                        time: performance.now() - startTime,
                        memory: performance.memory.usedJSHeapSize / 1024 / 1024
                    });
                }

            } catch (error) {
                errorCount++;
                if (errorCount > 10) {
                    break; // Too many errors, abort stress test
                }
            }
        }

        const actualDuration = performance.now() - startTime;
        const avgFps = (frameCount / actualDuration) * 1000;
        const avgCycleTime = performanceMetrics.reduce((sum, m) => sum + m.cycleTime, 0) / performanceMetrics.length;
        
        const stressPassed = avgFps > 20 && errorCount < 5;
        const stabilityScore = Math.max(0, 100 - (errorCount * 10));

        return {
            success: stressPassed,
            summary: `${avgFps.toFixed(1)} FPS under stress, ${errorCount} errors, ${stabilityScore}% stability`,
            details: {
                avgFps,
                frameCount,
                errorCount,
                avgCycleTime,
                stabilityScore,
                duration: actualDuration,
                memoryProgression: memorySnapshots,
                performanceProgression: performanceMetrics.slice(0, 20) // First 20 samples
            }
        };
    }

    /**
     * Benchmark performance across different resolutions
     */
    async benchmarkResolutions() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        const results = {};

        for (const scenario of this.testConfigurations.scenarios) {
            console.log(`   Testing ${scenario.name} (${scenario.width}x${scenario.height})...`);
            
            const canvas = document.createElement('canvas');
            canvas.width = scenario.width;
            canvas.height = scenario.height;
            const ctx = canvas.getContext('2d');
            this.drawTestFace(ctx, canvas.width, canvas.height);

            const testDuration = this.testConfigurations.shortTest;
            const startTime = performance.now();
            let frameCount = 0;
            const frameTimes = [];

            while (performance.now() - startTime < testDuration) {
                const frameStart = performance.now();
                this.faceLandmarker.detectForVideo(canvas, frameStart);
                const frameTime = performance.now() - frameStart;
                frameTimes.push(frameTime);
                frameCount++;
            }

            const actualDuration = performance.now() - startTime;
            const avgFps = (frameCount / actualDuration) * 1000;
            const avgLatency = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;

            results[scenario.name] = {
                width: scenario.width,
                height: scenario.height,
                avgFps: avgFps,
                avgLatency: avgLatency,
                pixelThroughput: (scenario.width * scenario.height * avgFps) / 1000000, // MPix/s
                efficiency: this.calculateEfficiencyScore(scenario.width, scenario.height, avgFps, avgLatency)
            };
        }

        // Find optimal resolution
        const optimalResolution = Object.entries(results).reduce((best, [name, result]) => 
            result.efficiency > best.efficiency ? result : best
        );

        return {
            success: true,
            summary: `Optimal: ${optimalResolution.width}x${optimalResolution.height} (${optimalResolution.avgFps.toFixed(1)} FPS)`,
            details: {
                results,
                optimalResolution,
                recommendations: this.generateResolutionRecommendations(results)
            }
        };
    }

    /**
     * Benchmark concurrent processing capabilities
     */
    async benchmarkConcurrency() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        const concurrencyLevels = [1, 2, 4, 8];
        const results = {};

        for (const level of concurrencyLevels) {
            console.log(`   Testing concurrency level ${level}...`);
            
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            this.drawTestFace(ctx, canvas.width, canvas.height);

            const testDuration = this.testConfigurations.shortTest;
            const startTime = performance.now();
            let completedBatches = 0;

            while (performance.now() - startTime < testDuration) {
                const batchStart = performance.now();
                
                // Simulate concurrent processing
                const promises = Array(level).fill(0).map(() => 
                    new Promise(resolve => {
                        this.faceLandmarker.detectForVideo(canvas, performance.now());
                        resolve();
                    })
                );

                await Promise.all(promises);
                completedBatches++;
            }

            const actualDuration = performance.now() - startTime;
            const throughput = (completedBatches * level / actualDuration) * 1000;

            results[level] = {
                level,
                throughput,
                completedBatches,
                efficiency: throughput / level // Efficiency per concurrent stream
            };
        }

        const scalingEfficiency = this.calculateScalingEfficiency(results);

        return {
            success: true,
            summary: `Peak throughput: ${Math.max(...Object.values(results).map(r => r.throughput)).toFixed(1)} FPS`,
            details: {
                results,
                scalingEfficiency,
                optimalConcurrency: Object.values(results).reduce((best, result) => 
                    result.efficiency > best.efficiency ? result : best
                )
            }
        };
    }

    /**
     * Memory leak detection benchmark
     */
    async benchmarkMemoryLeaks() {
        if (!performance.memory) {
            return { success: false, error: 'Memory API not available' };
        }

        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        this.drawTestFace(ctx, canvas.width, canvas.height);

        const memoryReadings = [];
        const iterations = 10;
        const framesPerIteration = 100;

        for (let i = 0; i < iterations; i++) {
            console.log(`   Iteration ${i + 1}/${iterations}...`);
            
            const startMemory = performance.memory.usedJSHeapSize;
            
            // Process frames
            for (let frame = 0; frame < framesPerIteration; frame++) {
                this.faceLandmarker.detectForVideo(canvas, performance.now());
            }

            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            await this.sleep(100); // Allow GC to run
            
            const endMemory = performance.memory.usedJSHeapSize;
            memoryReadings.push({
                iteration: i + 1,
                startMemory: startMemory / 1024 / 1024,
                endMemory: endMemory / 1024 / 1024,
                increase: (endMemory - startMemory) / 1024 / 1024
            });
        }

        // Analyze memory trend
        const memoryTrend = this.calculateMemoryTrend(memoryReadings);
        const hasLeak = memoryTrend.slope > 1; // More than 1MB per iteration suggests a leak
        const totalIncrease = memoryReadings[memoryReadings.length - 1].endMemory - memoryReadings[0].startMemory;

        return {
            success: !hasLeak,
            summary: `Memory trend: ${memoryTrend.slope.toFixed(2)}MB/iteration, Total: ${totalIncrease.toFixed(2)}MB`,
            details: {
                memoryReadings,
                memoryTrend,
                hasLeak,
                totalIncrease,
                recommendation: hasLeak ? 'Potential memory leak detected' : 'Memory usage appears stable'
            }
        };
    }

    /**
     * GPU vs CPU performance comparison
     */
    async benchmarkGpuVsCpu() {
        const configs = [
            { name: 'GPU', delegate: 'GPU' },
            { name: 'CPU', delegate: 'CPU' }
        ];

        const results = {};

        for (const config of configs) {
            console.log(`   Testing ${config.name} delegate...`);
            
            try {
                // Create new instance with specific delegate
                if (this.faceLandmarker && this.faceLandmarker.close) {
                    this.faceLandmarker.close();
                }

                const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0');
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );

                const initStart = performance.now();
                this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                        delegate: config.delegate
                    },
                    runningMode: "VIDEO"
                });
                const initTime = performance.now() - initStart;

                // Benchmark processing
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 480;
                const ctx = canvas.getContext('2d');
                this.drawTestFace(ctx, canvas.width, canvas.height);

                const testDuration = this.testConfigurations.shortTest;
                const startTime = performance.now();
                let frameCount = 0;
                const frameTimes = [];

                while (performance.now() - startTime < testDuration) {
                    const frameStart = performance.now();
                    this.faceLandmarker.detectForVideo(canvas, frameStart);
                    const frameTime = performance.now() - frameStart;
                    frameTimes.push(frameTime);
                    frameCount++;
                }

                const actualDuration = performance.now() - startTime;
                const avgFps = (frameCount / actualDuration) * 1000;
                const avgLatency = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;

                results[config.name] = {
                    delegate: config.delegate,
                    initTime,
                    avgFps,
                    avgLatency,
                    frameCount,
                    performance: avgFps / avgLatency // Performance ratio
                };

            } catch (error) {
                results[config.name] = {
                    delegate: config.delegate,
                    error: error.message
                };
            }
        }

        const hasGpu = results.GPU && !results.GPU.error;
        const hasCpu = results.CPU && !results.CPU.error;
        
        let comparison = 'N/A';
        if (hasGpu && hasCpu) {
            const speedup = results.GPU.avgFps / results.CPU.avgFps;
            comparison = `GPU is ${speedup.toFixed(2)}x faster than CPU`;
        }

        return {
            success: hasGpu || hasCpu,
            summary: comparison,
            details: {
                results,
                recommendation: hasGpu ? 'GPU acceleration available and recommended' : 'Consider GPU acceleration for better performance'
            }
        };
    }

    /**
     * Real-time performance benchmark
     */
    async benchmarkRealTime() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        const targetFps = 30;
        const frameInterval = 1000 / targetFps;
        const testDuration = this.testConfigurations.standardTest;

        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        this.drawTestFace(ctx, canvas.width, canvas.height);

        const frameMetrics = [];
        let lastFrameTime = performance.now();
        let droppedFrames = 0;
        let totalFrames = 0;

        const startTime = performance.now();

        // Simulate real-time processing
        while (performance.now() - startTime < testDuration) {
            const currentTime = performance.now();
            const timeSinceLastFrame = currentTime - lastFrameTime;

            if (timeSinceLastFrame >= frameInterval) {
                const processingStart = performance.now();
                this.faceLandmarker.detectForVideo(canvas, processingStart);
                const processingTime = performance.now() - processingStart;

                frameMetrics.push({
                    frameTime: timeSinceLastFrame,
                    processingTime,
                    timestamp: currentTime - startTime
                });

                // Check if we can maintain real-time
                if (processingTime > frameInterval) {
                    droppedFrames++;
                }

                lastFrameTime = currentTime;
                totalFrames++;
            }
        }

        const actualFps = (totalFrames / testDuration) * 1000;
        const avgProcessingTime = frameMetrics.reduce((sum, m) => sum + m.processingTime, 0) / frameMetrics.length;
        const realTimeCapable = droppedFrames / totalFrames < 0.05; // Less than 5% dropped frames
        const frameTimeJitter = this.calculateJitter(frameMetrics.map(m => m.frameTime));

        return {
            success: realTimeCapable,
            summary: `${actualFps.toFixed(1)} FPS, ${droppedFrames} dropped frames (${((droppedFrames/totalFrames)*100).toFixed(1)}%)`,
            details: {
                actualFps,
                targetFps,
                avgProcessingTime,
                droppedFrames,
                totalFrames,
                realTimeCapable,
                frameTimeJitter,
                consistency: frameTimeJitter < 5 ? 'Excellent' : frameTimeJitter < 10 ? 'Good' : 'Poor'
            }
        };
    }

    /**
     * Battery impact analysis (approximation)
     */
    async benchmarkBatteryImpact() {
        // This is an approximation based on processing intensity
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        this.drawTestFace(ctx, canvas.width, canvas.height);

        const testDuration = this.testConfigurations.shortTest;
        const startTime = performance.now();
        let frameCount = 0;

        // Monitor CPU-intensive operations
        while (performance.now() - startTime < testDuration) {
            this.faceLandmarker.detectForVideo(canvas, performance.now());
            frameCount++;
        }

        const actualDuration = performance.now() - startTime;
        const avgFps = (frameCount / actualDuration) * 1000;
        
        // Battery impact estimation (simplified)
        const processingIntensity = avgFps * 0.01; // Arbitrary scaling
        const estimatedBatteryDrainPerHour = processingIntensity * 3.6; // Estimated %/hour

        const batteryImpact = estimatedBatteryDrainPerHour < 10 ? 'Low' : 
                             estimatedBatteryDrainPerHour < 20 ? 'Medium' : 'High';

        return {
            success: true,
            summary: `Estimated battery impact: ${batteryImpact} (~${estimatedBatteryDrainPerHour.toFixed(1)}%/hour)`,
            details: {
                avgFps,
                processingIntensity,
                estimatedBatteryDrainPerHour,
                batteryImpact,
                recommendation: batteryImpact === 'High' ? 'Consider power optimization' : 'Battery usage acceptable'
            }
        };
    }

    // Utility methods

    drawTestFace(ctx, width, height, rotation = 0) {
        ctx.fillStyle = '#F4C2A1';
        ctx.fillRect(0, 0, width, height);
        
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        
        // Face
        ctx.fillStyle = '#E8B898';
        ctx.beginPath();
        ctx.ellipse(0, 0, width / 4, height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-width / 8, -height / 12, 8, 0, Math.PI * 2);
        ctx.arc(width / 8, -height / 12, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.beginPath();
        ctx.ellipse(0, height / 8, 30, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    getMemoryUsage() {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
    }

    getPerformanceGrade(fps, latency) {
        const thresholds = this.testConfigurations.thresholds;
        
        if (fps >= thresholds.excellent.fps && latency <= thresholds.excellent.latency) {
            return 'Excellent';
        } else if (fps >= thresholds.good.fps && latency <= thresholds.good.latency) {
            return 'Good';
        } else if (fps >= thresholds.acceptable.fps && latency <= thresholds.acceptable.latency) {
            return 'Acceptable';
        } else {
            return 'Poor';
        }
    }

    calculateConsistency(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const coefficient = (stdDev / mean) * 100;
        
        return {
            mean,
            stdDev,
            coefficientOfVariation: coefficient,
            consistency: coefficient < 10 ? 'Excellent' : coefficient < 20 ? 'Good' : 'Poor'
        };
    }

    analyzeFrameTimeDistribution(frameTimes) {
        const sorted = [...frameTimes].sort((a, b) => a - b);
        const percentiles = {
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p90: sorted[Math.floor(sorted.length * 0.9)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
        
        return {
            min: Math.min(...frameTimes),
            max: Math.max(...frameTimes),
            percentiles
        };
    }

    isMemoryStable(snapshots) {
        if (snapshots.length < 3) return true;
        
        const memoryValues = snapshots.map(s => s.used);
        const trend = this.calculateTrend(memoryValues);
        
        // Memory is stable if trend is less than 1MB per snapshot
        return Math.abs(trend) < 1024 * 1024;
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = (n * (n + 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, idx) => sum + val * (idx + 1), 0);
        const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    calculateEfficiencyScore(width, height, fps, latency) {
        const pixelThroughput = (width * height * fps) / 1000000; // MPix/s
        const efficiency = pixelThroughput / latency; // MPix/s per ms latency
        return efficiency;
    }

    calculateScalingEfficiency(results) {
        const efficiencies = Object.values(results).map(r => r.efficiency);
        const baselineEfficiency = efficiencies[0];
        
        return efficiencies.map((eff, idx) => ({
            level: Object.values(results)[idx].level,
            efficiency: eff,
            scalingFactor: eff / baselineEfficiency
        }));
    }

    calculateMemoryTrend(readings) {
        const increases = readings.map(r => r.increase);
        const avg = increases.reduce((sum, inc) => sum + inc, 0) / increases.length;
        const slope = this.calculateTrend(readings.map(r => r.endMemory));
        
        return { average: avg, slope, trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable' };
    }

    calculateJitter(values) {
        if (values.length < 2) return 0;
        
        const differences = [];
        for (let i = 1; i < values.length; i++) {
            differences.push(Math.abs(values[i] - values[i-1]));
        }
        
        return differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    }

    generateResolutionRecommendations(results) {
        const recommendations = [];
        
        Object.entries(results).forEach(([name, result]) => {
            if (result.avgFps < 20) {
                recommendations.push(`${name}: Performance below acceptable threshold`);
            } else if (result.avgFps > 50) {
                recommendations.push(`${name}: Excellent performance, suitable for high-demand applications`);
            }
        });
        
        return recommendations;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport(completed, total) {
        const percentage = ((completed / total) * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(100));
        console.log('🚀 MEDIAPIPE FACE LANDMARKER v2 - PERFORMANCE BENCHMARK REPORT');
        console.log('='.repeat(100));
        console.log(`\n📊 Benchmark Completion: ${completed}/${total} benchmarks completed (${percentage}%)\n`);

        // Overall performance summary
        const performanceScores = [];
        
        Object.entries(this.benchmarkResults).forEach(([testName, result]) => {
            console.log(`🔍 ${testName}:`);
            if (result.success) {
                console.log(`   ✅ ${result.summary}`);
                if (result.details) {
                    const details = this.formatDetails(result.details);
                    details.forEach(detail => console.log(`   📋 ${detail}`));
                }
            } else {
                console.log(`   ❌ ${result.error || 'Test failed'}`);
            }
            console.log('');
        });

        // Performance recommendations
        console.log('💡 PERFORMANCE RECOMMENDATIONS:');
        this.generatePerformanceRecommendations();
        
        // System configuration summary
        console.log('\n🖥️  SYSTEM CONFIGURATION:');
        console.log(`   • Browser: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
        console.log(`   • Platform: ${navigator.platform}`);
        console.log(`   • CPU Cores: ${navigator.hardwareConcurrency || 'Unknown'}`);
        console.log(`   • Memory: ${performance.memory ? (performance.memory.jsHeapSizeLimit / 1024 / 1024 / 1024).toFixed(2) + 'GB' : 'Unknown'}`);
        console.log(`   • WebGL: ${this.checkWebGLSupport()}`);
        
        console.log('\n' + '='.repeat(100) + '\n');
    }

    formatDetails(details) {
        const formatted = [];
        
        Object.entries(details).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                formatted.push(`${key}: ${JSON.stringify(value, null, 2).replace(/\n/g, ' ')}`);
            } else if (typeof value === 'number') {
                formatted.push(`${key}: ${value.toFixed ? value.toFixed(2) : value}`);
            } else {
                formatted.push(`${key}: ${value}`);
            }
        });
        
        return formatted.slice(0, 5); // Limit details to prevent clutter
    }

    generatePerformanceRecommendations() {
        const recommendations = [];
        
        // Analyze benchmark results for recommendations
        if (this.benchmarkResults['Frame Processing Speed']) {
            const fps = this.benchmarkResults['Frame Processing Speed'].details?.fps || 0;
            if (fps < 20) {
                recommendations.push('Consider reducing input resolution for better performance');
            }
            if (fps > 60) {
                recommendations.push('Performance is excellent - suitable for high-end applications');
            }
        }
        
        if (this.benchmarkResults['Memory Usage Analysis']) {
            const memoryIncrease = this.benchmarkResults['Memory Usage Analysis'].details?.memoryIncrease || 0;
            if (memoryIncrease > 100) {
                recommendations.push('High memory usage detected - monitor for memory leaks');
            }
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Performance appears optimal for typical use cases');
        }
        
        recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    checkWebGLSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        return gl ? `${gl.getParameter(gl.VERSION)} (${gl.getParameter(gl.RENDERER)})` : 'Not supported';
    }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MediaPipePerformanceBenchmark };
}

// Auto-run benchmark if this script is executed directly
if (typeof window !== 'undefined' && window.document) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            const benchmark = new MediaPipePerformanceBenchmark();
            await benchmark.runBenchmarkSuite();
        });
    } else {
        const benchmark = new MediaPipePerformanceBenchmark();
        benchmark.runBenchmarkSuite();
    }
}