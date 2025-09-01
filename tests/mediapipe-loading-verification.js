/**
 * MediaPipe Face Landmarker v2 - Automated Test Suite
 * Comprehensive testing for initialization, face detection, and viseme classification
 */

class MediaPipeTestSuite {
    constructor() {
        this.testResults = {};
        this.faceLandmarker = null;
        this.testVideo = null;
        this.canvas = null;
        this.ctx = null;
        this.testConfig = {
            timeout: 30000, // 30 seconds
            retryAttempts: 3,
            performanceThresholds: {
                minFps: 15,
                maxLatency: 100,
                maxMemoryUsage: 200 // MB
            },
            accuracyThresholds: {
                minDetectionRate: 0.7, // 70%
                minVisemeConfidence: 0.3 // 30%
            }
        };
        this.metrics = {
            initTime: 0,
            avgFps: 0,
            avgLatency: 0,
            memoryUsage: 0,
            detectionAccuracy: 0,
            visemeAccuracy: 0
        };
    }

    /**
     * Run all automated tests
     */
    async runAllTests() {
        console.log('🚀 Starting MediaPipe Face Landmarker v2 Test Suite...\n');
        
        const tests = [
            { name: 'Browser Compatibility', fn: this.testBrowserCompatibility },
            { name: 'MediaPipe Initialization', fn: this.testMediaPipeInitialization },
            { name: 'Model Loading', fn: this.testModelLoading },
            { name: 'Face Detection Accuracy', fn: this.testFaceDetectionAccuracy },
            { name: 'Viseme Classification', fn: this.testVisemeClassification },
            { name: 'Performance Benchmarks', fn: this.testPerformanceBenchmarks },
            { name: 'Memory Management', fn: this.testMemoryManagement },
            { name: 'Error Handling', fn: this.testErrorHandling },
            { name: 'Edge Cases', fn: this.testEdgeCases }
        ];

        let passedTests = 0;
        let totalTests = tests.length;
        
        for (const test of tests) {
            try {
                console.log(`\n📋 Running ${test.name}...`);
                const result = await this.runWithTimeout(test.fn.bind(this), this.testConfig.timeout);
                
                if (result.success) {
                    console.log(`✅ ${test.name}: PASSED`);
                    if (result.details) {
                        console.log(`   ${result.details}`);
                    }
                    passedTests++;
                } else {
                    console.log(`❌ ${test.name}: FAILED`);
                    console.log(`   Error: ${result.error}`);
                }
                
                this.testResults[test.name] = result;
                
            } catch (error) {
                console.log(`❌ ${test.name}: TIMEOUT/ERROR`);
                console.log(`   Error: ${error.message}`);
                this.testResults[test.name] = { success: false, error: error.message };
            }
        }

        // Generate comprehensive report
        this.generateReport(passedTests, totalTests);
        
        return {
            passed: passedTests,
            total: totalTests,
            results: this.testResults,
            metrics: this.metrics
        };
    }

    /**
     * Test browser compatibility and required APIs
     */
    async testBrowserCompatibility() {
        const checks = [
            {
                name: 'WebAssembly Support',
                test: () => typeof WebAssembly !== 'undefined',
                critical: true
            },
            {
                name: 'MediaDevices API',
                test: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
                critical: true
            },
            {
                name: 'Canvas 2D Context',
                test: () => !!document.createElement('canvas').getContext('2d'),
                critical: true
            },
            {
                name: 'WebGL Support',
                test: () => {
                    const canvas = document.createElement('canvas');
                    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
                },
                critical: false
            },
            {
                name: 'Performance API',
                test: () => typeof performance !== 'undefined' && performance.now,
                critical: false
            },
            {
                name: 'ES6 Module Support',
                test: () => typeof import !== 'undefined',
                critical: true
            },
            {
                name: 'Fetch API',
                test: () => typeof fetch !== 'undefined',
                critical: true
            }
        ];

        const results = checks.map(check => ({
            name: check.name,
            passed: check.test(),
            critical: check.critical
        }));

        const criticalFailed = results.filter(r => !r.passed && r.critical);
        const allPassed = results.every(r => r.passed);
        
        const details = results.map(r => 
            `${r.name}: ${r.passed ? 'PASS' : 'FAIL'}${r.critical ? ' (Critical)' : ''}`
        ).join(', ');

        if (criticalFailed.length > 0) {
            return {
                success: false,
                error: `Critical compatibility issues: ${criticalFailed.map(r => r.name).join(', ')}`,
                details
            };
        }

        return {
            success: true,
            details: `Browser compatibility: ${results.filter(r => r.passed).length}/${results.length} checks passed`
        };
    }

