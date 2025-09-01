/**
 * MorphScreenshotCapture - Automated screenshot system for WebGL contexts
 * Captures before/after morph comparisons with pixel-level difference detection
 */

class MorphScreenshotCapture {
    constructor(options = {}) {
        this.options = {
            quality: options.quality || 1.0,
            format: options.format || 'image/png',
            pixelTolerance: options.pixelTolerance || 5,
            debugMode: options.debugMode || false,
            ...options
        };
        
        this.screenshots = new Map();
        this.beforeStates = new Map();
        this.afterStates = new Map();
        this.diffData = new Map();
        
        this.init();
    }
    
    init() {
        this.log('MorphScreenshotCapture initialized', 'info');
        this.setupCanvas2D();
    }
    
    setupCanvas2D() {
        // Create hidden canvas for image processing
        this.processingCanvas = document.createElement('canvas');
        this.processingContext = this.processingCanvas.getContext('2d');
        this.processingCanvas.style.display = 'none';
        document.body.appendChild(this.processingCanvas);
    }
    
    /**
     * Capture screenshot from a WebGL canvas
     */
    async captureCanvas(canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new Error(`Canvas not found: ${canvasId}`);
        }
        
        const captureOptions = { ...this.options, ...options };
        
        try {
            // For WebGL canvases, we need to handle the context properly
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (gl) {
                // Ensure the frame is rendered
                gl.flush();
                gl.finish();
            }
            
            // Capture the canvas content
            const dataURL = canvas.toDataURL(captureOptions.format, captureOptions.quality);
            
            // Store screenshot with metadata
            const screenshot = {
                canvasId,
                timestamp: Date.now(),
                dataURL,
                width: canvas.width,
                height: canvas.height,
                format: captureOptions.format,
                quality: captureOptions.quality
            };
            
            this.screenshots.set(`${canvasId}-${screenshot.timestamp}`, screenshot);
            
            this.log(`Screenshot captured: ${canvasId}`, 'success');
            return screenshot;
            
        } catch (error) {
            this.log(`Failed to capture canvas ${canvasId}: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Capture screenshots from multiple frameworks simultaneously
     */
    async captureAllFrameworks(canvasIds, options = {}) {
        this.log('Capturing screenshots from all frameworks...', 'info');
        
        const capturePromises = canvasIds.map(async (canvasId) => {
            try {
                const screenshot = await this.captureCanvas(canvasId, options);
                return { canvasId, screenshot, success: true };
            } catch (error) {
                this.log(`Failed to capture ${canvasId}: ${error.message}`, 'error');
                return { canvasId, error: error.message, success: false };
            }
        });
        
        const results = await Promise.allSettled(capturePromises);
        const screenshots = {};
        
        results.forEach((result, index) => {
            const canvasId = canvasIds[index];
            const frameworkName = canvasId.replace('-canvas', '');
            
            if (result.status === 'fulfilled' && result.value.success) {
                screenshots[frameworkName] = result.value.screenshot.dataURL;
            } else {
                screenshots[frameworkName] = this.generateErrorImage(canvasId);
            }
        });
        
        return screenshots;
    }
    
    /**
     * Capture before and after states for morph comparison
     */
    async captureBeforeAfter(canvasId, morphFunction, options = {}) {
        this.log(`Capturing before/after for ${canvasId}...`, 'info');
        
        try {
            // Capture before state
            const beforeScreenshot = await this.captureCanvas(canvasId, options);
            this.beforeStates.set(canvasId, beforeScreenshot);
            
            // Execute morph function
            if (typeof morphFunction === 'function') {
                await morphFunction();
            }
            
            // Wait for render
            await this.waitForRender();
            
            // Capture after state
            const afterScreenshot = await this.captureCanvas(canvasId, options);
            this.afterStates.set(canvasId, afterScreenshot);
            
            // Calculate differences
            const diffResult = await this.calculatePixelDifference(
                beforeScreenshot.dataURL, 
                afterScreenshot.dataURL
            );
            
            this.diffData.set(canvasId, {
                before: beforeScreenshot,
                after: afterScreenshot,
                diff: diffResult,
                timestamp: Date.now()
            });
            
            this.log(`Before/after capture completed for ${canvasId}`, 'success');
            return this.diffData.get(canvasId);
            
        } catch (error) {
            this.log(`Before/after capture failed for ${canvasId}: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Calculate pixel-level differences between two images
     */
    async calculatePixelDifference(imageData1, imageData2) {
        return new Promise((resolve, reject) => {
            try {
                const img1 = new Image();
                const img2 = new Image();
                let loaded = 0;
                
                const onLoad = () => {
                    loaded++;
                    if (loaded === 2) {
                        const diff = this.performPixelComparison(img1, img2);
                        resolve(diff);
                    }
                };
                
                img1.onload = onLoad;
                img2.onload = onLoad;
                img1.onerror = img2.onerror = (error) => reject(error);
                
                img1.src = imageData1;
                img2.src = imageData2;
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Perform actual pixel comparison between two images
     */
    performPixelComparison(img1, img2) {
        const width = Math.min(img1.width, img2.width);
        const height = Math.min(img1.height, img2.height);
        
        // Setup processing canvas
        this.processingCanvas.width = width;
        this.processingCanvas.height = height;
        
        // Draw first image
        this.processingContext.drawImage(img1, 0, 0, width, height);
        const imageData1 = this.processingContext.getImageData(0, 0, width, height);
        
        // Draw second image
        this.processingContext.drawImage(img2, 0, 0, width, height);
        const imageData2 = this.processingContext.getImageData(0, 0, width, height);
        
        // Create difference image
        const diffImageData = this.processingContext.createImageData(width, height);
        
        let totalPixels = width * height;
        let differentPixels = 0;
        let totalDifference = 0;
        
        const data1 = imageData1.data;
        const data2 = imageData2.data;
        const diffData = diffImageData.data;
        
        for (let i = 0; i < data1.length; i += 4) {
            const r1 = data1[i];
            const g1 = data1[i + 1];
            const b1 = data1[i + 2];
            const a1 = data1[i + 3];
            
            const r2 = data2[i];
            const g2 = data2[i + 1];
            const b2 = data2[i + 2];
            const a2 = data2[i + 3];
            
            const rDiff = Math.abs(r1 - r2);
            const gDiff = Math.abs(g1 - g2);
            const bDiff = Math.abs(b1 - b2);
            const aDiff = Math.abs(a1 - a2);
            
            const pixelDiff = (rDiff + gDiff + bDiff + aDiff) / 4;
            totalDifference += pixelDiff;
            
            if (pixelDiff > this.options.pixelTolerance) {
                differentPixels++;
                // Highlight differences in red
                diffData[i] = 255;     // R
                diffData[i + 1] = 0;   // G
                diffData[i + 2] = 0;   // B
                diffData[i + 3] = 255; // A
            } else {
                // Keep original pixel
                diffData[i] = r1;
                diffData[i + 1] = g1;
                diffData[i + 2] = b1;
                diffData[i + 3] = a1;
            }
        }
        
        // Create difference image data URL
        this.processingContext.putImageData(diffImageData, 0, 0);
        const diffImageURL = this.processingCanvas.toDataURL();
        
        const similarityPercentage = ((totalPixels - differentPixels) / totalPixels) * 100;
        const averageDifference = totalDifference / totalPixels;
        
        return {
            width,
            height,
            totalPixels,
            differentPixels,
            similarityPercentage: parseFloat(similarityPercentage.toFixed(2)),
            averageDifference: parseFloat(averageDifference.toFixed(2)),
            diffImageURL,
            changeDetected: differentPixels > (totalPixels * 0.001) // 0.1% threshold
        };
    }
    
    /**
     * Batch capture all visemes for comparison
     */
    async captureVisemeBatch(canvasId, visemes, morphFunction, options = {}) {
        const results = new Map();
        
        this.log(`Starting batch capture for ${visemes.length} visemes on ${canvasId}`, 'info');
        
        for (let i = 0; i < visemes.length; i++) {
            const viseme = visemes[i];
            
            try {
                // Apply viseme
                await morphFunction(viseme, options.morphIntensity || 1.0);
                await this.waitForRender();
                
                // Capture screenshot
                const screenshot = await this.captureCanvas(canvasId, options);
                
                results.set(viseme, {
                    viseme,
                    screenshot,
                    timestamp: Date.now(),
                    index: i
                });
                
                this.log(`Captured viseme ${viseme} (${i + 1}/${visemes.length})`, 'info');
                
                // Progress callback
                if (options.onProgress) {
                    options.onProgress(i + 1, visemes.length, viseme);
                }
                
            } catch (error) {
                this.log(`Failed to capture viseme ${viseme}: ${error.message}`, 'error');
                results.set(viseme, {
                    viseme,
                    error: error.message,
                    timestamp: Date.now(),
                    index: i
                });
            }
        }
        
        this.log(`Batch capture completed for ${canvasId}`, 'success');
        return results;
    }
    
    /**
     * Generate comparison grid of all captured visemes
     */
    generateComparisonGrid(visemeResults, options = {}) {
        const gridOptions = {
            columns: options.columns || 5,
            cellSize: options.cellSize || 150,
            spacing: options.spacing || 10,
            ...options
        };
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const visemes = Array.from(visemeResults.keys());
        const rows = Math.ceil(visemes.length / gridOptions.columns);
        
        canvas.width = (gridOptions.cellSize * gridOptions.columns) + 
                      (gridOptions.spacing * (gridOptions.columns + 1));
        canvas.height = (gridOptions.cellSize * rows) + 
                       (gridOptions.spacing * (rows + 1));
        
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        return new Promise((resolve) => {
            let loaded = 0;
            const images = new Map();
            
            const drawGrid = () => {
                visemes.forEach((viseme, index) => {
                    const img = images.get(viseme);
                    if (!img) return;
                    
                    const col = index % gridOptions.columns;
                    const row = Math.floor(index / gridOptions.columns);
                    
                    const x = (col * (gridOptions.cellSize + gridOptions.spacing)) + gridOptions.spacing;
                    const y = (row * (gridOptions.cellSize + gridOptions.spacing)) + gridOptions.spacing;
                    
                    // Draw image
                    ctx.drawImage(img, x, y, gridOptions.cellSize, gridOptions.cellSize);
                    
                    // Draw label
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '12px monospace';
                    ctx.fillText(viseme, x + 5, y + gridOptions.cellSize - 5);
                });
                
                resolve(canvas.toDataURL());
            };
            
            visemes.forEach((viseme) => {
                const result = visemeResults.get(viseme);
                if (result && result.screenshot) {
                    const img = new Image();
                    img.onload = () => {
                        images.set(viseme, img);
                        loaded++;
                        if (loaded === visemes.length) {
                            drawGrid();
                        }
                    };
                    img.src = result.screenshot.dataURL;
                }
            });
        });
    }
    
    /**
     * Export all captured data as JSON
     */
    exportCaptureData(format = 'json') {
        const exportData = {
            metadata: {
                timestamp: Date.now(),
                captureCount: this.screenshots.size,
                options: this.options
            },
            screenshots: Array.from(this.screenshots.entries()),
            beforeStates: Array.from(this.beforeStates.entries()),
            afterStates: Array.from(this.afterStates.entries()),
            diffData: Array.from(this.diffData.entries())
        };
        
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        }
        
        return exportData;
    }
    
    /**
     * Generate error image placeholder
     */
    generateErrorImage(canvasId) {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        // Error background
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Error text
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Screenshot Failed', canvas.width / 2, canvas.height / 2);
        ctx.fillText(canvasId, canvas.width / 2, canvas.height / 2 + 25);
        
        return canvas.toDataURL();
    }
    
    /**
     * Wait for WebGL render to complete
     */
    async waitForRender(frames = 2) {
        return new Promise(resolve => {
            let frameCount = 0;
            const waitFrame = () => {
                frameCount++;
                if (frameCount >= frames) {
                    resolve();
                } else {
                    requestAnimationFrame(waitFrame);
                }
            };
            requestAnimationFrame(waitFrame);
        });
    }
    
    /**
     * Clear all stored data
     */
    clearAllData() {
        this.screenshots.clear();
        this.beforeStates.clear();
        this.afterStates.clear();
        this.diffData.clear();
        this.log('All capture data cleared', 'info');
    }
    
    /**
     * Get capture statistics
     */
    getStats() {
        return {
            totalScreenshots: this.screenshots.size,
            beforeAfterPairs: this.diffData.size,
            memoryUsage: this.estimateMemoryUsage(),
            lastCaptureTime: this.getLastCaptureTime()
        };
    }
    
    estimateMemoryUsage() {
        // Rough estimate based on stored data
        const baseSize = 400 * 300 * 4; // RGBA pixels
        const totalImages = this.screenshots.size + 
                           this.beforeStates.size + 
                           this.afterStates.size;
        return Math.round((totalImages * baseSize) / (1024 * 1024)) + 'MB';
    }
    
    getLastCaptureTime() {
        let lastTime = 0;
        this.screenshots.forEach(screenshot => {
            if (screenshot.timestamp > lastTime) {
                lastTime = screenshot.timestamp;
            }
        });
        return lastTime ? new Date(lastTime).toISOString() : null;
    }
    
    log(message, level = 'info') {
        if (this.options.debugMode) {
            console.log(`[MorphScreenshotCapture] ${message}`);
        }
        
        // Send to parent validator if available
        if (window.morphValidator) {
            window.morphValidator.log(`[Screenshot] ${message}`, level);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MorphScreenshotCapture;
}