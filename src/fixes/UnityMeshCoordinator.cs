using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace NautiBouys.WebGL
{
    /// <summary>
    /// Unity Mesh Coordinator - Handles CC_Game_Body and CC_Game_Tongue coordination
    /// Provides unified access to morph targets across multiple meshes
    /// Fixes accessibility issues with tongue morphs in WebGL builds
    /// </summary>
    [RequireComponent(typeof(UnityMorphSynchronizer))]
    public class UnityMeshCoordinator : MonoBehaviour
    {
        #region Configuration
        [Header("Mesh Identification")]
        [SerializeField] private string bodyMeshName = "CC_Game_Body";
        [SerializeField] private string tongueMeshName = "CC_Game_Tongue";
        [SerializeField] private string[] additionalMeshNames = { "CC_Game_Teeth", "CC_Game_Eye" };
        
        [Header("Morph Target Mapping")]
        [SerializeField] private bool enableTongueMorphSharing = true;
        [SerializeField] private bool enableMorphConsolidation = true;
        [SerializeField] private float morphSharingThreshold = 0.01f;
        
        [Header("Debug")]
        [SerializeField] private bool debugMode = false;
        #endregion

        #region Private Fields
        private UnityMorphSynchronizer morphSynchronizer;
        private Dictionary<string, MeshMapping> meshMappings;
        private Dictionary<string, MorphTargetGroup> morphGroups;
        private Dictionary<string, string> morphRedirects;
        
        // Critical tongue morphs that need special handling
        private readonly string[] criticalTongueMorphs = {
            "Tongue_Tip_Up",
            "Tongue_Curl", 
            "Tongue_Out",
            "Tongue_Wide",
            "Tongue_Narrow"
        };
        
        // Viseme morph mappings for consolidated access
        private readonly Dictionary<string, string[]> visemeMorphMappings = new Dictionary<string, string[]>
        {
            // Dental sounds requiring tongue visibility
            ["TH"] = new[] { "Tongue_Out", "Mouth_Smile_L", "Mouth_Smile_R" },
            
            // Alveolar sounds requiring tongue tip up
            ["DD"] = new[] { "Tongue_Tip_Up", "Jaw_Open" },
            ["nn"] = new[] { "Tongue_Tip_Up", "Jaw_Open" },
            
            // Retroflex sounds requiring tongue curl
            ["RR"] = new[] { "Tongue_Curl", "Jaw_Open", "Mouth_Funnel", "Mouth_Pucker" }
        };
        #endregion

        #region Data Structures
        [Serializable]
        private class MeshMapping
        {
            public int meshIndex;
            public SkinnedMeshRenderer renderer;
            public string meshName;
            public List<string> morphTargets;
            public Dictionary<string, int> morphIndices;
            
            public MeshMapping(int index, SkinnedMeshRenderer meshRenderer)
            {
                meshIndex = index;
                renderer = meshRenderer;
                meshName = meshRenderer.name;
                morphTargets = new List<string>();
                morphIndices = new Dictionary<string, int>();
                
                // Build morph target list
                if (meshRenderer.sharedMesh != null)
                {
                    for (int i = 0; i < meshRenderer.sharedMesh.blendShapeCount; i++)
                    {
                        string morphName = meshRenderer.sharedMesh.GetBlendShapeName(i);
                        morphTargets.Add(morphName);
                        morphIndices[morphName] = i;
                    }
                }
            }
        }
        
        [Serializable]
        private class MorphTargetGroup
        {
            public string groupName;
            public List<MorphTarget> targets;
            public MorphSharingMode sharingMode;
            
            public MorphTargetGroup(string name, MorphSharingMode mode = MorphSharingMode.Independent)
            {
                groupName = name;
                targets = new List<MorphTarget>();
                sharingMode = mode;
            }
        }
        
        [Serializable]
        private class MorphTarget
        {
            public string morphName;
            public int meshIndex;
            public int blendShapeIndex;
            public SkinnedMeshRenderer renderer;
            public float lastWeight;
            
            public MorphTarget(string name, int mesh, int shape, SkinnedMeshRenderer meshRenderer)
            {
                morphName = name;
                meshIndex = mesh;
                blendShapeIndex = shape;
                renderer = meshRenderer;
                lastWeight = 0f;
            }
        }
        
        private enum MorphSharingMode
        {
            Independent,    // Each mesh has its own version
            Shared,         // Weight is shared across all instances
            Primary,        // Only primary mesh gets the weight
            Consolidated    // Merged into primary mesh
        }
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            InitializeCoordinator();
        }
        
        private void Start()
        {
            ValidateMeshConfiguration();
            SetupMorphRedirects();
        }
        #endregion

        #region Initialization
        private void InitializeCoordinator()
        {
            morphSynchronizer = GetComponent<UnityMorphSynchronizer>();
            meshMappings = new Dictionary<string, MeshMapping>();
            morphGroups = new Dictionary<string, MorphTargetGroup>();
            morphRedirects = new Dictionary<string, string>();
            
            BuildMeshMappings();
            CreateMorphGroups();
            
            Debug.Log($"[Unity Mesh Coordinator] Initialized with {meshMappings.Count} meshes");
        }
        
        private void BuildMeshMappings()
        {
            var renderers = GetComponentsInChildren<SkinnedMeshRenderer>();
            
            for (int i = 0; i < renderers.Length; i++)
            {
                var renderer = renderers[i];
                if (renderer == null || renderer.sharedMesh == null) continue;
                
                var mapping = new MeshMapping(i, renderer);
                meshMappings[renderer.name] = mapping;
                
                if (debugMode)
                {
                    Debug.Log($"[Unity Mesh Coordinator] Mapped mesh: {renderer.name} with {mapping.morphTargets.Count} morphs");
                }
            }
        }
        
        private void CreateMorphGroups()
        {
            // Create tongue morph group for special handling
            var tongueGroup = new MorphTargetGroup("TongueMorphs", MorphSharingMode.Shared);
            
            foreach (var meshMapping in meshMappings.Values)
            {
                foreach (var morphName in meshMapping.morphTargets)
                {
                    // Group tongue morphs
                    if (IsTongueMorph(morphName))
                    {
                        var target = new MorphTarget(
                            morphName, 
                            meshMapping.meshIndex, 
                            meshMapping.morphIndices[morphName],
                            meshMapping.renderer
                        );
                        tongueGroup.targets.Add(target);
                    }
                }
            }
            
            morphGroups["TongueMorphs"] = tongueGroup;
            
            // Create face morph group
            var faceGroup = new MorphTargetGroup("FaceMorphs", MorphSharingMode.Independent);
            
            foreach (var meshMapping in meshMappings.Values)
            {
                foreach (var morphName in meshMapping.morphTargets)
                {
                    if (!IsTongueMorph(morphName) && IsFaceMorph(morphName))
                    {
                        var target = new MorphTarget(
                            morphName,
                            meshMapping.meshIndex,
                            meshMapping.morphIndices[morphName],
                            meshMapping.renderer
                        );
                        faceGroup.targets.Add(target);
                    }
                }
            }
            
            morphGroups["FaceMorphs"] = faceGroup;
            
            Debug.Log($"[Unity Mesh Coordinator] Created {morphGroups.Count} morph groups");
            Debug.Log($"[Unity Mesh Coordinator] Tongue morphs: {tongueGroup.targets.Count}, Face morphs: {faceGroup.targets.Count}");
        }
        #endregion

        #region Mesh Validation
        private void ValidateMeshConfiguration()
        {
            bool hasBodyMesh = meshMappings.ContainsKey(bodyMeshName);
            bool hasTongueMesh = meshMappings.ContainsKey(tongueMeshName);
            
            if (!hasBodyMesh)
            {
                Debug.LogWarning($"[Unity Mesh Coordinator] Body mesh '{bodyMeshName}' not found!");
            }
            
            if (!hasTongueMesh)
            {
                Debug.LogWarning($"[Unity Mesh Coordinator] Tongue mesh '{tongueMeshName}' not found!");
            }
            
            // Check for critical tongue morphs
            ValidateCriticalTongueMorphs();
        }
        
        private void ValidateCriticalTongueMorphs()
        {
            var foundTongueMorphs = new List<string>();
            var missingTongueMorphs = new List<string>();
            
            foreach (string criticalMorph in criticalTongueMorphs)
            {
                bool found = false;
                
                foreach (var meshMapping in meshMappings.Values)
                {
                    if (meshMapping.morphIndices.ContainsKey(criticalMorph))
                    {
                        foundTongueMorphs.Add($"{criticalMorph} (on {meshMapping.meshName})");
                        found = true;
                        break;
                    }
                }
                
                if (!found)
                {
                    missingTongueMorphs.Add(criticalMorph);
                }
            }
            
            Debug.Log($"[Unity Mesh Coordinator] Found critical tongue morphs: {string.Join(", ", foundTongueMorphs)}");
            
            if (missingTongueMorphs.Count > 0)
            {
                Debug.LogWarning($"[Unity Mesh Coordinator] Missing critical tongue morphs: {string.Join(", ", missingTongueMorphs)}");
            }
        }
        #endregion

        #region Morph Redirect System
        private void SetupMorphRedirects()
        {
            // Set up redirects for tongue morphs that might be on different meshes
            foreach (string tongueMorph in criticalTongueMorphs)
            {
                string redirectKey = FindBestMorphMatch(tongueMorph);
                if (redirectKey != null && redirectKey != tongueMorph)
                {
                    morphRedirects[tongueMorph] = redirectKey;
                    
                    if (debugMode)
                    {
                        Debug.Log($"[Unity Mesh Coordinator] Redirect: {tongueMorph} -> {redirectKey}");
                    }
                }
            }
        }
        
        private string FindBestMorphMatch(string targetMorph)
        {
            // Direct match first
            foreach (var meshMapping in meshMappings.Values)
            {
                if (meshMapping.morphIndices.ContainsKey(targetMorph))
                {
                    return targetMorph;
                }
            }
            
            // Fuzzy matching for variations
            var variations = GenerateMorphVariations(targetMorph);
            
            foreach (string variation in variations)
            {
                foreach (var meshMapping in meshMappings.Values)
                {
                    if (meshMapping.morphIndices.ContainsKey(variation))
                    {
                        return variation;
                    }
                }
            }
            
            return null;
        }
        
        private List<string> GenerateMorphVariations(string baseMorph)
        {
            var variations = new List<string>();
            
            // Common naming variations
            variations.Add(baseMorph.Replace("_", ""));
            variations.Add(baseMorph.Replace("_", "-"));
            variations.Add(baseMorph.ToLower());
            variations.Add(baseMorph.ToUpper());
            
            // Prefix variations
            variations.Add("A25_" + baseMorph);
            variations.Add("V_" + baseMorph);
            variations.Add("Merged_" + baseMorph);
            
            return variations;
        }
        #endregion

        #region Public API
        /// <summary>
        /// Apply morph weight with automatic mesh coordination
        /// </summary>
        public bool ApplyMorph(string morphName, float weight)
        {
            // Check for redirects
            if (morphRedirects.ContainsKey(morphName))
            {
                morphName = morphRedirects[morphName];
            }
            
            bool applied = false;
            
            // Apply to appropriate morph group
            if (IsTongueMorph(morphName))
            {
                applied = ApplyTongueMorph(morphName, weight);
            }
            else
            {
                applied = ApplyStandardMorph(morphName, weight);
            }
            
            if (debugMode && applied)
            {
                Debug.Log($"[Unity Mesh Coordinator] Applied morph: {morphName} = {weight:F3}");
            }
            
            return applied;
        }
        
        /// <summary>
        /// Apply viseme with proper morph coordination
        /// </summary>
        public bool ApplyViseme(string visemeName, float intensity = 1.0f)
        {
            if (!visemeMorphMappings.ContainsKey(visemeName))
            {
                return false;
            }
            
            bool allApplied = true;
            var morphs = visemeMorphMappings[visemeName];
            
            foreach (string morphName in morphs)
            {
                float morphWeight = CalculateVisemeMorphWeight(visemeName, morphName, intensity);
                bool applied = ApplyMorph(morphName, morphWeight);
                allApplied &= applied;
            }
            
            if (debugMode)
            {
                Debug.Log($"[Unity Mesh Coordinator] Applied viseme: {visemeName} with intensity {intensity:F2}");
            }
            
            return allApplied;
        }
        
        /// <summary>
        /// Get all available morph targets across all meshes
        /// </summary>
        public Dictionary<string, MorphTargetInfo> GetAllMorphTargets()
        {
            var allMorphs = new Dictionary<string, MorphTargetInfo>();
            
            foreach (var meshMapping in meshMappings.Values)
            {
                foreach (var morphName in meshMapping.morphTargets)
                {
                    if (!allMorphs.ContainsKey(morphName))
                    {
                        allMorphs[morphName] = new MorphTargetInfo
                        {
                            morphName = morphName,
                            meshName = meshMapping.meshName,
                            meshIndex = meshMapping.meshIndex,
                            blendShapeIndex = meshMapping.morphIndices[morphName],
                            isTongueMorph = IsTongueMorph(morphName),
                            isCritical = Array.Exists(criticalTongueMorphs, m => m == morphName)
                        };
                    }
                }
            }
            
            return allMorphs;
        }
        
        /// <summary>
        /// Reset all morphs to zero
        /// </summary>
        public void ResetAllMorphs()
        {
            foreach (var group in morphGroups.Values)
            {
                foreach (var target in group.targets)
                {
                    target.renderer.SetBlendShapeWeight(target.blendShapeIndex, 0f);
                    target.lastWeight = 0f;
                }
            }
            
            Debug.Log("[Unity Mesh Coordinator] All morphs reset to zero");
        }
        #endregion

        #region Private Methods
        private bool ApplyTongueMorph(string morphName, float weight)
        {
            var tongueGroup = morphGroups["TongueMorphs"];
            bool applied = false;
            
            foreach (var target in tongueGroup.targets)
            {
                if (target.morphName == morphName)
                {
                    target.renderer.SetBlendShapeWeight(target.blendShapeIndex, weight * 100f);
                    target.lastWeight = weight;
                    applied = true;
                    
                    // If sharing mode is enabled, apply to all instances
                    if (enableTongueMorphSharing && tongueGroup.sharingMode == MorphSharingMode.Shared)
                    {
                        ApplyToAllInstances(morphName, weight);
                    }
                }
            }
            
            return applied;
        }
        
        private bool ApplyStandardMorph(string morphName, float weight)
        {
            bool applied = false;
            
            foreach (var meshMapping in meshMappings.Values)
            {
                if (meshMapping.morphIndices.ContainsKey(morphName))
                {
                    int blendShapeIndex = meshMapping.morphIndices[morphName];
                    meshMapping.renderer.SetBlendShapeWeight(blendShapeIndex, weight * 100f);
                    applied = true;
                }
            }
            
            return applied;
        }
        
        private void ApplyToAllInstances(string morphName, float weight)
        {
            foreach (var meshMapping in meshMappings.Values)
            {
                if (meshMapping.morphIndices.ContainsKey(morphName))
                {
                    int blendShapeIndex = meshMapping.morphIndices[morphName];
                    meshMapping.renderer.SetBlendShapeWeight(blendShapeIndex, weight * 100f);
                }
            }
        }
        
        private float CalculateVisemeMorphWeight(string viseme, string morphName, float intensity)
        {
            // Base intensities for different morph types
            var baseIntensities = new Dictionary<string, float>
            {
                ["Tongue_Tip_Up"] = 0.75f,
                ["Tongue_Curl"] = 0.8f,
                ["Tongue_Out"] = 0.7f,
                ["Jaw_Open"] = 0.3f,
                ["Mouth_Funnel"] = 0.4f,
                ["Mouth_Pucker"] = 0.3f,
                ["Mouth_Smile_L"] = 0.3f,
                ["Mouth_Smile_R"] = 0.3f
            };
            
            float baseIntensity = baseIntensities.ContainsKey(morphName) ? baseIntensities[morphName] : 0.5f;
            return baseIntensity * intensity;
        }
        
        private bool IsTongueMorph(string morphName)
        {
            return morphName.ToLower().Contains("tongue");
        }
        
        private bool IsFaceMorph(string morphName)
        {
            return morphName.ToLower().Contains("mouth") || 
                   morphName.ToLower().Contains("jaw") ||
                   morphName.ToLower().Contains("lip") ||
                   morphName.ToLower().Contains("cheek");
        }
        #endregion

        #region Data Classes
        [Serializable]
        public class MorphTargetInfo
        {
            public string morphName;
            public string meshName;
            public int meshIndex;
            public int blendShapeIndex;
            public bool isTongueMorph;
            public bool isCritical;
        }
        #endregion

        #region Unity Editor
#if UNITY_EDITOR
        [UnityEditor.MenuItem("Tools/Unity Mesh Coordinator/Validate Morph Setup")]
        private static void ValidateMorphSetup()
        {
            var coordinator = FindObjectOfType<UnityMeshCoordinator>();
            if (coordinator != null)
            {
                coordinator.ValidateMeshConfiguration();
                
                var morphTargets = coordinator.GetAllMorphTargets();
                Debug.Log($"Total morph targets found: {morphTargets.Count}");
                
                int tongueCount = 0;
                int faceCount = 0;
                
                foreach (var morph in morphTargets.Values)
                {
                    if (morph.isTongueMorph) tongueCount++;
                    else faceCount++;
                }
                
                Debug.Log($"Tongue morphs: {tongueCount}, Face morphs: {faceCount}");
            }
        }
        
        [UnityEditor.MenuItem("Tools/Unity Mesh Coordinator/Test Critical Tongue Morphs")]
        private static void TestCriticalTongueMorphs()
        {
            var coordinator = FindObjectOfType<UnityMeshCoordinator>();
            if (coordinator != null)
            {
                string[] testMorphs = { "Tongue_Tip_Up", "Tongue_Curl", "Tongue_Out" };
                
                foreach (string morph in testMorphs)
                {
                    bool applied = coordinator.ApplyMorph(morph, 1.0f);
                    Debug.Log($"Test morph {morph}: {(applied ? "SUCCESS" : "FAILED")}");
                }
            }
        }
#endif
        #endregion
    }
}