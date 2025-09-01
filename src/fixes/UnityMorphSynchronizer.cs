using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;

namespace NautiBouys.WebGL
{
    /// <summary>
    /// Unity WebGL Morph Synchronizer - Production-ready morph target sync system
    /// Handles frame-perfect synchronization with JavaScript bridge
    /// Fixes GPU synchronization issues between Unity's renderer and WebGL
    /// Coordinates CC_Game_Body and CC_Game_Tongue mesh updates
    /// </summary>
    public class UnityMorphSynchronizer : MonoBehaviour
    {
        #region JavaScript Bridge Imports
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern void RegisterJavaScriptBridge();
        
        [DllImport("__Internal")]
        private static extern void NotifyFrameSynchronized();
        
        [DllImport("__Internal")]
        private static extern void SendPerformanceMetrics(float fps, float frameTime, float morphTime, int visemeCount);
#endif
        #endregion

        #region Configuration
        [Header("Morph Synchronization Settings")]
        [SerializeField] private bool enableGPUSync = true;
        [SerializeField] private bool enablePerformanceTracking = true;
        [SerializeField] private float morphUpdateThreshold = 0.001f;
        [SerializeField] private int maxBatchSize = 50;
        
        [Header("Mesh Configuration")]
        [SerializeField] private SkinnedMeshRenderer[] meshRenderers;
        [SerializeField] private string[] meshNames = { "CC_Game_Body", "CC_Game_Tongue" };
        
        [Header("Debug")]
        [SerializeField] private bool debugMode = false;
        #endregion

        #region Private Fields
        private Dictionary<string, MorphTargetData> morphTargetMap;
        private Dictionary<string, float> currentMorphWeights;
        private Dictionary<string, float> targetMorphWeights;
        private Queue<MorphUpdateBatch> updateQueue;
        
        // Performance tracking
        private PerformanceTracker performance;
        private Coroutine syncCoroutine;
        
        // WebGL synchronization
        private bool isWebGLBuild;
        private bool jsBridgeReady;
        
        // Frame timing
        private float lastFrameTime;
        private float morphProcessingTime;
        #endregion

        #region Data Structures
        [Serializable]
        private class MorphTargetData
        {
            public int meshIndex;
            public int blendShapeIndex;
            public string originalName;
            public SkinnedMeshRenderer renderer;
            public float lastWeight;
            
            public MorphTargetData(int meshIdx, int shapeIdx, string name, SkinnedMeshRenderer meshRenderer)
            {
                meshIndex = meshIdx;
                blendShapeIndex = shapeIdx;
                originalName = name;
                renderer = meshRenderer;
                lastWeight = 0f;
            }
        }
        
        [Serializable]
        private class MorphUpdateBatch
        {
            public Dictionary<string, float> morphUpdates;
            public float timestamp;
            public int frameNumber;
            
            public MorphUpdateBatch()
            {
                morphUpdates = new Dictionary<string, float>();
                timestamp = Time.time;
                frameNumber = Time.frameCount;
            }
        }
        
        private class PerformanceTracker
        {
            public float averageFPS;
            public float lastFrameTime;
            public float morphUpdateTime;
            public int activeMorphCount;
            public int totalFrames;
            
            private Queue<float> fpsHistory = new Queue<float>();
            private const int HISTORY_SIZE = 60; // 1 second at 60fps
            
            public void UpdateMetrics(float frameTime, float morphTime, int morphCount)
            {
                lastFrameTime = frameTime;
                morphUpdateTime = morphTime;
                activeMorphCount = morphCount;
                totalFrames++;
                
                // Calculate FPS
                float currentFPS = 1f / frameTime;
                fpsHistory.Enqueue(currentFPS);
                
                if (fpsHistory.Count > HISTORY_SIZE)
                {
                    fpsHistory.Dequeue();
                }
                
                // Calculate average FPS
                float sum = 0f;
                foreach (float fps in fpsHistory)
                {
                    sum += fps;
                }
                averageFPS = sum / fpsHistory.Count;
            }
        }
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            InitializeSystem();
        }
        
