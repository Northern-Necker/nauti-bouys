#!/usr/bin/env node

/**
 * Node.js Compatible GLB Analysis Script
 * Uses buffer parsing to analyze GLB structure directly
 */

import fs from 'fs'

const GLB_PATH = './public/assets/SavannahAvatar.glb'

class GLBBufferAnalyzer {
  constructor() {
    this.buffer = null
    this.json = null
  }

  async analyzeGLB() {
    console.log('🔍 Analyzing SavannahAvatar.glb...')
    console.log('📁 File path:', GLB_PATH)
    
    if (!fs.existsSync(GLB_PATH)) {
      throw new Error(`GLB file not found: ${GLB_PATH}`)
    }

    const stats = fs.statSync(GLB_PATH)
    console.log('📊 File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB')
    
    try {
      this.buffer = fs.readFileSync(GLB_PATH)
      this.json = this.parseGLBJSON()
      
      const analysis = {
        primitives: this.analyzePrimitives(),
        accessories: this.analyzeAccessors(),
        nodes: this.analyzeNodes(),
        meshes: this.analyzeMeshes(),
        animations: this.analyzeAnimations(),
        materials: this.analyzeMaterials()
      }

      this.printAnalysisReport(analysis)
      return analysis
    } catch (error) {
      console.error('❌ Error analyzing GLB:', error)
      throw error
    }
  }

  parseGLBJSON() {
    // GLB format: 12-byte header + JSON chunk + optional BIN chunk
    const magic = this.buffer.readUInt32LE(0)
    if (magic !== 0x46546C67) { // "glTF" in little endian
      throw new Error('Invalid GLB file: incorrect magic number')
    }

    const version = this.buffer.readUInt32LE(4)
    const length = this.buffer.readUInt32LE(8)
    
    console.log(`📋 GLB Info:`)
    console.log(`   - Version: ${version}`)
    console.log(`   - File length: ${length} bytes`)

    // First chunk (JSON)
    const jsonChunkLength = this.buffer.readUInt32LE(12)
    const jsonChunkType = this.buffer.readUInt32LE(16)
    
    if (jsonChunkType !== 0x4E4F534A) { // "JSON" in little endian
      throw new Error('Invalid GLB file: first chunk is not JSON')
    }

    const jsonData = this.buffer.slice(20, 20 + jsonChunkLength).toString('utf8')
    const json = JSON.parse(jsonData)
    
    console.log(`   - JSON chunk: ${jsonChunkLength} bytes`)
    console.log(`   - GLTF version: ${json.asset?.version || 'unknown'}`)
    
    return json
  }

  analyzePrimitives() {
    console.log('\n🔺 ANALYZING PRIMITIVES...')
    let totalPrimitives = 0
    let morphTargetPrimitives = 0
    
    if (this.json.meshes) {
      this.json.meshes.forEach((mesh, meshIndex) => {
        console.log(`  📦 Mesh ${meshIndex}: ${mesh.name || 'Unnamed'}`)
        
        if (mesh.primitives) {
          mesh.primitives.forEach((primitive, primIndex) => {
            totalPrimitives++
            console.log(`     - Primitive ${primIndex}:`)
            
            if (primitive.targets) {
              morphTargetPrimitives++
              console.log(`       🎭 MORPH TARGETS FOUND! Count: ${primitive.targets.length}`)
              
              primitive.targets.forEach((target, targetIndex) => {
                const attributes = Object.keys(target).join(', ')
                console.log(`         [${targetIndex}] Attributes: ${attributes}`)
              })
            }
            
            if (primitive.attributes) {
              const attributes = Object.keys(primitive.attributes)
              console.log(`       - Attributes: ${attributes.join(', ')}`)
            }
          })
        }
      })
    }

    console.log(`  📊 Total primitives: ${totalPrimitives}`)
    console.log(`  🎭 Primitives with morph targets: ${morphTargetPrimitives}`)
    
    return { total: totalPrimitives, withMorphTargets: morphTargetPrimitives }
  }

