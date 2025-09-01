#!/usr/bin/env node

/**
 * Direct GLB Analysis Script
 * Analyzes party-f-0013.glb for morph targets and facial animation capabilities
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import fs from 'fs'
import path from 'path'

const GLB_PATH = './public/assets/party-f-0013.glb'

class SavannahGLBAnalyzer {
  constructor() {
    this.loader = new GLTFLoader()
  }

  async analyzeGLB() {
    console.log('🔍 Analyzing party-f-0013.glb...')
    console.log('📁 File path:', GLB_PATH)
    
    if (!fs.existsSync(GLB_PATH)) {
      throw new Error(`GLB file not found: ${GLB_PATH}`)
    }

    const stats = fs.statSync(GLB_PATH)
    console.log('📊 File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB')
    
    try {
      const gltf = await this.loadGLB()
      const analysis = {
        morphTargets: this.analyzeMorphTargets(gltf.scene),
        bones: this.analyzeBones(gltf.scene),
        meshes: this.analyzeMeshes(gltf.scene),
        animations: this.analyzeAnimations(gltf.animations || []),
        materials: this.analyzeMaterials(gltf.scene)
      }

      this.printAnalysisReport(analysis)
      return analysis
    } catch (error) {
      console.error('❌ Error analyzing GLB:', error)
      throw error
    }
  }

  loadGLB() {
    return new Promise((resolve, reject) => {
      const fileBuffer = fs.readFileSync(GLB_PATH)
      
      // Convert to ArrayBuffer for GLTFLoader
      const arrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      )
      
      this.loader.parse(arrayBuffer, '', 
        (gltf) => resolve(gltf),
        (error) => reject(error)
      )
    })
  }

  analyzeMorphTargets(scene) {
    console.log('\n🎭 ANALYZING MORPH TARGETS...')
    const morphTargets = []
    let totalTargets = 0

    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetInfluences) {
        const targets = []
        
        console.log(`  📦 Found mesh with morph targets: ${child.name}`)
        console.log(`     - Influences array length: ${child.morphTargetInfluences.length}`)
        
        if (child.geometry.morphAttributes.position) {
          console.log(`     - Position morph attributes: ${child.geometry.morphAttributes.position.length}`)
          
          child.geometry.morphAttributes.position.forEach((attr, index) => {
            const targetName = child.morphTargetDictionary ? 
              Object.keys(child.morphTargetDictionary).find(key => 
                child.morphTargetDictionary[key] === index
              ) : `Target_${index}`

            targets.push({
              index,
              name: targetName,
              vertexCount: attr.count,
              influence: child.morphTargetInfluences[index] || 0
            })

            console.log(`       [${index}] ${targetName} - ${attr.count} vertices`)
          })
        }

        if (targets.length > 0) {
          morphTargets.push({
            meshName: child.name,
            targets,
            influences: [...child.morphTargetInfluences]
          })
          totalTargets += targets.length
        }
      }
    })

    console.log(`  📊 Total morph targets found: ${totalTargets}`)
    return { total: totalTargets, meshes: morphTargets }
  }

  analyzeBones(scene) {
    console.log('\n🦴 ANALYZING BONE STRUCTURE...')
    const bones = []
    const facialBones = []
    
    scene.traverse((child) => {
      if (child.isBone) {
        const boneInfo = {
          name: child.name,
          parent: child.parent?.name || null,
          children: child.children.map(c => c.name).filter(name => name)
        }
        
        bones.push(boneInfo)
        
        // Check for facial animation bones
        const name = child.name.toLowerCase()
        if (name.includes('face') || name.includes('head') || name.includes('jaw') || 
            name.includes('eye') || name.includes('mouth') || name.includes('lip') ||
            name.includes('brow') || name.includes('cheek')) {
          facialBones.push(boneInfo)
          console.log(`  🎭 Facial bone found: ${child.name}`)
        }
      }
    })

    console.log(`  📊 Total bones: ${bones.length}`)
    console.log(`  🎭 Facial bones: ${facialBones.length}`)
    
    return { total: bones.length, bones, facialBones }
  }

  analyzeMeshes(scene) {
    console.log('\n🔺 ANALYZING MESHES...')
    const meshes = []
    
    scene.traverse((child) => {
      if (child.isMesh) {
        const meshInfo = {
          name: child.name,
          vertices: child.geometry.attributes.position?.count || 0,
          faces: child.geometry.index ? child.geometry.index.count / 3 : 0,
          hasSkinning: !!child.geometry.attributes.skinIndex,
          morphTargets: child.morphTargetInfluences?.length || 0
        }
        
        meshes.push(meshInfo)
        console.log(`  📦 Mesh: ${child.name}`)
        console.log(`     - Vertices: ${meshInfo.vertices.toLocaleString()}`)
        console.log(`     - Faces: ${meshInfo.faces.toLocaleString()}`)
        console.log(`     - Has skinning: ${meshInfo.hasSkinning}`)
        console.log(`     - Morph targets: ${meshInfo.morphTargets}`)
      }
    })

    return meshes
  }

  analyzeAnimations(animations) {
    console.log('\n🎬 ANALYZING ANIMATIONS...')
    
    if (animations.length === 0) {
      console.log('  📊 No animations found in GLB file')
      return { total: 0, animations: [] }
    }

    const animationData = animations.map(animation => {
      console.log(`  🎬 Animation: ${animation.name}`)
      console.log(`     - Duration: ${animation.duration.toFixed(2)}s`)
      console.log(`     - Tracks: ${animation.tracks.length}`)
      
      return {
        name: animation.name,
        duration: animation.duration,
        tracks: animation.tracks.map(track => ({
          name: track.name,
          type: track.constructor.name,
          times: track.times.length,
          values: track.values.length
        }))
      }
    })

    console.log(`  📊 Total animations: ${animations.length}`)
    return { total: animations.length, animations: animationData }
  }

  analyzeMaterials(scene) {
    console.log('\n🎨 ANALYZING MATERIALS...')
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

    const materialData = Array.from(materials).map((material, index) => {
      console.log(`  🎨 Material ${index + 1}: ${material.name || 'Unnamed'}`)
      console.log(`     - Type: ${material.constructor.name}`)
      
      return {
        name: material.name || `Material_${index + 1}`,
        type: material.constructor.name,
        hasMap: !!material.map,
        transparent: material.transparent
      }
    })

    console.log(`  📊 Total materials: ${materials.size}`)
    return materialData
  }

  printAnalysisReport(analysis) {
    console.log('\n' + '='.repeat(80))
    console.log('📋 SAVANNAH AVATAR GLB ANALYSIS REPORT')
    console.log('='.repeat(80))

    // Summary
    console.log('\n📊 SUMMARY:')
    console.log(`• Total Morph Targets: ${analysis.morphTargets.total}`)
    console.log(`• Total Bones: ${analysis.bones.total}`)
    console.log(`• Facial Bones: ${analysis.bones.facialBones.length}`)
    console.log(`• Total Meshes: ${analysis.meshes.length}`)
    console.log(`• Total Animations: ${analysis.animations.total}`)

    // Facial Animation Capability Assessment
    console.log('\n🎭 FACIAL ANIMATION CAPABILITIES:')
    const hasMorphTargets = analysis.morphTargets.total > 0
    const hasFacialBones = analysis.bones.facialBones.length > 0
    
    console.log(`• Morph Target Support: ${hasMorphTargets ? '✅ YES' : '❌ NO'}`)
    console.log(`• Bone-based Facial Animation: ${hasFacialBones ? '✅ YES' : '❌ NO'}`)
    console.log(`• Facial Animation Ready: ${hasMorphTargets || hasFacialBones ? '✅ YES' : '❌ NO'}`)

    if (hasMorphTargets) {
      console.log('\n🎯 MORPH TARGET DETAILS:')
      analysis.morphTargets.meshes.forEach(mesh => {
        console.log(`• ${mesh.meshName}: ${mesh.targets.length} targets`)
        mesh.targets.forEach(target => {
          console.log(`  - ${target.name} (${target.vertexCount} vertices)`)
        })
      })

      // Check for common facial animation patterns
      console.log('\n🔍 FACIAL ANIMATION PATTERN ANALYSIS:')
      const allTargetNames = analysis.morphTargets.meshes
        .flatMap(mesh => mesh.targets.map(t => t.name.toLowerCase()))

      const patterns = {
        visemes: allTargetNames.filter(name => 
          name.includes('viseme') || name.match(/^[aeiou]$/) || name.includes('mouth')
        ),
        emotions: allTargetNames.filter(name => 
          name.includes('smile') || name.includes('sad') || name.includes('angry') || 
          name.includes('happy') || name.includes('surprised')
        ),
        eyes: allTargetNames.filter(name => 
          name.includes('eye') || name.includes('blink') || name.includes('wink')
        ),
        arkit: allTargetNames.filter(name => 
          name.includes('browdown') || name.includes('browup') || name.includes('cheekpuff') ||
          name.includes('jawopen') || name.includes('mouthfunnel')
        )
      }

      Object.entries(patterns).forEach(([category, matches]) => {
        if (matches.length > 0) {
          console.log(`• ${category.toUpperCase()}: ${matches.length} targets found`)
          matches.slice(0, 5).forEach(name => console.log(`  - ${name}`))
          if (matches.length > 5) console.log(`  - ... and ${matches.length - 5} more`)
        } else {
          console.log(`• ${category.toUpperCase()}: ❌ No targets found`)
        }
      })
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    if (hasMorphTargets) {
      console.log('✅ This avatar is EXCELLENT for facial animations!')
      console.log('✅ Use morph targets for precise lip sync and expressions')
      console.log('✅ Compatible with viseme-based TTS systems')
    } else if (hasFacialBones) {
      console.log('⚠️  This avatar has bone-based facial animation')
      console.log('⚠️  May require bone animation instead of morph targets')
    } else {
      console.log('❌ This avatar has LIMITED facial animation support')
      console.log('❌ Consider using a different avatar with morph targets')
    }

    console.log('\n' + '='.repeat(80))
  }
}

// Run the analysis
async function main() {
  try {
    const analyzer = new SavannahGLBAnalyzer()
    await analyzer.analyzeGLB()
    console.log('\n✅ Analysis completed successfully!')
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message)
    process.exit(1)
  }
}

main()