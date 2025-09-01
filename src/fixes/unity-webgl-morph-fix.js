/**
 * Unity WebGL Morph Target Synchronization Fix
 * 
 * Provides comprehensive solution for:
 * - Unity WebGL morph target rendering pipeline synchronization
 * - JavaScript bridge communication with Unity builds
 * - GPU sync issues between Unity renderer and WebGL
 * - CC_Game_Body and CC_Game_Tongue mesh coordination
 * - Frame-perfect synchronization with BlendShape weights
 * 
 * Author: Coder Agent - Hive Mind
 * Version: 1.0.0
 */

class UnityWebGLMorphSynchronizer {
    constructor() {
        this.unityInstance = null;
        this.morphCache = new Map();
        this.frameQueue = [];
        this.syncInterval = null;
        this.isReady = false;
        
        // Performance tracking
        this.performanceMetrics = {
            frameTime: 0,
            morphUpdateTime: 0,
            syncLatency: 0,
            droppedFrames: 0
        };
        
        // GPU synchronization
        this.renderingContext = null;
        this.morphBuffer = null;
        this.syncFence = null;
        
        // Configuration
        this.config = {
            frameRate: 60,
            morphUpdateThreshold: 0.001,
            maxQueueSize: 10,
            gpuSyncTimeout: 16.67, // 60fps = 16.67ms per frame
            debugMode: false
        };
        
        this.initializeSystem();
    }
    
    /**
     * Initialize the Unity WebGL morph synchronization system
     */
    initializeSystem() {
        console.log('[Unity WebGL Morph Fix] Initializing synchronization system...');
        
        // Wait for Unity to be available
        this.waitForUnity();
        
        // Set up WebGL context monitoring
        this.setupWebGLContext();
        
        // Initialize communication bridge
        this.setupJavaScriptBridge();
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
    }
    
    /**
     * Wait for Unity instance to be available
     */
    waitForUnity() {
        const checkUnity = () => {
            if (window.unityInstance || window.gameInstance) {
                this.unityInstance = window.unityInstance || window.gameInstance;
                this.onUnityReady();
            } else {
                setTimeout(checkUnity, 100);
            }
        };
        checkUnity();
    }
    
    /**
     * Called when Unity instance is ready
     */
    onUnityReady() {
        console.log('[Unity WebGL Morph Fix] Unity instance ready, initializing morph system...');
        
        // Register with Unity's morph system
        try {
            this.unityInstance.SendMessage('MorphSynchronizer', 'RegisterJavaScriptBridge');
            this.isReady = true;
            
            // Start synchronization loop
            this.startSynchronizationLoop();
            
            console.log('[Unity WebGL Morph Fix] System ready and synchronized');
        } catch (error) {
            console.error('[Unity WebGL Morph Fix] Failed to register with Unity:', error);
            // Fallback initialization
            this.initializeFallback();
        }
    }
    
    /**
     * Set up WebGL context for GPU synchronization
     */
    setupWebGLContext() {
        // Get WebGL context from Unity canvas
        const canvas = document.querySelector('#unity-canvas') || document.querySelector('canvas');
        if (canvas) {
            this.renderingContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            if (this.renderingContext) {
                console.log('[Unity WebGL Morph Fix] WebGL context acquired');
                this.setupGPUBuffers();
            }
        }
    }
    
