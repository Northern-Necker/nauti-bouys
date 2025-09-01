import * as THREE from 'three';

class GLBMorphTargetInfluencesTest {
    constructor() {
        this.meshes = {};
        this.morphTargetDictionaries = {};
        this.isDebugMode = true;
    }

    async initializeMeshes(gltfScene) {
        console.log('🔍 Initializing morphTargetInfluences system...');
        
        gltfScene.traverse((child) => {
            if (child.isMesh && child.morphTargetInfluences) {
                console.log(`📊 Found mesh with morph targets: ${child.name}`);
                console.log(`   - Morph target count: ${child.morphTargetInfluences.length}`);
                console.log(`   - Geometry morph attributes:`, Object.keys(child.geometry.morphAttributes));
                
                this.meshes[child.name] = child;
                this.morphTargetDictionaries[child.name] = child.morphTargetDictionary || {};
                
                // Critical fix from research: Ensure morphTargetInfluences is properly initialized
                if (!child.morphTargetInfluences || child.morphTargetInfluences.length === 0) {
                    console.warn(`⚠️ morphTargetInfluences missing for ${child.name}, initializing...`);
                    this.initializeMorphTargetInfluences(child);
                }
                
                // Store original influences for reset
                child.userData.originalMorphTargetInfluences = [...child.morphTargetInfluences];
                
                console.log(`✅ Initialized ${child.name} with ${child.morphTargetInfluences.length} morph targets`);
            }
        });
        
        console.log(`🎯 Total meshes with morph targets: ${Object.keys(this.meshes).length}`);
        return Object.keys(this.meshes).length > 0;
    }

    initializeMorphTargetInfluences(mesh) {
        // Fix from Three.js issue #11277: Manually initialize morphTargetInfluences
        const morphAttributes = mesh.geometry.morphAttributes;
        if (morphAttributes.position) {
            const morphCount = morphAttributes.position.length;
            mesh.morphTargetInfluences = new Array(morphCount).fill(0);
            console.log(`🔧 Created morphTargetInfluences array with ${morphCount} targets for ${mesh.name}`);
        }
    }

    applyViseme(visemeName, morphs) {
        if (!morphs || Object.keys(morphs).length === 0) {
            console.warn(`⚠️ No morphs provided for viseme: ${visemeName}`);
            return false;
        }

        console.log(`🎭 Applying viseme: ${visemeName}`);
        console.log(`📝 Morphs to apply:`, morphs);

        let successCount = 0;
        let totalMorphs = 0;

        // Reset all morph targets to 0 first
        this.resetAllMorphs();

        for (const [meshName, mesh] of Object.entries(this.meshes)) {
            const meshMorphs = this.filterMorphsForMesh(morphs, meshName);
            if (Object.keys(meshMorphs).length === 0) continue;

            console.log(`🔹 Applying morphs to ${meshName}:`, meshMorphs);
            
            for (const [morphName, intensity] of Object.entries(meshMorphs)) {
                totalMorphs++;
                if (this.applyMorphToMesh(mesh, morphName, intensity)) {
                    successCount++;
                }
            }

            // Critical: Force geometry and material updates based on research
            this.forceGeometryUpdate(mesh);
        }

        // Force scene render update
        this.forceSceneUpdate();

        console.log(`✅ Applied ${successCount}/${totalMorphs} morphs for viseme: ${visemeName}`);
        return successCount > 0;
    }

    applyMorphToMesh(mesh, morphName, intensity) {
        const morphIndex = this.getMorphIndex(mesh, morphName);
        
        if (morphIndex === -1) {
            console.warn(`⚠️ Morph '${morphName}' not found in mesh '${mesh.name}'`);
            return false;
        }

        // Apply using Three.js built-in morphTargetInfluences
        const previousValue = mesh.morphTargetInfluences[morphIndex];
        mesh.morphTargetInfluences[morphIndex] = intensity;

        console.log(`🔄 ${mesh.name}.morphTargetInfluences[${morphIndex}] (${morphName}): ${previousValue} → ${intensity}`);
        return true;
    }

    getMorphIndex(mesh, morphName) {
        // Check morphTargetDictionary first
        if (mesh.morphTargetDictionary && mesh.morphTargetDictionary[morphName] !== undefined) {
            return mesh.morphTargetDictionary[morphName];
        }

        // Check stored dictionary
        const meshName = mesh.name;
        if (this.morphTargetDictionaries[meshName] && this.morphTargetDictionaries[meshName][morphName] !== undefined) {
            return this.morphTargetDictionaries[meshName][morphName];
        }

        // Manual search through geometry (fallback)
        const morphAttributes = mesh.geometry.morphAttributes;
        if (morphAttributes.position) {
            for (let i = 0; i < morphAttributes.position.length; i++) {
                const attribute = morphAttributes.position[i];
                if (attribute.name === morphName) {
                    return i;
                }
            }
        }

        return -1;
    }

