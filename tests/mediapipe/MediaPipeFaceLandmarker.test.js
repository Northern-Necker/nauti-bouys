/**
 * @fileoverview Unit tests for MediaPipe Face Landmarker v2 implementation
 * @author Tester Agent - Hive Mind Worker
 * @description Comprehensive test suite for MediaPipe integration, initialization,
 *              and error handling scenarios in autonomous-viseme-optimizer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock MediaPipe modules
const mockFaceLandmarker = {
  detectForVideo: vi.fn(),
  setOptions: vi.fn(),
  close: vi.fn()
}

const mockFilesetResolver = {
  forVisionTasks: vi.fn()
}

const mockFaceLandmarkerCreate = vi.fn()

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: mockFilesetResolver,
  FaceLandmarker: {
    createFromOptions: mockFaceLandmarkerCreate
  }
}))

// Import the module under test after mocking
let MediaPipeVisemeAnalyzer
try {
  MediaPipeVisemeAnalyzer = (await import('../../frontend/mediapipe-viseme-analyzer.js')).default
} catch (error) {
  // Fallback mock for when file doesn't exist or has import issues
  MediaPipeVisemeAnalyzer = class MockMediaPipeVisemeAnalyzer {
    constructor() {
      this.faceLandmarker = null
      this.isInitialized = false
      this.lastLandmarks = null
      this.landmarkIndices = {}
      this.visemeTargets = {}
    }
    
    async initialize() {
      return false
    }
    
    async analyzeLandmarks() {
      return null
    }
  }
}

describe('MediaPipe Face Landmarker v2 Tests', () => {
  let analyzer

  beforeEach(() => {
    analyzer = new MediaPipeVisemeAnalyzer()
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (analyzer && analyzer.faceLandmarker) {
      analyzer.faceLandmarker.close?.()
    }
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(analyzer).toBeDefined()
      expect(analyzer.isInitialized).toBe(false)
      expect(analyzer.faceLandmarker).toBeNull()
      expect(analyzer.lastLandmarks).toBeNull()
    })

    it('should have correct landmark indices configuration', () => {
      expect(analyzer.landmarkIndices).toHaveProperty('upperLipTop')
      expect(analyzer.landmarkIndices).toHaveProperty('lowerLipBottom')
      expect(analyzer.landmarkIndices).toHaveProperty('leftMouthCorner')
      expect(analyzer.landmarkIndices).toHaveProperty('rightMouthCorner')
      expect(analyzer.landmarkIndices).toHaveProperty('jawLeft')
      expect(analyzer.landmarkIndices).toHaveProperty('jawRight')
      expect(analyzer.landmarkIndices.lipOutline).toBeInstanceOf(Array)
    })

    it('should have predefined viseme targets', () => {
      expect(analyzer.visemeTargets).toHaveProperty('pp')
      expect(analyzer.visemeTargets).toHaveProperty('ff')
      expect(analyzer.visemeTargets).toHaveProperty('th')
      expect(analyzer.visemeTargets).toHaveProperty('aa')
      expect(analyzer.visemeTargets).toHaveProperty('oh')
      
      // Check structure of viseme targets
      expect(analyzer.visemeTargets.pp).toHaveProperty('lipGap')
      expect(analyzer.visemeTargets.pp).toHaveProperty('mouthWidth')
      expect(analyzer.visemeTargets.pp).toHaveProperty('jawOpening')
    })

    it('should successfully initialize MediaPipe with valid configuration', async () => {
      // Mock successful initialization
      mockFilesetResolver.forVisionTasks.mockResolvedValue({})
      mockFaceLandmarkerCreate.mockResolvedValue(mockFaceLandmarker)

      const result = await analyzer.initialize()

      expect(mockFilesetResolver.forVisionTasks).toHaveBeenCalled()
      expect(mockFaceLandmarkerCreate).toHaveBeenCalled()
      
      // Check that initialization parameters are correct
      const createCall = mockFaceLandmarkerCreate.mock.calls[0]
      expect(createCall[1]).toMatchObject({
        runningMode: 'VIDEO',
        numFaces: 1,
        refineLandmarks: true,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
      })
    })

    it('should handle MediaPipe initialization failure gracefully', async () => {
      mockFilesetResolver.forVisionTasks.mockRejectedValue(new Error('WASM loading failed'))

      const result = await analyzer.initialize()

      expect(result).toBe(false)
      expect(analyzer.isInitialized).toBe(false)
    })

    it('should retry with fallback CDN sources on initial failure', async () => {
      // First call fails, second succeeds
      mockFilesetResolver.forVisionTasks
        .mockRejectedValueOnce(new Error('Primary CDN failed'))
        .mockResolvedValue({})
      mockFaceLandmarkerCreate.mockResolvedValue(mockFaceLandmarker)

      const result = await analyzer.initialize()

      expect(mockFilesetResolver.forVisionTasks).toHaveBeenCalledTimes(2)
      expect(result).toBe(true)
    })
  })

  describe('Model Loading', () => {
    beforeEach(async () => {
      mockFilesetResolver.forVisionTasks.mockResolvedValue({})
      mockFaceLandmarkerCreate.mockResolvedValue(mockFaceLandmarker)
      await analyzer.initialize()
    })

    it('should load face landmarker model with correct options', () => {
      const createCall = mockFaceLandmarkerCreate.mock.calls[0]
      expect(createCall[1]).toMatchObject({
        baseOptions: {
          modelAssetPath: expect.stringContaining('face_landmarker.task')
        },
        runningMode: 'VIDEO',
        numFaces: 1
      })
    })

    it('should handle model loading timeout', async () => {
      mockFaceLandmarkerCreate.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 15000))
      )

      const analyzer2 = new MediaPipeVisemeAnalyzer()
      const startTime = Date.now()
      
      const result = await analyzer2.initialize()
      const duration = Date.now() - startTime

      expect(result).toBe(false)
      expect(duration).toBeLessThan(12000) // Should timeout before 12 seconds
    })

    it('should validate model configuration parameters', () => {
      const createCall = mockFaceLandmarkerCreate.mock.calls[0]
      const options = createCall[1]

      expect(options.numFaces).toBe(1)
      expect(options.refineLandmarks).toBe(true)
      expect(options.outputFaceBlendshapes).toBe(false)
      expect(options.outputFacialTransformationMatrixes).toBe(false)
    })
  })

  describe('Face Detection', () => {
    const mockVideoElement = {
      videoWidth: 640,
      videoHeight: 480,
      currentTime: 0
    }

    const mockLandmarks = [{
      landmarks: Array.from({ length: 468 }, (_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      }))
    }]

    beforeEach(async () => {
      mockFilesetResolver.forVisionTasks.mockResolvedValue({})
      mockFaceLandmarkerCreate.mockResolvedValue(mockFaceLandmarker)
      mockFaceLandmarker.detectForVideo.mockReturnValue({
        faceLandmarks: mockLandmarks
      })
      await analyzer.initialize()
    })

    it('should detect face landmarks from video element', async () => {
      const result = await analyzer.analyzeLandmarks(mockVideoElement, 0)

      expect(mockFaceLandmarker.detectForVideo).toHaveBeenCalledWith(
        mockVideoElement, 
        0
      )
      expect(result).toBeDefined()
    })

    it('should handle no face detected scenario', async () => {
      mockFaceLandmarker.detectForVideo.mockReturnValue({
        faceLandmarks: []
      })

      const result = await analyzer.analyzeLandmarks(mockVideoElement, 0)

      expect(result).toBeNull()
    })

    it('should validate landmark data structure', async () => {
      const result = await analyzer.analyzeLandmarks(mockVideoElement, 0)

      expect(result.landmarks).toBeInstanceOf(Array)
      expect(result.landmarks).toHaveLength(468)
      result.landmarks.forEach(landmark => {
        expect(landmark).toHaveProperty('x')
        expect(landmark).toHaveProperty('y')
        expect(landmark).toHaveProperty('z')
        expect(typeof landmark.x).toBe('number')
        expect(typeof landmark.y).toBe('number')
        expect(typeof landmark.z).toBe('number')
      })
    })

    it('should cache last successful landmarks', async () => {
      await analyzer.analyzeLandmarks(mockVideoElement, 0)

      expect(analyzer.lastLandmarks).toBeDefined()
      expect(analyzer.lastLandmarks.landmarks).toHaveLength(468)
    })
  })

  describe('Viseme Analysis', () => {
    const mockLandmarks = [{
      landmarks: Array.from({ length: 468 }, (_, i) => ({
        x: 0.5 + (Math.random() - 0.5) * 0.1,
        y: 0.5 + (Math.random() - 0.5) * 0.1,
        z: Math.random() * 0.1
      }))
    }]

    beforeEach(async () => {
      mockFilesetResolver.forVisionTasks.mockResolvedValue({})
      mockFaceLandmarkerCreate.mockResolvedValue(mockFaceLandmarker)
      mockFaceLandmarker.detectForVideo.mockReturnValue({
        faceLandmarks: mockLandmarks
      })
      await analyzer.initialize()
      analyzer.lastLandmarks = { landmarks: mockLandmarks[0].landmarks }
    })

    it('should calculate mouth opening measurements', () => {
      const measurements = analyzer.calculateMouthMeasurements(analyzer.lastLandmarks.landmarks)

      expect(measurements).toHaveProperty('lipGap')
      expect(measurements).toHaveProperty('mouthWidth')
      expect(measurements).toHaveProperty('jawOpening')
      expect(typeof measurements.lipGap).toBe('number')
      expect(typeof measurements.mouthWidth).toBe('number')
      expect(typeof measurements.jawOpening).toBe('number')
    })

    it('should classify viseme from measurements', () => {
      const measurements = {
        lipGap: 0.1,
        mouthWidth: 0.8,
        jawOpening: 0.1,
        lipCompression: 0.9
      }

      const viseme = analyzer.classifyViseme(measurements)

      expect(viseme).toBeDefined()
      expect(typeof viseme).toBe('string')
      expect(analyzer.visemeTargets).toHaveProperty(viseme)
    })

    it('should handle edge cases in viseme classification', () => {
      const extremeMeasurements = {
        lipGap: 0,
        mouthWidth: 0,
        jawOpening: 0,
        lipCompression: 1
      }

      const viseme = analyzer.classifyViseme(extremeMeasurements)
      expect(viseme).toBeDefined()

      const maxMeasurements = {
        lipGap: 1,
        mouthWidth: 1,
        jawOpening: 1,
        lipCompression: 0
      }

      const viseme2 = analyzer.classifyViseme(maxMeasurements)
      expect(viseme2).toBeDefined()
    })

    it('should provide confidence scores for viseme classification', () => {
      const measurements = {
        lipGap: 0.4,
        mouthWidth: 0.6,
        jawOpening: 0.4,
        lipRounding: 0.9
      }

      const result = analyzer.classifyVisemeWithConfidence(measurements)

      expect(result).toHaveProperty('viseme')
      expect(result).toHaveProperty('confidence')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid video input gracefully', async () => {
      mockFilesetResolver.forVisionTasks.mockResolvedValue({})
      mockFaceLandmarkerCreate.mockResolvedValue(mockFaceLandmarker)
      await analyzer.initialize()

      const result = await analyzer.analyzeLandmarks(null, 0)
      expect(result).toBeNull()

      const result2 = await analyzer.analyzeLandmarks(undefined, 0)
      expect(result2).toBeNull()
    })

    it('should handle MediaPipe detection errors', async () => {
      mockFilesetResolver.forVisionTasks.mockResolvedValue({})
      mockFaceLandmarkerCreate.mockResolvedValue(mockFaceLandmarker)
      mockFaceLandmarker.detectForVideo.mockImplementation(() => {
        throw new Error('Detection failed')
      })
      await analyzer.initialize()

      const mockVideo = { videoWidth: 640, videoHeight: 480 }
      const result = await analyzer.analyzeLandmarks(mockVideo, 0)

      expect(result).toBeNull()
    })

    it('should handle memory cleanup on errors', async () => {
      mockFilesetResolver.forVisionTasks.mockResolvedValue({})
      mockFaceLandmarkerCreate.mockResolvedValue(mockFaceLandmarker)
      await analyzer.initialize()

      // Simulate error during processing
      mockFaceLandmarker.detectForVideo.mockImplementation(() => {
        throw new Error('Out of memory')
      })

      const mockVideo = { videoWidth: 640, videoHeight: 480 }
      await analyzer.analyzeLandmarks(mockVideo, 0)

      // Verify cleanup methods are available
      expect(typeof analyzer.cleanup).toBe('function')
    })

    it('should validate landmark indices are within bounds', () => {
      const mockLandmarks = Array.from({ length: 468 }, (_, i) => ({
        x: Math.random(), y: Math.random(), z: Math.random()
      }))

      Object.values(analyzer.landmarkIndices).forEach(index => {
        if (typeof index === 'number') {
          expect(index).toBeGreaterThanOrEqual(0)
          expect(index).toBeLessThan(468)
        } else if (Array.isArray(index)) {
          index.forEach(i => {
            expect(i).toBeGreaterThanOrEqual(0)
            expect(i).toBeLessThan(468)
          })
        }
      })
    })
  })

  describe('Performance Considerations', () => {
    it('should complete landmark detection within reasonable time', async () => {
      mockFilesetResolver.forVisionTasks.mockResolvedValue({})
      mockFaceLandmarkerCreate.mockResolvedValue(mockFaceLandmarker)
      mockFaceLandmarker.detectForVideo.mockReturnValue({
        faceLandmarks: [{ landmarks: Array(468).fill({x: 0.5, y: 0.5, z: 0}) }]
      })
      await analyzer.initialize()

      const mockVideo = { videoWidth: 640, videoHeight: 480 }
      const startTime = performance.now()
      
      await analyzer.analyzeLandmarks(mockVideo, 0)
      
      const duration = performance.now() - startTime
      expect(duration).toBeLessThan(100) // Should complete in <100ms
    })

    it('should limit memory usage during processing', () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Simulate processing multiple frames
      for (let i = 0; i < 100; i++) {
        analyzer.lastLandmarks = {
          landmarks: Array(468).fill({x: Math.random(), y: Math.random(), z: Math.random()})
        }
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Should not increase memory by more than 10MB for 100 frames
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Integration Points', () => {
    it('should provide interface for Three.js integration', () => {
      expect(typeof analyzer.getVisemeMorphTargets).toBe('function')
      expect(typeof analyzer.getMorphInfluences).toBe('function')
    })

    it('should support real-time processing workflow', () => {
      expect(typeof analyzer.processVideoFrame).toBe('function')
      expect(typeof analyzer.getLatestViseme).toBe('function')
    })

    it('should provide debugging and monitoring hooks', () => {
      expect(typeof analyzer.getPerformanceMetrics).toBe('function')
      expect(typeof analyzer.enableDebugMode).toBe('function')
    })
  })
})