  analyzeAccessors() {
    console.log('\n📊 ANALYZING ACCESSORS...')
    
    if (!this.json.accessors) {
      console.log('  ❌ No accessors found')
      return { total: 0, morphTargetAccessors: 0 }
    }

    let morphTargetAccessors = 0
    
    this.json.accessors.forEach((accessor, index) => {
      if (accessor.name && accessor.name.toLowerCase().includes('morph')) {
        morphTargetAccessors++
        console.log(`  🎭 Morph target accessor ${index}: ${accessor.name}`)
      }
    })

    console.log(`  📊 Total accessors: ${this.json.accessors.length}`)
    console.log(`  🎭 Morph target related accessors: ${morphTargetAccessors}`)
    
    return { total: this.json.accessors.length, morphTargetAccessors }
  }

  analyzeNodes() {
    console.log('\n🌳 ANALYZING NODES...')
    
    if (!this.json.nodes) {
      console.log('  ❌ No nodes found')
      return { total: 0, bones: 0, facialBones: 0 }
    }

    let boneNodes = 0
    let facialBones = 0
    
    this.json.nodes.forEach((node, index) => {
      if (node.name) {
        const name = node.name.toLowerCase()
        
        // Check for bone patterns
        if (name.includes('bone') || name.includes('joint') || 
            name.includes('spine') || name.includes('head') ||
            name.includes('neck') || name.includes('arm') || 
            name.includes('leg')) {
          boneNodes++
          console.log(`  🦴 Bone node ${index}: ${node.name}`)
          
          // Check for facial bones
          if (name.includes('head') || name.includes('face') || name.includes('jaw') ||
              name.includes('eye') || name.includes('mouth') || name.includes('lip') ||
              name.includes('brow') || name.includes('cheek')) {
            facialBones++
            console.log(`    🎭 Facial bone detected!`)
          }
        }
      }
    })

    console.log(`  📊 Total nodes: ${this.json.nodes.length}`)
    console.log(`  🦴 Bone nodes: ${boneNodes}`)
    console.log(`  🎭 Facial bones: ${facialBones}`)
    
    return { total: this.json.nodes.length, bones: boneNodes, facialBones }
  }

  analyzeMeshes() {
    console.log('\n🔺 ANALYZING MESHES...')
    
    if (!this.json.meshes) {
      console.log('  ❌ No meshes found')
      return { total: 0, withMorphTargets: 0 }
    }

    let meshesWithMorphTargets = 0
    let totalMorphTargets = 0
    
    this.json.meshes.forEach((mesh, index) => {
      console.log(`  📦 Mesh ${index}: ${mesh.name || 'Unnamed'}`)
      
      if (mesh.primitives) {
        mesh.primitives.forEach((primitive) => {
          if (primitive.targets && primitive.targets.length > 0) {
            meshesWithMorphTargets++
            totalMorphTargets += primitive.targets.length
            console.log(`    🎭 ${primitive.targets.length} morph targets found!`)
          }
        })
      }
    })

    console.log(`  📊 Total meshes: ${this.json.meshes.length}`)
    console.log(`  🎭 Meshes with morph targets: ${meshesWithMorphTargets}`)
    console.log(`  🎯 Total morph targets: ${totalMorphTargets}`)
    
    return { 
      total: this.json.meshes.length, 
      withMorphTargets: meshesWithMorphTargets,
      totalMorphTargets 
    }
  }

  analyzeAnimations() {
    console.log('\n🎬 ANALYZING ANIMATIONS...')
    
    if (!this.json.animations) {
      console.log('  📊 No animations found')
      return { total: 0, animations: [] }
    }

    const animations = this.json.animations.map((animation, index) => {
      console.log(`  🎬 Animation ${index}: ${animation.name || 'Unnamed'}`)
      console.log(`     - Channels: ${animation.channels?.length || 0}`)
      console.log(`     - Samplers: ${animation.samplers?.length || 0}`)
      
      return {
        name: animation.name || `Animation_${index}`,
        channels: animation.channels?.length || 0,
        samplers: animation.samplers?.length || 0
      }
    })

    console.log(`  📊 Total animations: ${this.json.animations.length}`)
    return { total: this.json.animations.length, animations }
  }