    forceGeometryUpdate(mesh) {
        // Based on research: Critical update sequence for morph targets
        if (mesh.geometry) {
            // Mark geometry for update
            mesh.geometry.morphTargetsRelative = false; // Ensure absolute morph targets
            
            // Force position attribute update
            if (mesh.geometry.attributes.position) {
                mesh.geometry.attributes.position.needsUpdate = true;
            }
            
            // Force normal attribute update
            if (mesh.geometry.attributes.normal) {
                mesh.geometry.attributes.normal.needsUpdate = true;
            }
            
            // Compute new bounding sphere/box
            mesh.geometry.computeBoundingSphere();
            mesh.geometry.computeBoundingBox();
        }

        // Force material update
        if (mesh.material) {
            mesh.material.needsUpdate = true;
        }

        // Mark mesh for update
        mesh.updateMorphTargets();
        mesh.updateMatrixWorld(true);
        
        console.log(`🔄 Forced geometry update for ${mesh.name}`);
    }

    forceSceneUpdate() {
        // Force render update for all meshes
        for (const mesh of Object.values(this.meshes)) {
            mesh.visible = false;
            mesh.visible = true; // Force visibility recalculation
        }
        
        console.log('🔄 Forced scene update');
    }

    filterMorphsForMesh(morphs, meshName) {
        const filtered = {};
        
        for (const [morphName, intensity] of Object.entries(morphs)) {
            // Check if this morph exists in this mesh
            const mesh = this.meshes[meshName];
            if (this.getMorphIndex(mesh, morphName) !== -1) {
                filtered[morphName] = intensity;
            }
        }
        
        return filtered;
    }

    resetAllMorphs() {
        console.log('🔄 Resetting all morph targets to 0');
        
        for (const mesh of Object.values(this.meshes)) {
            if (mesh.morphTargetInfluences) {
                for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                    mesh.morphTargetInfluences[i] = 0;
                }
                this.forceGeometryUpdate(mesh);
            }
        }
    }

    getCurrentMorphState() {
        const state = {};
        
        for (const [meshName, mesh] of Object.entries(this.meshes)) {
            state[meshName] = {};
            
            if (mesh.morphTargetInfluences) {
                for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                    const influence = mesh.morphTargetInfluences[i];
                    if (influence > 0.001) { // Only show non-zero influences
                        const morphName = this.getMorphNameByIndex(mesh, i);
                        state[meshName][morphName || `index_${i}`] = influence.toFixed(3);
                    }
                }
            }
        }
        
        return state;
    }

    getMorphNameByIndex(mesh, index) {
        // Reverse lookup from morphTargetDictionary
        if (mesh.morphTargetDictionary) {
            for (const [name, idx] of Object.entries(mesh.morphTargetDictionary)) {
                if (idx === index) return name;
            }
        }

        // Fallback: try to get from morph attributes
        const morphAttributes = mesh.geometry.morphAttributes;
        if (morphAttributes.position && morphAttributes.position[index]) {
            return morphAttributes.position[index].name;
        }

        return null;
    }

    diagnoseSystem() {
        console.log('\n🔍 === MORPH TARGET SYSTEM DIAGNOSIS ===');
        
        for (const [meshName, mesh] of Object.entries(this.meshes)) {
            console.log(`\n📊 Mesh: ${meshName}`);
            console.log(`   - morphTargetInfluences length: ${mesh.morphTargetInfluences?.length || 0}`);
            console.log(`   - morphTargetDictionary entries: ${Object.keys(mesh.morphTargetDictionary || {}).length}`);
            console.log(`   - Geometry morphAttributes.position: ${mesh.geometry.morphAttributes.position?.length || 0}`);
            
            if (mesh.morphTargetDictionary) {
                console.log(`   - Available morphs:`, Object.keys(mesh.morphTargetDictionary));
            }
            
            // Check for common issues
            if (mesh.morphTargetInfluences && mesh.geometry.morphAttributes.position) {
                const influenceCount = mesh.morphTargetInfluences.length;
                const attributeCount = mesh.geometry.morphAttributes.position.length;
                
                if (influenceCount !== attributeCount) {
                    console.warn(`   ⚠️ MISMATCH: influences(${influenceCount}) !== attributes(${attributeCount})`);
                }
            }
        }
        
        console.log('\n=== END DIAGNOSIS ===\n');
    }
}

export default GLBMorphTargetInfluencesTest;