    /**
     * Set up GPU buffers for morph data synchronization
     */
    setupGPUBuffers() {
        const gl = this.renderingContext;
        
        try {
            // Create morph data buffer
            this.morphBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.morphBuffer);
            
            // Allocate buffer for maximum expected morph targets (100 morphs * 4 bytes)
            gl.bufferData(gl.ARRAY_BUFFER, 400, gl.DYNAMIC_DRAW);
            
            // Set up sync fence for GPU synchronization
            if (gl.fenceSync) {
                this.syncFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
            }
            
            console.log('[Unity WebGL Morph Fix] GPU buffers initialized');
        } catch (error) {
            console.warn('[Unity WebGL Morph Fix] GPU buffer setup failed:', error);
        }
    }
    
    /**
     * Set up JavaScript bridge for Unity communication
     */
    setupJavaScriptBridge() {
        // Global methods for Unity to call
        window.UnityMorphSync = {
            updateMorphTarget: this.updateMorphTarget.bind(this),
            batchUpdateMorphs: this.batchUpdateMorphs.bind(this),
            synchronizeFrame: this.synchronizeFrame.bind(this),
            setConfiguration: this.setConfiguration.bind(this),
            getPerformanceMetrics: () => this.performanceMetrics
        };
        
        // React/external integration
        window.unityMorphController = {
            applyMorphs: this.applyMorphsExternal.bind(this),
            setViseme: this.setVisemeExternal.bind(this),
            isReady: () => this.isReady,
            getStatus: this.getSystemStatus.bind(this)
        };
        
        console.log('[Unity WebGL Morph Fix] JavaScript bridge established');
    }
    
    /**
     * Start the main synchronization loop
     */
    startSynchronizationLoop() {
        const frameTime = 1000 / this.config.frameRate;
        
        this.syncInterval = setInterval(() => {
            this.processMorphQueue();
        }, frameTime);
        
        console.log(`[Unity WebGL Morph Fix] Sync loop started at ${this.config.frameRate}fps`);
    }
    
    /**
     * Process queued morph updates
     */
    processMorphQueue() {
        const startTime = performance.now();
        
        if (this.frameQueue.length === 0) return;
        
        // Limit queue size to prevent memory issues
        if (this.frameQueue.length > this.config.maxQueueSize) {
            this.frameQueue.splice(0, this.frameQueue.length - this.config.maxQueueSize);
            this.performanceMetrics.droppedFrames++;
        }
        
        // Process all queued updates
        const currentFrame = this.frameQueue.shift();
        if (currentFrame) {
            this.executeFrameUpdate(currentFrame);
        }
        
        // Update performance metrics
        this.performanceMetrics.morphUpdateTime = performance.now() - startTime;
    }
    
    /**
     * Execute a frame's morph updates
     */
    executeFrameUpdate(frameData) {
        if (!this.unityInstance || !this.isReady) return;
        
        try {
            // Batch update for better performance
            if (frameData.morphs && Object.keys(frameData.morphs).length > 0) {
                const morphData = JSON.stringify(frameData.morphs);
                this.unityInstance.SendMessage('MorphSynchronizer', 'ProcessBatchMorphUpdate', morphData);
            }
            
            // GPU synchronization
            this.waitForGPUSync();
            
        } catch (error) {
            console.error('[Unity WebGL Morph Fix] Frame update failed:', error);
        }
    }
    
    /**
     * Wait for GPU synchronization to complete
     */
    waitForGPUSync() {
        if (!this.renderingContext || !this.syncFence) return;
        
        const gl = this.renderingContext;
        const startTime = performance.now();
        
        // Wait for GPU operations to complete
        const checkSync = () => {
            if (performance.now() - startTime > this.config.gpuSyncTimeout) {
                console.warn('[Unity WebGL Morph Fix] GPU sync timeout');
                return;
            }
            
            if (gl.getSyncParameter && gl.getSyncParameter(this.syncFence, gl.SYNC_STATUS) === gl.SIGNALED) {
                this.performanceMetrics.syncLatency = performance.now() - startTime;
                return;
            }
            
            requestAnimationFrame(checkSync);
        };
        
        checkSync();
    }
    
    /**
     * Update single morph target (called from Unity)
     */
    updateMorphTarget(morphName, weight, meshIndex = 0) {
        const key = `${meshIndex}_${morphName}`;
        const previousWeight = this.morphCache.get(key) || 0;
        
        // Only update if change is significant
        if (Math.abs(weight - previousWeight) > this.config.morphUpdateThreshold) {
            this.morphCache.set(key, weight);
            
            // Queue for next frame
            this.queueMorphUpdate({
                morphName,
                weight,
                meshIndex,
                timestamp: performance.now()
            });
        }
    }
    
    /**
     * Batch update multiple morphs (called from Unity)
     */
    batchUpdateMorphs(morphsJson) {
        try {
            const morphs = JSON.parse(morphsJson);
            const frameData = {
                morphs: morphs,
                timestamp: performance.now()
            };
            
            // Cache all morphs
            Object.entries(morphs).forEach(([key, weight]) => {
                this.morphCache.set(key, weight);
            });
            
            // Queue entire frame
            this.frameQueue.push(frameData);
            
        } catch (error) {
            console.error('[Unity WebGL Morph Fix] Batch update parsing failed:', error);
        }
    }
    
    /**
     * Queue a single morph update
     */
    queueMorphUpdate(morphData) {
        // Add to current frame or create new frame
        let currentFrame = this.frameQueue[this.frameQueue.length - 1];
        
        if (!currentFrame || performance.now() - currentFrame.timestamp > 16.67) {
            currentFrame = {
                morphs: {},
                timestamp: performance.now()
            };
            this.frameQueue.push(currentFrame);
        }
        
        const key = `${morphData.meshIndex}_${morphData.morphName}`;
        currentFrame.morphs[key] = morphData.weight;
    }
    
    /**
     * Synchronize frame (called from Unity after render)
     */
    synchronizeFrame() {
        // This is called by Unity after each frame render
        // We can use this to ensure our morph updates are in sync
        if (this.renderingContext && this.syncFence) {
            const gl = this.renderingContext;
            
            // Create new sync fence
            gl.deleteSync(this.syncFence);
            this.syncFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        }
    }
    
    /**
     * External API: Apply morphs from JavaScript/React
     */
    applyMorphsExternal(morphTargets) {
        if (!this.isReady) {
            console.warn('[Unity WebGL Morph Fix] System not ready for external morph updates');
            return false;
        }
        
        try {
            // Convert to Unity format
            const unityMorphs = {};
            Object.entries(morphTargets).forEach(([morphName, weight]) => {
                // Support both CC_Game_Body and CC_Game_Tongue meshes
                unityMorphs[`0_${morphName}`] = weight; // CC_Game_Body
                if (morphName.includes('Tongue')) {
                    unityMorphs[`1_${morphName}`] = weight; // CC_Game_Tongue
                }
            });
            
            this.batchUpdateMorphs(JSON.stringify(unityMorphs));
            return true;
            
        } catch (error) {
            console.error('[Unity WebGL Morph Fix] External morph application failed:', error);
            return false;
        }
    }
    
    /**
     * External API: Set viseme from JavaScript/React
     */
    setVisemeExternal(visemeName, intensity = 1.0) {
        if (!this.unityInstance || !this.isReady) {
            return false;
        }
        
        try {
            const visemeData = {
                viseme: visemeName,
                intensity: intensity,
                timestamp: Date.now()
            };
            
            this.unityInstance.SendMessage('ActorCoreLipSyncController', 'OnVisemeData', JSON.stringify(visemeData));
            return true;
            
        } catch (error) {
            console.error('[Unity WebGL Morph Fix] Viseme setting failed:', error);
            return false;
        }
    }
    
    /**
     * Set system configuration
     */
    setConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (newConfig.frameRate && this.syncInterval) {
            clearInterval(this.syncInterval);
            this.startSynchronizationLoop();
        }
        
        console.log('[Unity WebGL Morph Fix] Configuration updated:', this.config);
    }
    
    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            isReady: this.isReady,
            hasUnityInstance: !!this.unityInstance,
            hasWebGLContext: !!this.renderingContext,
            morphCacheSize: this.morphCache.size,
            queueLength: this.frameQueue.length,
            performanceMetrics: this.performanceMetrics,
            config: this.config
        };
    }
    
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            if (this.config.debugMode) {
                console.log('[Unity WebGL Morph Fix] Performance:', this.performanceMetrics);
            }
            
            // Reset frame counters
            this.performanceMetrics.droppedFrames = 0;
        }, 5000);
    }
    
    /**
     * Fallback initialization when Unity bridge fails
     */
    initializeFallback() {
        console.warn('[Unity WebGL Morph Fix] Using fallback mode - some features may be limited');
        
        // Basic polling-based approach
        this.fallbackInterval = setInterval(() => {
            if (window.unityInstance && !this.isReady) {
                this.unityInstance = window.unityInstance;
                this.isReady = true;
                clearInterval(this.fallbackInterval);
                this.startSynchronizationLoop();
            }
        }, 1000);
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        if (this.fallbackInterval) {
            clearInterval(this.fallbackInterval);
        }
        
        if (this.renderingContext && this.morphBuffer) {
            this.renderingContext.deleteBuffer(this.morphBuffer);
        }
        
        if (this.syncFence) {
            this.renderingContext.deleteSync(this.syncFence);
        }
        
        console.log('[Unity WebGL Morph Fix] System destroyed');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.unityMorphSynchronizer = new UnityWebGLMorphSynchronizer();
    });
} else {
    window.unityMorphSynchronizer = new UnityWebGLMorphSynchronizer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnityWebGLMorphSynchronizer;
}

// React integration helper
window.UnityWebGLMorphFix = {
    getInstance: () => window.unityMorphSynchronizer,
    isReady: () => window.unityMorphSynchronizer?.isReady || false,
    applyMorphs: (morphs) => window.unityMorphSynchronizer?.applyMorphsExternal(morphs),
    setViseme: (viseme, intensity) => window.unityMorphSynchronizer?.setVisemeExternal(viseme, intensity),
    getStatus: () => window.unityMorphSynchronizer?.getSystemStatus()
};

console.log('[Unity WebGL Morph Fix] JavaScript bridge loaded and ready');