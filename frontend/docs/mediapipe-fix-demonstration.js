/**
 * MediaPipe Fixed Implementation Demonstration
 * Shows the correct usage pattern for the fixed MediaPipe Manager
 */

// Example 1: Basic initialization and face detection
async function demonstrateBasicUsage() {
    console.log('🚀 MediaPipe Fixed Implementation Demonstration');
    
    try {
        // Import the fixed MediaPipe Manager
        const { default: MediaPipeManager } = await import('../src/utils/MediaPipeManager.js');
        
        // Create instance
        const mediaManager = new MediaPipeManager();
        console.log('✅ MediaPipe Manager instance created');
        
        // Initialize using the correct FilesetResolver pattern
        console.log('🔄 Initializing MediaPipe with FilesetResolver...');
        const success = await mediaManager.initialize();
        
        if (success) {
            console.log('✅ MediaPipe initialized successfully!');
            
            // Get status information
            const status = mediaManager.getStatus();
            console.log('📊 MediaPipe Status:', status);
            
            // Test with a sample image (you would provide a real image)
            const results = await mediaManager.analyzeFace('path/to/image.jpg');
            console.log('👤 Face analysis results:', results);
            
            // Clean up when done
            mediaManager.dispose();
            console.log('🧹 MediaPipe disposed');
            
        } else {
            console.error('❌ MediaPipe initialization failed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Example 2: Advanced usage with error handling and performance monitoring
async function demonstrateAdvancedUsage() {
    console.log('🔬 Advanced MediaPipe Usage Demonstration');
    
    const mediaManager = new (await import('../src/utils/MediaPipeManager.js')).default();
    
    try {
        // Initialize with performance monitoring
        const startTime = performance.now();
        await mediaManager.initialize();
        const initTime = performance.now() - startTime;
        
        console.log(`⚡ Initialization completed in ${initTime.toFixed(2)}ms`);
        
        // Get detailed diagnostics
        const diagnostics = mediaManager.getConnectionDiagnostics();
        console.log('🔍 Connection diagnostics:', diagnostics);
        
        // Simulate face analysis with multiple images
        const testImages = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
        
        for (const imagePath of testImages) {
            try {
                const analysisStart = performance.now();
                const results = await mediaManager.analyzeFace(imagePath, { includeDebug: true });
                const analysisTime = performance.now() - analysisStart;
                
                console.log(`📊 Analysis of ${imagePath}:`);
                console.log(`  - Face detected: ${results.hasFace}`);
                console.log(`  - Landmarks: ${results.debug?.landmarkCount || 0}`);
                console.log(`  - Time: ${analysisTime.toFixed(2)}ms`);
                console.log(`  - Confidence: ${(results.confidence * 100).toFixed(1)}%`);
                
            } catch (analysisError) {
                console.warn(`⚠️ Analysis failed for ${imagePath}:`, analysisError.message);
            }
        }
        
        // Get final performance metrics
        const finalStatus = mediaManager.getStatus();
        console.log('📈 Final performance metrics:', finalStatus.performanceMetrics);
        
    } catch (error) {
        console.error('❌ Advanced usage error:', error);
        
        // Attempt recovery
        if (mediaManager.retryCount < mediaManager.maxRetries) {
            console.log('🔄 Attempting recovery...');
            try {
                await mediaManager.reinitialize();
                console.log('✅ Recovery successful');
            } catch (recoveryError) {
                console.error('❌ Recovery failed:', recoveryError);
            }
        }
        
    } finally {
        mediaManager.dispose();
    }
}

// Example 3: Integration with existing viseme analysis system
async function demonstrateVisemeIntegration() {
    console.log('👄 MediaPipe Viseme Integration Demonstration');
    
    const mediaManager = new (await import('../src/utils/MediaPipeManager.js')).default();
    
    try {
        await mediaManager.initialize();
        
        // Simulate video frame processing for lip sync
        const processVideoFrame = async (videoElement) => {
            try {
                // Analyze current frame
                const results = await mediaManager.analyzeFace(videoElement);
                
                if (results.hasFace && results.faceBlendshapes.length > 0) {
                    const blendshapes = results.faceBlendshapes[0].categories;
                    
                    // Extract viseme-relevant blendshapes
                    const visemeData = {
                        mouthOpen: blendshapes.find(b => b.categoryName === 'jawOpen')?.score || 0,
                        mouthWide: blendshapes.find(b => b.categoryName === 'mouthStretchLeft')?.score || 0,
                        lipsPucker: blendshapes.find(b => b.categoryName === 'mouthPucker')?.score || 0,
                        timestamp: results.timestamp
                    };
                    
                    console.log('👄 Viseme data:', visemeData);
                    return visemeData;
                }
                
            } catch (error) {
                console.warn('⚠️ Frame processing error:', error.message);
                return null;
            }
        };
        
        // Example: Process a single frame (in real usage, you'd call this repeatedly)
        // const videoElement = document.getElementById('myVideo');
        // const visemeData = await processVideoFrame(videoElement);
        
        console.log('👄 Viseme integration ready');
        
    } catch (error) {
        console.error('❌ Viseme integration error:', error);
    } finally {
        mediaManager.dispose();
    }
}

// Export demonstration functions
export {
    demonstrateBasicUsage,
    demonstrateAdvancedUsage,
    demonstrateVisemeIntegration
};

// Auto-run basic demonstration if loaded directly
if (typeof window !== 'undefined') {
    window.mediaPipeDemo = {
        basic: demonstrateBasicUsage,
        advanced: demonstrateAdvancedUsage,
        viseme: demonstrateVisemeIntegration
    };
    
    console.log('📋 MediaPipe demonstrations available:');
    console.log('  - window.mediaPipeDemo.basic()');
    console.log('  - window.mediaPipeDemo.advanced()');
    console.log('  - window.mediaPipeDemo.viseme()');
}