  analyzeMaterials() {
    console.log('\n🎨 ANALYZING MATERIALS...')
    
    if (!this.json.materials) {
      console.log('  📊 No materials found')
      return { total: 0 }
    }

    this.json.materials.forEach((material, index) => {
      console.log(`  🎨 Material ${index}: ${material.name || 'Unnamed'}`)
    })

    console.log(`  📊 Total materials: ${this.json.materials.length}`)
    return { total: this.json.materials.length }
  }

  printAnalysisReport(analysis) {
    console.log('\n' + '='.repeat(80))
    console.log('📋 SAVANNAH AVATAR GLB ANALYSIS REPORT')
    console.log('='.repeat(80))

    // Summary
    console.log('\n📊 SUMMARY:')
    console.log(`• Total Meshes: ${analysis.meshes.total}`)
    console.log(`• Meshes with Morph Targets: ${analysis.meshes.withMorphTargets}`)
    console.log(`• Total Morph Targets: ${analysis.meshes.totalMorphTargets}`)
    console.log(`• Total Nodes: ${analysis.nodes.total}`)
    console.log(`• Bone Nodes: ${analysis.nodes.bones}`)
    console.log(`• Facial Bones: ${analysis.nodes.facialBones}`)
    console.log(`• Total Animations: ${analysis.animations.total}`)

    // Facial Animation Capability Assessment
    console.log('\n🎭 FACIAL ANIMATION CAPABILITIES:')
    const hasMorphTargets = analysis.meshes.totalMorphTargets > 0
    const hasFacialBones = analysis.nodes.facialBones > 0
    
    console.log(`• Morph Target Support: ${hasMorphTargets ? '✅ YES' : '❌ NO'}`)
    console.log(`• Bone-based Facial Animation: ${hasFacialBones ? '✅ YES' : '❌ NO'}`)
    console.log(`• Facial Animation Ready: ${hasMorphTargets || hasFacialBones ? '✅ YES' : '❌ NO'}`)

    // Three.js Compatibility
    console.log('\n🔧 THREE.JS COMPATIBILITY:')
    console.log(`• GLB Format: ✅ Supported`)
    console.log(`• Morph Targets: ${hasMorphTargets ? '✅ Compatible' : '❌ Not Available'}`)
    console.log(`• Bone Animation: ${analysis.nodes.bones > 0 ? '✅ Compatible' : '❌ No Bones'}`)

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    if (hasMorphTargets) {
      console.log('✅ This avatar is EXCELLENT for facial animations!')
      console.log('✅ Use morph target influences for lip sync')
      console.log('✅ Compatible with viseme-based TTS systems')
      console.log('✅ Can implement precise facial expressions')
    } else if (hasFacialBones) {
      console.log('⚠️  This avatar has bone-based facial animation')
      console.log('⚠️  May require bone animation instead of morph targets')
    } else {
      console.log('❌ This avatar has LIMITED facial animation support')
      console.log('❌ Consider using a different avatar with morph targets')
    }

    console.log('\n' + '='.repeat(80))
    
    // Return capability summary
    return {
      hasMorphTargets,
      hasFacialBones,
      canAnimateFace: hasMorphTargets || hasFacialBones,
      morphTargetCount: analysis.meshes.totalMorphTargets,
      facialBoneCount: analysis.nodes.facialBones
    }
  }
}

// Run the analysis
async function main() {
  try {
    const analyzer = new GLBBufferAnalyzer()
    const result = await analyzer.analyzeGLB()
    console.log('\n✅ Analysis completed successfully!')
    
    // Write results to JSON file for further use
    fs.writeFileSync('./glb-analysis-results.json', JSON.stringify(result, null, 2))
    console.log('📄 Results saved to: glb-analysis-results.json')
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message)
    process.exit(1)
  }
}

main()