import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

/**
 * GLB Model Inspector - Analyzes bone structure and animation capabilities
 */
export class GLBInspector {
  constructor() {
    this.loader = new GLTFLoader()
  }

  /**
   * Load and analyze a GLB model
   * @param {string} modelPath - Path to the GLB model
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeModel(modelPath) {
    try {
      const gltf = await this.loadModel(modelPath)
      const analysis = {
        model: gltf,
        bones: this.analyzeBones(gltf.scene),
        animations: this.analyzeAnimations(gltf.animations),
        morphTargets: this.analyzeMorphTargets(gltf.scene),
        materials: this.analyzeMaterials(gltf.scene),
        meshes: this.analyzeMeshes(gltf.scene)
      }
      
      console.log('GLB Model Analysis:', analysis)
      return analysis
    } catch (error) {
      console.error('Error analyzing GLB model:', error)
      throw error
    }
  }

  /**
   * Load GLB model using GLTFLoader
   */
  loadModel(modelPath) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        modelPath,
        (gltf) => resolve(gltf),
        (progress) => console.log('Loading progress:', progress),
        (error) => reject(error)
      )
    })
  }

  /**
   * Analyze bone structure for animation capabilities
   */
  analyzeBones(scene) {
    const bones = []
    const skeletons = []
    
    scene.traverse((child) => {
      if (child.isBone) {
        bones.push({
          name: child.name,
          position: child.position.toArray(),
          rotation: child.rotation.toArray(),
          scale: child.scale.toArray(),
          parent: child.parent?.name || null,
          children: child.children.map(c => c.name)
        })
      }
      
      if (child.isSkinnedMesh && child.skeleton) {
        skeletons.push({
          bones: child.skeleton.bones.map(bone => ({
            name: bone.name,
            index: child.skeleton.bones.indexOf(bone)
          })),
          boneInverses: child.skeleton.boneInverses.length
        })
      }
    })

    // Categorize bones by type for animation purposes
    const categorizedBones = this.categorizeBones(bones)
    
    return {
      total: bones.length,
      bones,
      skeletons,
      categories: categorizedBones
    }
  }

  /**
   * Categorize bones for different animation types
   */
  categorizeBones(bones) {
    const categories = {
      head: [],
      neck: [],
      face: [],
      eyes: [],
      jaw: [],
      body: [],
      arms: [],
      hands: [],
      legs: [],
      unknown: []
    }

    bones.forEach(bone => {
      const name = bone.name.toLowerCase()
      
      if (name.includes('head') || name.includes('skull')) {
        categories.head.push(bone)
      } else if (name.includes('neck')) {
        categories.neck.push(bone)
      } else if (name.includes('eye')) {
        categories.eyes.push(bone)
      } else if (name.includes('jaw') || name.includes('chin')) {
        categories.jaw.push(bone)
      } else if (name.includes('face') || name.includes('cheek') || name.includes('brow')) {
        categories.face.push(bone)
      } else if (name.includes('spine') || name.includes('chest') || name.includes('back')) {
        categories.body.push(bone)
      } else if (name.includes('arm') || name.includes('shoulder') || name.includes('elbow')) {
        categories.arms.push(bone)
      } else if (name.includes('hand') || name.includes('finger') || name.includes('thumb')) {
        categories.hands.push(bone)
      } else if (name.includes('leg') || name.includes('thigh') || name.includes('knee') || name.includes('foot')) {
        categories.legs.push(bone)
      } else {
        categories.unknown.push(bone)
      }
    })

    return categories
  }

  /**
   * Analyze existing animations in the model
   */
  analyzeAnimations(animations) {
    if (!animations || animations.length === 0) {
      return { total: 0, animations: [] }
    }

    const animationData = animations.map(animation => ({
      name: animation.name,
      duration: animation.duration,
      tracks: animation.tracks.map(track => ({
        name: track.name,
        type: track.constructor.name,
        times: track.times.length,
        values: track.values.length
      }))
    }))

    return {
      total: animations.length,
      animations: animationData
    }
  }

  /**
   * Analyze morph targets for facial expressions
   */
  analyzeMorphTargets(scene) {
    const morphTargets = []
    
    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetInfluences) {
        const targets = []
        
        if (child.geometry.morphAttributes.position) {
          child.geometry.morphAttributes.position.forEach((attr, index) => {
            targets.push({
              index,
              name: child.morphTargetDictionary ? 
                Object.keys(child.morphTargetDictionary).find(key => 
                  child.morphTargetDictionary[key] === index
                ) : `Target_${index}`,
              vertexCount: attr.count
            })
          })
        }

        if (targets.length > 0) {
          morphTargets.push({
            meshName: child.name,
            targets,
            influences: [...child.morphTargetInfluences]
          })
        }
      }
    })

    return {
      total: morphTargets.reduce((sum, mesh) => sum + mesh.targets.length, 0),
      meshes: morphTargets
    }
  }

  /**
   * Analyze materials for texture and appearance info
   */
  analyzeMaterials(scene) {
    const materials = new Set()
    
    scene.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => materials.add(mat))
        } else {
          materials.add(child.material)
        }
      }
    })

    return Array.from(materials).map(material => ({
      name: material.name,
      type: material.constructor.name,
      hasMap: !!material.map,
      hasNormalMap: !!material.normalMap,
      hasRoughnessMap: !!material.roughnessMap,
      hasMetalnessMap: !!material.metalnessMap,
      transparent: material.transparent,
      opacity: material.opacity
    }))
  }

  /**
   * Analyze meshes in the model
   */
  analyzeMeshes(scene) {
    const meshes = []
    
    scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push({
          name: child.name,
          vertices: child.geometry.attributes.position?.count || 0,
          faces: child.geometry.index ? child.geometry.index.count / 3 : 0,
          hasUV: !!child.geometry.attributes.uv,
          hasNormals: !!child.geometry.attributes.normal,
          hasSkinning: !!child.geometry.attributes.skinIndex,
          morphTargets: child.morphTargetInfluences?.length || 0
        })
      }
    })

    return meshes
  }

  /**
   * Generate animation capability report
   */
  generateAnimationReport(analysis) {
    const report = {
      canAnimate: analysis.bones.total > 0 || analysis.morphTargets.total > 0,
      capabilities: {
        headMovement: analysis.bones.categories.head.length > 0 || analysis.bones.categories.neck.length > 0,
        facialExpressions: analysis.morphTargets.total > 0 || analysis.bones.categories.face.length > 0,
        eyeMovement: analysis.bones.categories.eyes.length > 0,
        jawMovement: analysis.bones.categories.jaw.length > 0,
        bodyGestures: analysis.bones.categories.body.length > 0 || analysis.bones.categories.arms.length > 0,
        handGestures: analysis.bones.categories.hands.length > 0
      },
      recommendations: []
    }

    // Generate recommendations based on analysis
    if (analysis.morphTargets.total > 0) {
      report.recommendations.push('Use morph targets for facial expressions and lip sync')
    }
    
    if (analysis.bones.categories.head.length > 0) {
      report.recommendations.push('Implement head tracking and nodding animations')
    }
    
    if (analysis.bones.categories.jaw.length > 0) {
      report.recommendations.push('Use jaw bone for basic lip sync animation')
    }
    
    if (analysis.bones.categories.eyes.length > 0) {
      report.recommendations.push('Implement eye tracking and blinking')
    }
    
    if (analysis.bones.categories.arms.length > 0) {
      report.recommendations.push('Add gesture animations using arm bones')
    }

    if (analysis.animations.total > 0) {
      report.recommendations.push('Utilize existing animations in the model')
    }

    return report
  }
}

// Export utility functions
export const inspectGLBModel = async (modelPath) => {
  const inspector = new GLBInspector()
  const analysis = await inspector.analyzeModel(modelPath)
  const report = inspector.generateAnimationReport(analysis)
  
  return {
    analysis,
    report,
    summary: {
      totalBones: analysis.bones.total,
      totalMorphTargets: analysis.morphTargets.total,
      totalAnimations: analysis.animations.total,
      canAnimate: report.canAnimate,
      capabilities: report.capabilities
    }
  }
}

export default GLBInspector