        private void Start()
        {
            StartSynchronization();
        }
        
        private void Update()
        {
            ProcessMorphUpdates();
            UpdatePerformanceTracking();
        }
        
        private void LateUpdate()
        {
            // Ensure morphs are applied after all other updates
            SynchronizeWithGPU();
        }
        
        private void OnDestroy()
        {
            CleanupSystem();
        }
        #endregion

        #region Initialization
        private void InitializeSystem()
        {
            isWebGLBuild = Application.platform == RuntimePlatform.WebGLPlayer;
            
            // Initialize collections
            morphTargetMap = new Dictionary<string, MorphTargetData>();
            currentMorphWeights = new Dictionary<string, float>();
            targetMorphWeights = new Dictionary<string, float>();
            updateQueue = new Queue<MorphUpdateBatch>();
            performance = new PerformanceTracker();
            
            // Auto-find mesh renderers if not assigned
            if (meshRenderers == null || meshRenderers.Length == 0)
            {
                meshRenderers = GetComponentsInChildren<SkinnedMeshRenderer>();
            }
            
            // Build morph target mapping
            BuildMorphTargetMap();
            
            Debug.Log($"[Unity Morph Sync] System initialized with {morphTargetMap.Count} morph targets across {meshRenderers.Length} meshes");
        }
        
        private void BuildMorphTargetMap()
        {
            int totalMorphs = 0;
            
            for (int meshIndex = 0; meshIndex < meshRenderers.Length; meshIndex++)
            {
                var renderer = meshRenderers[meshIndex];
                if (renderer == null || renderer.sharedMesh == null) continue;
                
                var mesh = renderer.sharedMesh;
                string meshName = renderer.name;
                
                for (int blendShapeIndex = 0; blendShapeIndex < mesh.blendShapeCount; blendShapeIndex++)
                {
                    string morphName = mesh.GetBlendShapeName(blendShapeIndex);
                    string key = $"{meshIndex}_{morphName}";
                    
                    var morphData = new MorphTargetData(meshIndex, blendShapeIndex, morphName, renderer);
                    morphTargetMap[key] = morphData;
                    
                    // Initialize weight tracking
                    currentMorphWeights[key] = 0f;
                    targetMorphWeights[key] = 0f;
                    
                    totalMorphs++;
                    
                    if (debugMode && (morphName.Contains("Tongue") || morphName.Contains("Mouth")))
                    {
                        Debug.Log($"[Unity Morph Sync] Registered: {morphName} on mesh {meshName} (Index: {blendShapeIndex})");
                    }
                }
            }
            
            Debug.Log($"[Unity Morph Sync] Registered {totalMorphs} morph targets");
        }
        
        private void StartSynchronization()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            if (isWebGLBuild)
            {
                RegisterJavaScriptBridge();
                jsBridgeReady = true;
                Debug.Log("[Unity Morph Sync] JavaScript bridge registered");
            }
#endif
            
