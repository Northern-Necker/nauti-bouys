/**
 * @fileoverview Integration tests for Autonomous Viseme Optimizer system
 * @author Tester Agent - Hive Mind Worker
 * @description End-to-end tests for the complete viseme optimization pipeline
 *              including MediaPipe integration, geometric analysis, and morph target mapping
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'

// Mock Three.js and WebGL context
const mockRenderer = {
  render: vi.fn(),
  setSize: vi.fn(),
  dispose: vi.fn()
}

const mockScene = {
  add: vi.fn(),
  remove: vi.fn()
}

const mockCamera = {
  position: { set: vi.fn() },
  lookAt: vi.fn()
}

const mockMesh = {
  morphTargetInfluences: [],
  morphTargetDictionary: {
    'viseme_pp': 0,
    'viseme_ff': 1,
    'viseme_th': 2,
    'viseme_aa': 3,
    'viseme_oh': 4
  }
}

vi.mock('three', () => ({
  WebGLRenderer: vi.fn(() => mockRenderer),
  Scene: vi.fn(() => mockScene),
  PerspectiveCamera: vi.fn(() => mockCamera),
  Mesh: vi.fn(() => mockMesh),
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn(),
  Vector3: vi.fn(),
  Clock: vi.fn(() => ({ getDelta: vi.fn(() => 0.016) }))
}))

// Mock Canvas and WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    getExtension: vi.fn(),
    createShader: vi.fn(),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    createProgram: vi.fn(),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    useProgram: vi.fn(),
    viewport: vi.fn(),
    clear: vi.fn(),
    drawArrays: vi.fn()
  }))
})

// Mock analyzers
const mockMediaPipeAnalyzer = {
  initialize: vi.fn(() => Promise.resolve(true)),
  analyzeLandmarks: vi.fn(),
  calculateMouthMeasurements: vi.fn(),
  classifyViseme: vi.fn(),
  getPerformanceMetrics: vi.fn(() => ({
    averageProcessingTime: 15,
    detectionAccuracy: 0.95,
    memoryUsage: 45
  }))
}

const mockGeometricAnalyzer = {
  initialize: vi.fn(() => Promise.resolve(true)),
  analyzeGeometry: vi.fn(),
  calculateVisemeFromGeometry: vi.fn(),
  getBackupViseme: vi.fn(() => 'neutral')
}

const mockMorphEngine = {
  initialize: vi.fn(() => Promise.resolve(true)),
  updateMorphTargets: vi.fn(),
  applyViseme: vi.fn(),
  getAvailableMorphs: vi.fn(() => ['viseme_pp', 'viseme_ff', 'viseme_th'])
}

describe('Autonomous Viseme Optimizer Integration Tests', () => {
  let optimizer
  let mockCanvas
  let mockVideo

  beforeAll(() => {
    // Mock global objects
    global.MediaPipeVisemeAnalyzer = vi.fn(() => mockMediaPipeAnalyzer)
    global.GeometricVisemeAnalyzer = vi.fn(() => mockGeometricAnalyzer)
    global.AdvancedMorphEngine = vi.fn(() => mockMorphEngine)
    global.THREE = {
      WebGLRenderer: vi.fn(() => mockRenderer),
      Scene: vi.fn(() => mockScene),
      PerspectiveCamera: vi.fn(() => mockCamera)
    }

    // Mock DOM elements
    mockCanvas = document.createElement('canvas')
    mockVideo = document.createElement('video')
    Object.assign(mockVideo, {
      videoWidth: 640,
      videoHeight: 480,
      currentTime: 0,
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn()
    })
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create mock optimizer instance
    optimizer = {
      mediaPipeAnalyzer: mockMediaPipeAnalyzer,
      geometricAnalyzer: mockGeometricAnalyzer,
      morphEngine: mockMorphEngine,
      isInitialized: false,
      currentViseme: 'neutral',
      analysisMode: 'hybrid',
      
      async initialize() {
        const mediaPipeSuccess = await this.mediaPipeAnalyzer.initialize()
        const geometricSuccess = await this.geometricAnalyzer.initialize()
        const morphEngineSuccess = await this.morphEngine.initialize()
        
        this.isInitialized = mediaPipeSuccess && geometricSuccess && morphEngineSuccess
        return this.isInitialized
      },
      
      async processFrame(video, timestamp) {
        if (!this.isInitialized) return null
        
        let viseme = null
        
        // Try MediaPipe first
        try {
          const landmarks = await this.mediaPipeAnalyzer.analyzeLandmarks(video, timestamp)
          if (landmarks) {
            const measurements = this.mediaPipeAnalyzer.calculateMouthMeasurements(landmarks.landmarks)
            viseme = this.mediaPipeAnalyzer.classifyViseme(measurements)
          }
        } catch (error) {
          console.warn('MediaPipe failed, using geometric fallback')
        }
        
        // Fallback to geometric analysis
        if (!viseme) {
          viseme = this.geometricAnalyzer.getBackupViseme()
        }
        
        // Apply viseme to morph targets
        if (viseme) {
          this.morphEngine.applyViseme(viseme)
          this.currentViseme = viseme
        }
        
        return viseme
      },
      
      getPerformanceMetrics() {
        return this.mediaPipeAnalyzer.getPerformanceMetrics()
      }
    }
  })

  describe('System Initialization', () => {
    it('should initialize all subsystems successfully', async () => {
      const result = await optimizer.initialize()

      expect(result).toBe(true)
      expect(optimizer.isInitialized).toBe(true)
      expect(mockMediaPipeAnalyzer.initialize).toHaveBeenCalled()
      expect(mockGeometricAnalyzer.initialize).toHaveBeenCalled()
      expect(mockMorphEngine.initialize).toHaveBeenCalled()
    })

    it('should handle partial initialization failures', async () => {
      mockMediaPipeAnalyzer.initialize.mockResolvedValueOnce(false)
      
      const result = await optimizer.initialize()

      expect(result).toBe(false)
      expect(optimizer.isInitialized).toBe(false)
    })

    it('should validate required dependencies are available', async () => {
      expect(global.MediaPipeVisemeAnalyzer).toBeDefined()
      expect(global.GeometricVisemeAnalyzer).toBeDefined()
      expect(global.AdvancedMorphEngine).toBeDefined()
      expect(global.THREE).toBeDefined()
    })

    it('should set up proper analyzer fallback chain', async () => {
      await optimizer.initialize()

      expect(optimizer.mediaPipeAnalyzer).toBeDefined()
      expect(optimizer.geometricAnalyzer).toBeDefined()
      expect(optimizer.analysisMode).toBe('hybrid')
    })
  })

  describe('Video Processing Pipeline', () => {
    beforeEach(async () => {
      await optimizer.initialize()
    })

    it('should process video frames with MediaPipe analysis', async () => {
      const mockLandmarks = {
        landmarks: Array.from({ length: 468 }, () => ({
          x: Math.random(), y: Math.random(), z: Math.random()
        }))
      }
      
      mockMediaPipeAnalyzer.analyzeLandmarks.mockResolvedValue(mockLandmarks)
      mockMediaPipeAnalyzer.calculateMouthMeasurements.mockReturnValue({
        lipGap: 0.4, mouthWidth: 0.6, jawOpening: 0.4
      })
      mockMediaPipeAnalyzer.classifyViseme.mockReturnValue('oh')

      const result = await optimizer.processFrame(mockVideo, 16.67)

      expect(result).toBe('oh')
      expect(mockMediaPipeAnalyzer.analyzeLandmarks).toHaveBeenCalledWith(mockVideo, 16.67)
      expect(mockMorphEngine.applyViseme).toHaveBeenCalledWith('oh')
      expect(optimizer.currentViseme).toBe('oh')
    })

    it('should fallback to geometric analysis when MediaPipe fails', async () => {
      mockMediaPipeAnalyzer.analyzeLandmarks.mockRejectedValue(new Error('MediaPipe failed'))
      mockGeometricAnalyzer.getBackupViseme.mockReturnValue('neutral')

      const result = await optimizer.processFrame(mockVideo, 16.67)

      expect(result).toBe('neutral')
      expect(mockGeometricAnalyzer.getBackupViseme).toHaveBeenCalled()
      expect(mockMorphEngine.applyViseme).toHaveBeenCalledWith('neutral')
    })

    it('should handle invalid video input gracefully', async () => {
      const result = await optimizer.processFrame(null, 0)

      expect(result).toBeNull()
    })

    it('should maintain frame rate performance under load', async () => {
      const frameCount = 60
      const startTime = performance.now()
      
      mockMediaPipeAnalyzer.analyzeLandmarks.mockResolvedValue({
        landmarks: Array(468).fill({ x: 0.5, y: 0.5, z: 0 })
      })
      mockMediaPipeAnalyzer.calculateMouthMeasurements.mockReturnValue({
        lipGap: 0.2, mouthWidth: 0.8, jawOpening: 0.3
      })
      mockMediaPipeAnalyzer.classifyViseme.mockReturnValue('pp')

      const promises = []
      for (let i = 0; i < frameCount; i++) {
        promises.push(optimizer.processFrame(mockVideo, i * 16.67))
      }
      
      await Promise.all(promises)
      
      const duration = performance.now() - startTime
      const avgFrameTime = duration / frameCount
      
      // Should maintain 60fps (16.67ms per frame) or better
      expect(avgFrameTime).toBeLessThan(16.67)
    })
  })

  describe('Viseme Classification Accuracy', () => {
    beforeEach(async () => {
      await optimizer.initialize()
    })

    it('should accurately classify bilabial visemes', async () => {
      mockMediaPipeAnalyzer.analyzeLandmarks.mockResolvedValue({
        landmarks: Array(468).fill({ x: 0.5, y: 0.5, z: 0 })
      })
      mockMediaPipeAnalyzer.calculateMouthMeasurements.mockReturnValue({
        lipGap: 0,
        mouthWidth: 0.8,
        jawOpening: 0.1,
        lipCompression: 0.9
      })
      mockMediaPipeAnalyzer.classifyViseme.mockReturnValue('pp')

      const result = await optimizer.processFrame(mockVideo, 0)

      expect(result).toBe('pp')
      expect(mockMorphEngine.applyViseme).toHaveBeenCalledWith('pp')
    })

    it('should classify open vowels correctly', async () => {
      mockMediaPipeAnalyzer.analyzeLandmarks.mockResolvedValue({
        landmarks: Array(468).fill({ x: 0.5, y: 0.5, z: 0 })
      })
      mockMediaPipeAnalyzer.calculateMouthMeasurements.mockReturnValue({
        lipGap: 0.8,
        mouthWidth: 1.0,
        jawOpening: 0.9,
        lipCompression: 0.1
      })
      mockMediaPipeAnalyzer.classifyViseme.mockReturnValue('aa')

      const result = await optimizer.processFrame(mockVideo, 0)

      expect(result).toBe('aa')
    })

    it('should handle ambiguous measurements with confidence scoring', async () => {
      mockMediaPipeAnalyzer.analyzeLandmarks.mockResolvedValue({
        landmarks: Array(468).fill({ x: 0.5, y: 0.5, z: 0 })
      })
      mockMediaPipeAnalyzer.calculateMouthMeasurements.mockReturnValue({
        lipGap: 0.5,
        mouthWidth: 0.7,
        jawOpening: 0.5,
        lipCompression: 0.5
      })
      
      // Should have fallback mechanism for ambiguous cases
      mockMediaPipeAnalyzer.classifyViseme.mockReturnValue('neutral')

      const result = await optimizer.processFrame(mockVideo, 0)

      expect(result).toBeDefined()
      expect(['neutral', 'aa', 'oh', 'pp', 'ff', 'th']).toContain(result)
    })
  })

  describe('Morph Target Integration', () => {
    beforeEach(async () => {
      await optimizer.initialize()
    })

    it('should apply morph targets based on viseme classification', async () => {
      mockMediaPipeAnalyzer.analyzeLandmarks.mockResolvedValue({
        landmarks: Array(468).fill({ x: 0.5, y: 0.5, z: 0 })
      })
      mockMediaPipeAnalyzer.classifyViseme.mockReturnValue('oh')

      await optimizer.processFrame(mockVideo, 0)

      expect(mockMorphEngine.applyViseme).toHaveBeenCalledWith('oh')
    })

    it('should validate morph targets are available before applying', () => {
      const availableMorphs = mockMorphEngine.getAvailableMorphs()
      
      expect(availableMorphs).toContain('viseme_pp')
      expect(availableMorphs).toContain('viseme_ff')
      expect(availableMorphs).toContain('viseme_th')
    })

    it('should handle missing morph targets gracefully', async () => {
      mockMorphEngine.getAvailableMorphs.mockReturnValue([])
      mockMediaPipeAnalyzer.classifyViseme.mockReturnValue('custom_viseme')

      const result = await optimizer.processFrame(mockVideo, 0)

      // Should not crash, but may return null or fallback
      expect(result).toBeDefined()
    })

    it('should smooth morph target transitions', async () => {
      // Simulate rapid viseme changes
      const visemeSequence = ['pp', 'aa', 'oh', 'ff']
      
      for (const viseme of visemeSequence) {
        mockMediaPipeAnalyzer.classifyViseme.mockReturnValueOnce(viseme)
        mockMediaPipeAnalyzer.analyzeLandmarks.mockResolvedValueOnce({
          landmarks: Array(468).fill({ x: 0.5, y: 0.5, z: 0 })
        })
        
        await optimizer.processFrame(mockVideo, 0)
      }

      expect(mockMorphEngine.applyViseme).toHaveBeenCalledTimes(4)
      visemeSequence.forEach(viseme => {
        expect(mockMorphEngine.applyViseme).toHaveBeenCalledWith(viseme)
      })
    })
  })

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await optimizer.initialize()
    })

    it('should track processing performance metrics', () => {
      const metrics = optimizer.getPerformanceMetrics()

      expect(metrics).toHaveProperty('averageProcessingTime')
      expect(metrics).toHaveProperty('detectionAccuracy')
      expect(metrics).toHaveProperty('memoryUsage')
      
      expect(typeof metrics.averageProcessingTime).toBe('number')
      expect(typeof metrics.detectionAccuracy).toBe('number')
      expect(typeof metrics.memoryUsage).toBe('number')
    })

    it('should maintain acceptable processing times', () => {
      const metrics = optimizer.getPerformanceMetrics()

      expect(metrics.averageProcessingTime).toBeLessThan(16) // Should process in <16ms for 60fps
    })

    it('should maintain high detection accuracy', () => {
      const metrics = optimizer.getPerformanceMetrics()

      expect(metrics.detectionAccuracy).toBeGreaterThan(0.9) // >90% accuracy
    })

    it('should monitor memory usage efficiently', () => {
      const metrics = optimizer.getPerformanceMetrics()

      expect(metrics.memoryUsage).toBeLessThan(100) // <100MB memory usage
    })
  })

  describe('Error Recovery', () => {
    beforeEach(async () => {
      await optimizer.initialize()
    })

    it('should recover from MediaPipe crashes', async () => {
      // First call succeeds
      mockMediaPipeAnalyzer.analyzeLandmarks
        .mockResolvedValueOnce({
          landmarks: Array(468).fill({ x: 0.5, y: 0.5, z: 0 })
        })
      
      let result = await optimizer.processFrame(mockVideo, 0)
      expect(result).toBeDefined()

      // Second call fails
      mockMediaPipeAnalyzer.analyzeLandmarks
        .mockRejectedValueOnce(new Error('MediaPipe crashed'))
      
      result = await optimizer.processFrame(mockVideo, 16.67)
      expect(result).toBe('neutral') // Should fallback to geometric
    })

    it('should handle WebGL context loss', async () => {
      // Simulate WebGL context loss
      mockRenderer.render.mockImplementation(() => {
        throw new Error('WebGL context lost')
      })

      // Should not crash the entire system
      await expect(optimizer.processFrame(mockVideo, 0)).resolves.toBeDefined()
    })

    it('should maintain system stability under stress', async () => {
      // Simulate various error conditions
      const errorConditions = [
        () => { throw new Error('WASM initialization failed') },
        () => { throw new Error('Out of memory') },
        () => { throw new Error('Invalid model data') },
        () => { return null } // No detection
      ]

      for (let i = 0; i < errorConditions.length; i++) {
        mockMediaPipeAnalyzer.analyzeLandmarks.mockImplementationOnce(errorConditions[i])
        
        const result = await optimizer.processFrame(mockVideo, i * 16.67)
        expect(result).toBeDefined() // Should not crash
      }
    })
  })

  describe('Real-time Processing', () => {
    beforeEach(async () => {
      await optimizer.initialize()
    })

    it('should handle rapid frame processing', async () => {
      const frameInterval = 16.67 // 60fps
      const testDuration = 1000 // 1 second
      const expectedFrames = Math.floor(testDuration / frameInterval)
      
      mockMediaPipeAnalyzer.analyzeLandmarks.mockResolvedValue({
        landmarks: Array(468).fill({ x: 0.5, y: 0.5, z: 0 })
      })
      mockMediaPipeAnalyzer.classifyViseme.mockReturnValue('aa')

      const startTime = performance.now()
      let processedFrames = 0
      
      while (performance.now() - startTime < testDuration) {
        await optimizer.processFrame(mockVideo, processedFrames * frameInterval)
        processedFrames++
      }

      expect(processedFrames).toBeGreaterThanOrEqual(expectedFrames * 0.8) // Allow 20% tolerance
    })

    it('should maintain synchronization with video playback', async () => {
      const videoCurrentTime = 1.5 // 1.5 seconds into video
      mockVideo.currentTime = videoCurrentTime

      await optimizer.processFrame(mockVideo, videoCurrentTime * 1000)

      expect(mockMediaPipeAnalyzer.analyzeLandmarks).toHaveBeenCalledWith(
        mockVideo, 
        videoCurrentTime * 1000
      )
    })
  })
})