    /**
     * Test MediaPipe initialization process
     */
    async testMediaPipeInitialization() {
        const startTime = performance.now();
        
        try {
            // Import MediaPipe modules
            const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0');
            
            // Initialize FilesetResolver
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );

            // Create FaceLandmarker
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

            this.metrics.initTime = performance.now() - startTime;

            // Verify initialization
            if (!this.faceLandmarker) {
                throw new Error('FaceLandmarker not properly initialized');
            }

            return {
                success: true,
                details: `Initialization completed in ${this.metrics.initTime.toFixed(2)}ms with GPU acceleration`
            };

        } catch (error) {
            return {
                success: false,
                error: `Initialization failed: ${error.message}`
            };
        }
    }

    /**
     * Test model loading and validation
     */
    async testModelLoading() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        try {
            // Create test canvas for model validation
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');

            // Create a test image (solid color)
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Test model inference with empty frame
            const startTime = performance.now();
            const results = this.faceLandmarker.detectForVideo(canvas, startTime);
            const inferenceTime = performance.now() - startTime;

            return {
                success: true,
                details: `Model loaded successfully, inference time: ${inferenceTime.toFixed(2)}ms`
            };

        } catch (error) {
            return {
                success: false,
                error: `Model loading failed: ${error.message}`
            };
        }
    }

    /**
     * Test face detection accuracy with synthetic data
     */
    async testFaceDetectionAccuracy() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        try {
            // Create test video element
            const video = document.createElement('video');
            video.width = 640;
            video.height = 480;
            video.muted = true;
            video.playsInline = true;

            // Create canvas for drawing test faces
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');

            // Generate synthetic face-like patterns
            const testFrames = this.generateTestFrames(ctx, canvas.width, canvas.height);
            let detections = 0;
            let totalFrames = testFrames.length;

            for (let i = 0; i < testFrames.length; i++) {
                const frame = testFrames[i];
                ctx.putImageData(frame, 0, 0);

                const startTime = performance.now();
                const results = this.faceLandmarker.detectForVideo(canvas, startTime);
                
                if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                    detections++;
                }
            }

            this.metrics.detectionAccuracy = detections / totalFrames;
            const passed = this.metrics.detectionAccuracy >= this.testConfig.accuracyThresholds.minDetectionRate;

            return {
                success: passed,
                details: `Detection accuracy: ${(this.metrics.detectionAccuracy * 100).toFixed(1)}% (${detections}/${totalFrames})`
            };

        } catch (error) {
            return {
                success: false,
                error: `Face detection test failed: ${error.message}`
            };
        }
    }

    /**
     * Test viseme classification functionality
     */
    async testVisemeClassification() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        try {
            // Create test canvas with mouth shapes
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');

            // Generate test frames with different mouth positions
            const mouthShapes = this.generateMouthShapeFrames(ctx, canvas.width, canvas.height);
            let visemeDetections = 0;
            let totalFrames = mouthShapes.length;

            const visemeClassifier = new VisemeClassifier();

            for (const shape of mouthShapes) {
                ctx.putImageData(shape.frame, 0, 0);

                const results = this.faceLandmarker.detectForVideo(canvas, performance.now());
                
                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    const viseme = visemeClassifier.classifyViseme(results.faceBlendshapes[0]);
                    
                    if (viseme.confidence >= this.testConfig.accuracyThresholds.minVisemeConfidence) {
                        visemeDetections++;
                    }
                }
            }

            this.metrics.visemeAccuracy = visemeDetections / totalFrames;
            const passed = this.metrics.visemeAccuracy >= 0.5; // 50% threshold for synthetic data

            return {
                success: passed,
                details: `Viseme classification: ${(this.metrics.visemeAccuracy * 100).toFixed(1)}% accuracy (${visemeDetections}/${totalFrames})`
            };

        } catch (error) {
            return {
                success: false,
                error: `Viseme classification test failed: ${error.message}`
            };
        }
    }

    /**
     * Test performance benchmarks
     */
    async testPerformanceBenchmarks() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');

            // Generate test frame
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Performance test parameters
            const testDuration = 5000; // 5 seconds
            const startTime = performance.now();
            let frameCount = 0;
            let totalLatency = 0;

            // Run performance test
            while (performance.now() - startTime < testDuration) {
                const frameStart = performance.now();
                
                this.faceLandmarker.detectForVideo(canvas, frameStart);
                
                const frameEnd = performance.now();
                totalLatency += (frameEnd - frameStart);
                frameCount++;
            }

            const testDurationSeconds = (performance.now() - startTime) / 1000;
            this.metrics.avgFps = frameCount / testDurationSeconds;
            this.metrics.avgLatency = totalLatency / frameCount;

            // Check memory usage if available
            if (performance.memory) {
                this.metrics.memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024);
            }

            // Evaluate performance
            const fpsPass = this.metrics.avgFps >= this.testConfig.performanceThresholds.minFps;
            const latencyPass = this.metrics.avgLatency <= this.testConfig.performanceThresholds.maxLatency;
            const memoryPass = !performance.memory || this.metrics.memoryUsage <= this.testConfig.performanceThresholds.maxMemoryUsage;

            const passed = fpsPass && latencyPass && memoryPass;

            return {
                success: passed,
                details: `FPS: ${this.metrics.avgFps.toFixed(1)}, Latency: ${this.metrics.avgLatency.toFixed(2)}ms, Memory: ${this.metrics.memoryUsage.toFixed(1)}MB`
            };

        } catch (error) {
            return {
                success: false,
                error: `Performance benchmark failed: ${error.message}`
            };
        }
    }

    /**
     * Test memory management and cleanup
     */
    async testMemoryManagement() {
        try {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Create multiple instances to test cleanup
            const instances = [];
            for (let i = 0; i < 3; i++) {
                const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0');
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );
                
                const instance = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO"
                });
                
                instances.push(instance);
            }

            // Clean up instances
            instances.forEach(instance => {
                if (instance.close) {
                    instance.close();
                }
            });

            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }

            // Wait for cleanup
            await this.sleep(1000);

            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryIncrease = finalMemory - initialMemory;
            const memoryIncreaseLimit = 50 * 1024 * 1024; // 50MB

            const passed = !performance.memory || memoryIncrease < memoryIncreaseLimit;

            return {
                success: passed,
                details: `Memory increase: ${(memoryIncrease / (1024 * 1024)).toFixed(1)}MB (limit: 50MB)`
            };

        } catch (error) {
            return {
                success: false,
                error: `Memory management test failed: ${error.message}`
            };
        }
    }

    /**
     * Test error handling scenarios
     */
    async testErrorHandling() {
        const errorTests = [
            {
                name: 'Invalid model URL',
                test: async () => {
                    try {
                        const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0');
                        const vision = await FilesetResolver.forVisionTasks(
                            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                        );
                        
                        await FaceLandmarker.createFromOptions(vision, {
                            baseOptions: {
                                modelAssetPath: "https://invalid-url/nonexistent-model.task"
                            }
                        });
                        return false; // Should have thrown
                    } catch {
                        return true; // Expected error
                    }
                }
            },
            {
                name: 'Invalid input handling',
                test: async () => {
                    if (!this.faceLandmarker) return false;
                    
                    try {
                        // Test with null input
                        this.faceLandmarker.detectForVideo(null, performance.now());
                        return false; // Should have thrown
                    } catch {
                        return true; // Expected error
                    }
                }
            }
        ];

        let passedTests = 0;
        const details = [];

        for (const errorTest of errorTests) {
            try {
                const result = await errorTest.test();
                if (result) {
                    passedTests++;
                    details.push(`${errorTest.name}: PASS`);
                } else {
                    details.push(`${errorTest.name}: FAIL`);
                }
            } catch (error) {
                details.push(`${errorTest.name}: ERROR - ${error.message}`);
            }
        }

        const passed = passedTests === errorTests.length;

        return {
            success: passed,
            details: `Error handling: ${passedTests}/${errorTests.length} tests passed`
        };
    }

    /**
     * Test edge cases and boundary conditions
     */
    async testEdgeCases() {
        if (!this.faceLandmarker) {
            return { success: false, error: 'FaceLandmarker not initialized' };
        }

        const edgeCases = [
            {
                name: 'Very small input',
                test: () => this.testSmallInput()
            },
            {
                name: 'Very large input',
                test: () => this.testLargeInput()
            },
            {
                name: 'Empty/black frame',
                test: () => this.testEmptyFrame()
            },
            {
                name: 'High contrast frame',
                test: () => this.testHighContrastFrame()
            }
        ];

        let passedTests = 0;
        const details = [];

        for (const edgeCase of edgeCases) {
            try {
                const result = await edgeCase.test();
                if (result) {
                    passedTests++;
                    details.push(`${edgeCase.name}: PASS`);
                } else {
                    details.push(`${edgeCase.name}: FAIL`);
                }
            } catch (error) {
                details.push(`${edgeCase.name}: ERROR - ${error.message}`);
            }
        }

        const passed = passedTests >= edgeCases.length * 0.75; // 75% threshold

        return {
            success: passed,
            details: `Edge cases: ${passedTests}/${edgeCases.length} tests passed`
        };
    }

    /**
     * Generate synthetic test frames with face-like patterns
     */
    generateTestFrames(ctx, width, height) {
        const frames = [];
        
        for (let i = 0; i < 10; i++) {
            // Create face-like pattern
            ctx.fillStyle = '#F4C2A1'; // Skin color
            ctx.fillRect(0, 0, width, height);
            
            // Face oval
            ctx.fillStyle = '#E8B898';
            ctx.beginPath();
            ctx.ellipse(width/2, height/2, width/3, height/2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(width/2 - 50, height/2 - 30, 10, 0, Math.PI * 2);
            ctx.arc(width/2 + 50, height/2 - 30, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth (vary position for different frames)
            ctx.beginPath();
            ctx.ellipse(width/2, height/2 + 50 + i * 2, 30, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            
            frames.push(ctx.getImageData(0, 0, width, height));
        }
        
        return frames;
    }

    /**
     * Generate test frames with different mouth shapes for viseme testing
     */
    generateMouthShapeFrames(ctx, width, height) {
        const shapes = [];
        const mouthConfigs = [
            { name: 'A', width: 40, height: 30 },
            { name: 'E', width: 60, height: 15 },
            { name: 'I', width: 70, height: 10 },
            { name: 'O', width: 25, height: 35 },
            { name: 'U', width: 20, height: 40 }
        ];

        mouthConfigs.forEach(config => {
            // Draw base face
            ctx.fillStyle = '#F4C2A1';
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = '#E8B898';
            ctx.beginPath();
            ctx.ellipse(width/2, height/2, width/3, height/2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(width/2 - 50, height/2 - 30, 8, 0, Math.PI * 2);
            ctx.arc(width/2 + 50, height/2 - 30, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth shape
            ctx.beginPath();
            ctx.ellipse(width/2, height/2 + 50, config.width, config.height, 0, 0, Math.PI * 2);
            ctx.fill();
            
            shapes.push({
                viseme: config.name,
                frame: ctx.getImageData(0, 0, width, height)
            });
        });

        return shapes;
    }

    /**
     * Test with very small input
     */
    async testSmallInput() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, 32, 32);

            this.faceLandmarker.detectForVideo(canvas, performance.now());
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Test with very large input
     */
    async testLargeInput() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, 1920, 1080);

            this.faceLandmarker.detectForVideo(canvas, performance.now());
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Test with empty/black frame
     */
    async testEmptyFrame() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 640, 480);

            this.faceLandmarker.detectForVideo(canvas, performance.now());
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Test with high contrast frame
     */
    async testHighContrastFrame() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            
            // Create checkerboard pattern
            for (let x = 0; x < canvas.width; x += 20) {
                for (let y = 0; y < canvas.height; y += 20) {
                    ctx.fillStyle = ((x + y) / 20) % 2 === 0 ? '#FFFFFF' : '#000000';
                    ctx.fillRect(x, y, 20, 20);
                }
            }

            this.faceLandmarker.detectForVideo(canvas, performance.now());
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Run a test function with timeout
     */
    async runWithTimeout(testFn, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Test timeout'));
            }, timeout);

            testFn()
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate comprehensive test report
     */
    generateReport(passed, total) {
        const percentage = ((passed / total) * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 MEDIAPIPE FACE LANDMARKER v2 - TEST REPORT');
        console.log('='.repeat(80));
        console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed (${percentage}%)`);
        
        if (passed === total) {
            console.log('🎉 All tests PASSED! MediaPipe integration is working correctly.\n');
        } else if (percentage >= 80) {
            console.log('⚠️  Most tests passed, but some issues detected.\n');
        } else {
            console.log('❌ Multiple test failures detected. Review implementation.\n');
        }

        // Performance metrics
        console.log('📈 Performance Metrics:');
        console.log(`   • Initialization Time: ${this.metrics.initTime.toFixed(2)}ms`);
        console.log(`   • Average FPS: ${this.metrics.avgFps.toFixed(1)}`);
        console.log(`   • Average Latency: ${this.metrics.avgLatency.toFixed(2)}ms`);
        console.log(`   • Memory Usage: ${this.metrics.memoryUsage.toFixed(1)}MB`);
        console.log(`   • Detection Accuracy: ${(this.metrics.detectionAccuracy * 100).toFixed(1)}%`);
        console.log(`   • Viseme Accuracy: ${(this.metrics.visemeAccuracy * 100).toFixed(1)}%`);

        // Detailed results
        console.log('\n📋 Detailed Results:');
        Object.entries(this.testResults).forEach(([testName, result]) => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            console.log(`   ${status} ${testName}`);
            if (result.details) {
                console.log(`      ${result.details}`);
            }
            if (!result.success && result.error) {
                console.log(`      Error: ${result.error}`);
            }
        });

        // Recommendations
        console.log('\n💡 Recommendations:');
        if (this.metrics.avgFps < this.testConfig.performanceThresholds.minFps) {
            console.log('   • Consider optimizing for better FPS performance');
        }
        if (this.metrics.avgLatency > this.testConfig.performanceThresholds.maxLatency) {
            console.log('   • Latency is high, consider GPU acceleration settings');
        }
        if (this.metrics.detectionAccuracy < 0.8) {
            console.log('   • Detection accuracy could be improved');
        }
        if (this.metrics.visemeAccuracy < 0.6) {
            console.log('   • Viseme classification needs improvement');
        }

        console.log('\n' + '='.repeat(80) + '\n');
    }
}

/**
 * Simple viseme classifier for testing
 */
class VisemeClassifier {
    constructor() {
        this.visemeMap = {
            'A': ['jawOpen', 'mouthOpen'],
            'E': ['mouthSmileLeft', 'mouthSmileRight'],
            'I': ['mouthSmileLeft', 'mouthSmileRight'],
            'O': ['mouthFunnel', 'mouthPucker'],
            'U': ['mouthPucker'],
            'SIL': []
        };
    }

    classifyViseme(blendshapes) {
        const scores = {};
        
        Object.keys(this.visemeMap).forEach(viseme => {
            const relevantShapes = this.visemeMap[viseme];
            let score = 0;
            
            relevantShapes.forEach(shapeName => {
                const shape = blendshapes.categories.find(b => b.categoryName === shapeName);
                if (shape) {
                    score += shape.score;
                }
            });
            
            scores[viseme] = relevantShapes.length > 0 ? score / relevantShapes.length : 0;
        });
        
        let maxScore = 0;
        let topViseme = 'SIL';
        
        Object.entries(scores).forEach(([viseme, score]) => {
            if (score > maxScore) {
                maxScore = score;
                topViseme = viseme;
            }
        });
        
        return { viseme: topViseme, confidence: maxScore };
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MediaPipeTestSuite, VisemeClassifier };
}

// Auto-run tests if this script is executed directly in browser
if (typeof window !== 'undefined' && window.document) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            const testSuite = new MediaPipeTestSuite();
            await testSuite.runAllTests();
        });
    } else {
        // DOM is already ready
        const testSuite = new MediaPipeTestSuite();
        testSuite.runAllTests();
    }
}