            // Start synchronization coroutine
            if (syncCoroutine != null)
            {
                StopCoroutine(syncCoroutine);
            }
            syncCoroutine = StartCoroutine(SynchronizationLoop());
        }
        #endregion

        #region Morph Processing
        private void ProcessMorphUpdates()
        {
            float startTime = Time.realtimeSinceStartup;
            int processedMorphs = 0;
            
            // Process queued batch updates
            while (updateQueue.Count > 0 && processedMorphs < maxBatchSize)
            {
                var batch = updateQueue.Dequeue();
                ProcessMorphBatch(batch);
                processedMorphs += batch.morphUpdates.Count;
            }
            
            // Apply smooth transitions for all morphs
            ApplySmoothTransitions();
            
            morphProcessingTime = Time.realtimeSinceStartup - startTime;
        }
        
        private void ProcessMorphBatch(MorphUpdateBatch batch)
        {
            foreach (var morphUpdate in batch.morphUpdates)
            {
                string key = morphUpdate.Key;
                float targetWeight = morphUpdate.Value;
                
                if (morphTargetMap.ContainsKey(key))
                {
                    targetMorphWeights[key] = targetWeight;
                    
                    if (debugMode && Math.Abs(targetWeight - currentMorphWeights[key]) > morphUpdateThreshold)
                    {
                        Debug.Log($"[Unity Morph Sync] Updated {key}: {currentMorphWeights[key]:F3} -> {targetWeight:F3}");
                    }
                }
            }
        }
        
        private void ApplySmoothTransitions()
        {
            foreach (var morphKey in morphTargetMap.Keys)
            {
                if (!currentMorphWeights.ContainsKey(morphKey) || !targetMorphWeights.ContainsKey(morphKey))
                    continue;
                
                float currentWeight = currentMorphWeights[morphKey];
                float targetWeight = targetMorphWeights[morphKey];
                
                // Smooth interpolation
                float newWeight = Mathf.Lerp(currentWeight, targetWeight, Time.deltaTime * 10f);
                
                // Only update if change is significant
                if (Math.Abs(newWeight - currentWeight) > morphUpdateThreshold)
                {
                    currentMorphWeights[morphKey] = newWeight;
                    
                    // Apply to mesh renderer
                    var morphData = morphTargetMap[morphKey];
                    morphData.renderer.SetBlendShapeWeight(morphData.blendShapeIndex, newWeight * 100f);
                    morphData.lastWeight = newWeight;
                }
            }
        }
        
        private void SynchronizeWithGPU()
        {
            if (!enableGPUSync || !isWebGLBuild) return;
            
#if UNITY_WEBGL && !UNITY_EDITOR
            if (jsBridgeReady)
            {
                NotifyFrameSynchronized();
            }
#endif
        }
        #endregion

        #region Performance Tracking
        private void UpdatePerformanceTracking()
        {
            if (!enablePerformanceTracking) return;
            
            float currentFrameTime = Time.deltaTime;
            int activeMorphs = CountActiveMorphs();
            
            performance.UpdateMetrics(currentFrameTime, morphProcessingTime, activeMorphs);
            
#if UNITY_WEBGL && !UNITY_EDITOR
            // Send metrics to JavaScript every 60 frames
            if (performance.totalFrames % 60 == 0 && jsBridgeReady)
            {
                SendPerformanceMetrics(
                    performance.averageFPS,
                    performance.lastFrameTime * 1000f,
                    performance.morphUpdateTime * 1000f,
                    performance.activeMorphCount
                );
            }
#endif
        }
        
        private int CountActiveMorphs()
        {
            int count = 0;
            foreach (var weight in currentMorphWeights.Values)
            {
                if (Math.Abs(weight) > morphUpdateThreshold)
                {
                    count++;
                }
            }
            return count;
        }
        #endregion

        #region Synchronization Loop
        private IEnumerator SynchronizationLoop()
        {
            while (enabled)
            {
                // Wait for end of frame to ensure all updates are processed
                yield return new WaitForEndOfFrame();
                
                // Force GPU synchronization
                if (enableGPUSync)
                {
                    GL.Flush();
                    GL.InvalidateState();
                }
                
                yield return null;
            }
        }
        #endregion

        #region JavaScript Bridge Methods
        public void RegisterJavaScriptBridge()
        {
            jsBridgeReady = true;
            Debug.Log("[Unity Morph Sync] JavaScript bridge connection established");
        }
        
        public void ProcessBatchMorphUpdate(string morphDataJson)
        {
            try
            {
                var morphs = JsonUtility.FromJson<Dictionary<string, float>>(morphDataJson);
                if (morphs != null)
                {
                    var batch = new MorphUpdateBatch();
                    batch.morphUpdates = morphs;
                    updateQueue.Enqueue(batch);
                    
                    if (debugMode)
                    {
                        Debug.Log($"[Unity Morph Sync] Received batch update with {morphs.Count} morphs");
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[Unity Morph Sync] Failed to process batch update: {e.Message}");
            }
        }
        
        public void UpdateSingleMorph(string morphKey, float weight)
        {
            if (morphTargetMap.ContainsKey(morphKey))
            {
                targetMorphWeights[morphKey] = weight;
            }
        }
        
        public void SetConfiguration(string configJson)
        {
            try
            {
                var config = JsonUtility.FromJson<SynchronizerConfig>(configJson);
                if (config != null)
                {
                    enableGPUSync = config.enableGPUSync;
                    morphUpdateThreshold = config.morphUpdateThreshold;
                    maxBatchSize = config.maxBatchSize;
                    
                    Debug.Log("[Unity Morph Sync] Configuration updated from JavaScript");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[Unity Morph Sync] Failed to update configuration: {e.Message}");
            }
        }
        #endregion

        #region External API
        /// <summary>
        /// Apply morph targets directly (for non-WebGL use)
        /// </summary>
        public void ApplyMorphTargets(Dictionary<string, float> morphWeights)
        {
            var batch = new MorphUpdateBatch();
            batch.morphUpdates = morphWeights;
            updateQueue.Enqueue(batch);
        }
        
        /// <summary>
        /// Get current system status
        /// </summary>
        public SystemStatus GetSystemStatus()
        {
            return new SystemStatus
            {
                isReady = jsBridgeReady,
                activeMorphCount = CountActiveMorphs(),
                queueLength = updateQueue.Count,
                averageFPS = performance.averageFPS,
                morphProcessingTime = morphProcessingTime * 1000f
            };
        }
        
        /// <summary>
        /// Reset all morph weights to zero
        /// </summary>
        public void ResetAllMorphs()
        {
            var resetBatch = new MorphUpdateBatch();
            foreach (var key in morphTargetMap.Keys)
            {
                resetBatch.morphUpdates[key] = 0f;
            }
            updateQueue.Enqueue(resetBatch);
        }
        #endregion

        #region Cleanup
        private void CleanupSystem()
        {
            if (syncCoroutine != null)
            {
                StopCoroutine(syncCoroutine);
            }
            
            updateQueue?.Clear();
            morphTargetMap?.Clear();
            currentMorphWeights?.Clear();
            targetMorphWeights?.Clear();
            
            Debug.Log("[Unity Morph Sync] System cleaned up");
        }
        #endregion

        #region Data Classes
        [Serializable]
        public class SynchronizerConfig
        {
            public bool enableGPUSync = true;
            public float morphUpdateThreshold = 0.001f;
            public int maxBatchSize = 50;
        }
        
        [Serializable]
        public class SystemStatus
        {
            public bool isReady;
            public int activeMorphCount;
            public int queueLength;
            public float averageFPS;
            public float morphProcessingTime;
        }
        #endregion

        #region Unity Editor
#if UNITY_EDITOR
        [UnityEditor.MenuItem("Tools/Unity Morph Sync/Test Morph Updates")]
        private static void TestMorphUpdates()
        {
            var synchronizer = FindObjectOfType<UnityMorphSynchronizer>();
            if (synchronizer != null)
            {
                var testMorphs = new Dictionary<string, float>
                {
                    { "0_Mouth_Open", 0.5f },
                    { "1_Tongue_Tip_Up", 0.7f },
                    { "0_Jaw_Open", 0.3f }
                };
                
                synchronizer.ApplyMorphTargets(testMorphs);
                Debug.Log("Test morph updates applied");
            }
        }
        
        [UnityEditor.MenuItem("Tools/Unity Morph Sync/Print System Status")]
        private static void PrintSystemStatus()
        {
            var synchronizer = FindObjectOfType<UnityMorphSynchronizer>();
            if (synchronizer != null)
            {
                var status = synchronizer.GetSystemStatus();
                Debug.Log($"Unity Morph Sync Status:\n" +
                         $"Ready: {status.isReady}\n" +
                         $"Active Morphs: {status.activeMorphCount}\n" +
                         $"Queue Length: {status.queueLength}\n" +
                         $"Average FPS: {status.averageFPS:F1}\n" +
                         $"Morph Processing Time: {status.morphProcessingTime:F2}ms");
            }
        }
#endif
        #endregion
    }
}