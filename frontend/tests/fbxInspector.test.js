import { describe, it, expect, vi } from 'vitest'
import { inspectFbx } from '../src/utils/fbxInspector'

// Helper to control loader behavior
const loadImpl = vi.fn((url, onLoad) => onLoad({ children: [1,2], animations: [1] }))

vi.mock('https://cdn.jsdelivr.net/npm/three@0.166/examples/jsm/loaders/FBXLoader.js', () => ({
  FBXLoader: class {
    load(url, onLoad, onProgress, onError) {
      loadImpl(url, onLoad, onProgress, onError)
    }
  }
}))

describe('inspectFbx', () => {
  it('returns basic info for a model', async () => {
    const info = await inspectFbx('/assets/model.fbx')
    expect(info).toEqual({ children: 2, animations: 1 })
  })

  it('propagates load errors', async () => {
    loadImpl.mockImplementationOnce((url, onLoad, onProgress, onError) => {
      onError(new Error('load failed'))
    })
    await expect(inspectFbx('/bad.fbx')).rejects.toThrow('load failed')
  })
})
