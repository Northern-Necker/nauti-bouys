/**
 * Unity WebGL Morph Bridge - JavaScript Library for Unity WebGL
 * 
 * This .jslib file provides the bridge between Unity C# and JavaScript
 * for morph target synchronization in WebGL builds.
 * 
 * Place this file in: Assets/Plugins/WebGL/UnityWebGLMorphBridge.jslib
 */

mergeInto(LibraryManager.library, {
    
    // Register JavaScript bridge with Unity morph synchronizer
    RegisterJavaScriptBridge: function() {
        console.log('[Unity WebGL Morph Bridge] Registering JavaScript bridge...');
        
        // Ensure global namespace exists
        if (!window.UnityMorphBridge) {
            window.UnityMorphBridge = {
                isReady: false,
                morphCache: new Map(),
                performanceData: {
                    lastFPS: 0,
                    lastFrameTime: 0,
                    lastMorphTime: 0,
                    activeVisemes: 0
                },
                
                // Initialize the bridge
                init: function() {
                    this.isReady = true;
                    console.log('[Unity WebGL Morph Bridge] Bridge initialized and ready');
                    
                    // Notify external systems
                    if (window.onUnityMorphBridgeReady) {
                        window.onUnityMorphBridgeReady();
                    }
                    
                    // Dispatch custom event
                    var event = new CustomEvent('unityMorphBridgeReady', {
                        detail: { ready: true }
                    });
                    window.dispatchEvent(event);
                },
                
                // Apply morph update from external JavaScript
                updateMorph: function(morphKey, weight) {
                    if (!this.isReady) {
                        console.warn('[Unity WebGL Morph Bridge] Bridge not ready for morph updates');
                        return false;
                    }
                    
                    try {
                        // Cache the morph value
                        this.morphCache.set(morphKey, weight);
                        
                        // Send to Unity
                        SendMessage('MorphSynchronizer', 'UpdateSingleMorph', morphKey + '|' + weight);
                        return true;
                    } catch (error) {
                        console.error('[Unity WebGL Morph Bridge] Failed to update morph:', error);
                        return false;
                    }
                },
                
                // Apply batch morph updates
                updateMorphBatch: function(morphData) {
                    if (!this.isReady) {
                        console.warn('[Unity WebGL Morph Bridge] Bridge not ready for batch updates');
                        return false;
                    }
                    
                    try {
                        // Cache all morphs
                        Object.entries(morphData).forEach(([key, value]) => {
                            this.morphCache.set(key, value);
                        });
                        
                        // Send batch to Unity
                        var jsonData = JSON.stringify(morphData);
                        SendMessage('MorphSynchronizer', 'ProcessBatchMorphUpdate', jsonData);
                        return true;
                    } catch (error) {
                        console.error('[Unity WebGL Morph Bridge] Failed to update morph batch:', error);
                        return false;
                    }
                },
                
                // Get cached morph value
                getMorph: function(morphKey) {
                    return this.morphCache.get(morphKey) || 0.0;
                },
                
                // Get all cached morphs
                getAllMorphs: function() {
                    var morphs = {};
                    this.morphCache.forEach((value, key) => {
                        morphs[key] = value;
                    });
                    return morphs;
                },
                
                // Clear morph cache
                clearCache: function() {
                    this.morphCache.clear();
                    console.log('[Unity WebGL Morph Bridge] Morph cache cleared');
                },
                
                // Get bridge status
                getStatus: function() {
                    return {
                        ready: this.isReady,
                        morphCount: this.morphCache.size,
                        performance: this.performanceData
                    };
                }
            };
        }
        
        // Initialize the bridge
        window.UnityMorphBridge.init();
        
        // Expose global methods for external use
        window.setUnityMorph = function(morphKey, weight) {
            return window.UnityMorphBridge.updateMorph(morphKey, weight);
        };
        
        window.setUnityMorphs = function(morphData) {
            return window.UnityMorphBridge.updateMorphBatch(morphData);
        };
        
        window.getUnityMorph = function(morphKey) {
            return window.UnityMorphBridge.getMorph(morphKey);
        };
        
        window.getUnityMorphBridgeStatus = function() {
            return window.UnityMorphBridge.getStatus();
        };
        
        console.log('[Unity WebGL Morph Bridge] Global methods exposed');
    },
    
    // Notify JavaScript that a frame has been synchronized
    NotifyFrameSynchronized: function() {
        if (window.UnityMorphBridge && window.UnityMorphBridge.isReady) {
            // Dispatch frame sync event for external listeners
            var event = new CustomEvent('unityFrameSynchronized', {
                detail: { timestamp: performance.now() }
            });
            window.dispatchEvent(event);
            
            // Call external callback if available
            if (window.onUnityFrameSynchronized) {
                window.onUnityFrameSynchronized();
            }
        }
    },
    
    // Send performance metrics to JavaScript
    SendPerformanceMetrics: function(fps, frameTime, morphTime, visemeCount) {
        if (window.UnityMorphBridge) {
            window.UnityMorphBridge.performanceData = {
                lastFPS: fps,
                lastFrameTime: frameTime,
                lastMorphTime: morphTime,
                activeVisemes: visemeCount,
                timestamp: Date.now()
            };
            
            // Dispatch performance update event
            var event = new CustomEvent('unityPerformanceUpdate', {
                detail: window.UnityMorphBridge.performanceData
            });
            window.dispatchEvent(event);
            
            // Call external callback if available
            if (window.onUnityPerformanceUpdate) {
                window.onUnityPerformanceUpdate(window.UnityMorphBridge.performanceData);
            }
            
            // Log performance warnings
            if (fps < 30) {
                console.warn('[Unity WebGL Morph Bridge] Low FPS detected:', fps.toFixed(1));
            }
            
            if (morphTime > 5) {
                console.warn('[Unity WebGL Morph Bridge] High morph processing time:', morphTime.toFixed(2) + 'ms');
            }
        }
    },
    
    // Get device information for optimization
    GetDeviceCapabilities: function() {
        var capabilities = {
            // WebGL capabilities
            webGLVersion: 'unknown',
            maxTextureSize: 0,
            maxVertexAttribs: 0,
            
            // Device info
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            deviceMemory: navigator.deviceMemory || 0,
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            
            // Display info
            screenWidth: screen.width,
            screenHeight: screen.height,
            devicePixelRatio: window.devicePixelRatio || 1,
            
            // Performance hints
            isMobile: /Mobi|Android/i.test(navigator.userAgent),
            isLowEnd: false
        };
        
        // Check WebGL capabilities
        try {
            var canvas = document.createElement('canvas');
            var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            if (gl) {
                capabilities.webGLVersion = gl instanceof WebGL2RenderingContext ? '2.0' : '1.0';
                capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                capabilities.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
                
                // Check for performance indicators
                var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    var renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    capabilities.renderer = renderer;
                    
                    // Detect low-end devices
                    capabilities.isLowEnd = /Mali|Adreno [0-9]{2}[0-9]|PowerVR|Intel/i.test(renderer);
                }
            }
        } catch (error) {
            console.warn('[Unity WebGL Morph Bridge] Could not detect WebGL capabilities:', error);
        }
        
        // Detect low-end devices by memory and CPU
        if (capabilities.deviceMemory && capabilities.deviceMemory <= 4) {
            capabilities.isLowEnd = true;
        }
        
        if (capabilities.hardwareConcurrency <= 2) {
            capabilities.isLowEnd = true;
        }
        
        console.log('[Unity WebGL Morph Bridge] Device capabilities:', capabilities);
        
        // Convert to JSON string and return
        var jsonStr = JSON.stringify(capabilities);
        var bufferSize = lengthBytesUTF8(jsonStr) + 1;
        var buffer = _malloc(bufferSize);
        stringToUTF8(jsonStr, buffer, bufferSize);
        
        return buffer;
    },
    
    // Log message from Unity to JavaScript console
    LogToJavaScript: function(messagePtr, levelPtr) {
        var message = UTF8ToString(messagePtr);
        var level = UTF8ToString(levelPtr);
        
        var prefix = '[Unity WebGL Morph Bridge] ';
        
        switch(level) {
            case 'error':
                console.error(prefix + message);
                break;
            case 'warning':
                console.warn(prefix + message);
                break;
            case 'info':
                console.info(prefix + message);
                break;
            default:
                console.log(prefix + message);
                break;
        }
    },
    
    // Request animation frame callback
    RequestAnimationFrameCallback: function() {
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(function() {
                if (window.UnityMorphBridge && window.UnityMorphBridge.isReady) {
                    // Notify Unity that a frame is ready
                    try {
                        SendMessage('MorphSynchronizer', 'OnAnimationFrameReady', '');
                    } catch (error) {
                        console.warn('[Unity WebGL Morph Bridge] Animation frame callback failed:', error);
                    }
                }
            });
        }
    },
    
    // Setup WebGL context lost/restored handlers
    SetupWebGLContextHandlers: function() {
        var canvas = document.querySelector('#unity-canvas') || document.querySelector('canvas');
        
        if (canvas) {
            canvas.addEventListener('webglcontextlost', function(event) {
                console.warn('[Unity WebGL Morph Bridge] WebGL context lost');
                event.preventDefault();
                
                if (window.onUnityWebGLContextLost) {
                    window.onUnityWebGLContextLost();
                }
            });
            
            canvas.addEventListener('webglcontextrestored', function(event) {
                console.log('[Unity WebGL Morph Bridge] WebGL context restored');
                
                if (window.onUnityWebGLContextRestored) {
                    window.onUnityWebGLContextRestored();
                }
            });
            
            console.log('[Unity WebGL Morph Bridge] WebGL context handlers setup');
        }
    },
    
    // Integration with external morph systems (Three.js, Babylon.js, etc.)
    RegisterExternalMorphSystem: function(systemNamePtr) {
        var systemName = UTF8ToString(systemNamePtr);
        
        console.log('[Unity WebGL Morph Bridge] Registering external morph system:', systemName);
        
        if (!window.UnityMorphBridge.externalSystems) {
            window.UnityMorphBridge.externalSystems = new Map();
        }
        
        // Create integration interface
        var integration = {
            systemName: systemName,
            morphMappings: new Map(),
            
            // Map Unity morph to external system
            mapMorph: function(unityMorphKey, externalMorphKey, transform) {
                this.morphMappings.set(unityMorphKey, {
                    externalKey: externalMorphKey,
                    transform: transform || ((x) => x)
                });
            },
            
            // Apply Unity morphs to external system
            applyMorphs: function(unityMorphs) {
                var externalMorphs = {};
                
                this.morphMappings.forEach((mapping, unityKey) => {
                    if (unityMorphs.hasOwnProperty(unityKey)) {
                        var transformedValue = mapping.transform(unityMorphs[unityKey]);
                        externalMorphs[mapping.externalKey] = transformedValue;
                    }
                });
                
                // Call external system's morph application method
                if (window[systemName + 'ApplyMorphs']) {
                    window[systemName + 'ApplyMorphs'](externalMorphs);
                }
                
                return externalMorphs;
            }
        };
        
        window.UnityMorphBridge.externalSystems.set(systemName, integration);
        
        // Expose global integration method
        window['get' + systemName + 'MorphIntegration'] = function() {
            return integration;
        };
        
        console.log('[Unity WebGL Morph Bridge] External system integration ready:', systemName);
    }
});