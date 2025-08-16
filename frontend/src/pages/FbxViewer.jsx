import { useEffect, useRef, useState } from 'react'

function FbxViewer({ width = 800, height = 400 }) {
  const mountRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let renderer, scene, camera, frameId, controls

    async function init() {
      try {
        const THREE = await import('three')
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
        const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js')
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')

        // Scene setup
        scene = new THREE.Scene()
        scene.background = new THREE.Color(0x2a2a2a) // Lighter background to see model better

        // Camera setup
        camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000) // Narrower FOV
        camera.position.set(0, 0, 5) // Start further back

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.outputColorSpace = THREE.SRGBColorSpace
        
        if (mountRef.current) {
          mountRef.current.appendChild(renderer.domElement)
        }

        // Controls
        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.minDistance = 1
        controls.maxDistance = 20

        // Enhanced lighting setup for better visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 1.2) // Brighter ambient
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5) // Brighter directional
        directionalLight.position.set(5, 10, 5)
        directionalLight.castShadow = true
        directionalLight.shadow.mapSize.width = 2048
        directionalLight.shadow.mapSize.height = 2048
        scene.add(directionalLight)

        // Add additional lights for better visibility
        const frontLight = new THREE.DirectionalLight(0xffffff, 0.8)
        frontLight.position.set(0, 0, 10)
        scene.add(frontLight)

        const backLight = new THREE.DirectionalLight(0xffffff, 0.5)
        backLight.position.set(0, 0, -10)
        scene.add(backLight)

        // Try to load GLB model first (better web compatibility), fallback to FBX
        const gltfLoader = new GLTFLoader()
        gltfLoader.load(
          '/assets/SavannahAvatar.glb',
          (gltf) => {
            const object = gltf.scene
            console.log('GLB object loaded:', object)
            
            // Calculate bounding box BEFORE any transformations
            const box = new THREE.Box3().setFromObject(object)
            const size = box.getSize(new THREE.Vector3())
            const center = box.getCenter(new THREE.Vector3())
            
            console.log('Original model dimensions:', size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3))
            console.log('Original model center:', center.x.toFixed(3), center.y.toFixed(3), center.z.toFixed(3))
            
            // Fix #1: Proper scaling (research shows this is the #1 issue)
            const maxDim = Math.max(size.x, size.y, size.z)
            let targetScale = 3.0 // Larger target size for better visibility
            
            if (maxDim > 0) {
              const scaleFactor = targetScale / maxDim
              object.scale.setScalar(scaleFactor)
              console.log('Applied scale factor:', scaleFactor.toFixed(3))
            }
            
            // Fix #2: Proper centering (move to origin and adjust for ground)
            object.position.copy(center).negate()
            // Adjust Y to place feet on ground (model center is at mid-height)
            object.position.y = -(center.y - size.y/2) * (targetScale / maxDim)
            console.log('Centered at:', object.position.x.toFixed(3), object.position.y.toFixed(3), object.position.z.toFixed(3))
            
            // Fix #3: Material visibility fixes (research-based)
            let meshCount = 0
            object.traverse((child) => {
              if (child.isMesh) {
                meshCount++
                child.castShadow = true
                child.receiveShadow = true
                
                if (child.material) {
                  // Clone to avoid affecting other instances
                  child.material = child.material.clone()
                  
                  // Research shows these fixes work for invisible models:
                  child.material.side = THREE.DoubleSide // Show both sides
                  child.material.transparent = false
                  child.material.opacity = 1.0
                  
                  // Research-based fix: Use wireframe for better visibility
                  if (!child.material.map) {
                    child.material.wireframe = true
                    child.material.color = new THREE.Color(0x00ff00) // Bright green wireframe
                  } else {
                    // If texture exists, ensure it's visible
                    child.material.wireframe = false
                  }
                  
                  child.material.needsUpdate = true
                  console.log(`Fixed material for mesh: ${child.name || 'unnamed'} (${child.material.type})`)
                }
              }
            })
            
            console.log(`Processed ${meshCount} meshes`)
            
            // Fix #4: Camera positioning based on model size
            const distance = targetScale * 1.8 // Closer camera for better visibility
            camera.position.set(distance, distance * 0.8, distance)
            camera.lookAt(0, targetScale * 0.3, 0) // Look slightly up at the model
            controls.target.set(0, targetScale * 0.3, 0)
            controls.update()
            
            console.log('Camera positioned at:', camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2))
            console.log('Looking at:', 0, (targetScale * 0.3).toFixed(2), 0)
            
            scene.add(object)
            setLoading(false)
            console.log('GLB model loaded and positioned successfully')
            
            // Start animation loop for GLB model
            const animate = () => {
              controls.update()
              renderer.render(scene, camera)
              frameId = requestAnimationFrame(animate)
            }
            animate()
          },
          (progress) => {
            console.log('GLB loading progress:', (progress.loaded / progress.total * 100) + '%')
          },
          (error) => {
            console.error('Error loading GLB:', error)
            console.log('Trying FBX fallback...')
            
            // Fallback to FBX if GLB fails
            const fbxLoader = new FBXLoader()
            fbxLoader.load(
              '/assets/SavannahAvatar.fbx',
              (object) => {
                console.log('FBX fallback loaded:', object)
                
                // Apply same processing as GLB
                const box = new THREE.Box3().setFromObject(object)
                const size = box.getSize(new THREE.Vector3())
                const center = box.getCenter(new THREE.Vector3())
                
                console.log('FBX model dimensions:', size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3))
                
                const maxDim = Math.max(size.x, size.y, size.z)
                let targetScale = 3.0
                
                if (maxDim > 0) {
                  const scaleFactor = targetScale / maxDim
                  object.scale.setScalar(scaleFactor)
                  console.log('FBX scale factor:', scaleFactor.toFixed(3))
                }
                
                object.position.copy(center).negate()
                object.position.y = -(center.y - size.y/2) * (targetScale / maxDim)
                
                let meshCount = 0
                object.traverse((child) => {
                  if (child.isMesh) {
                    meshCount++
                    child.castShadow = true
                    child.receiveShadow = true
                    
                    if (child.material) {
                      child.material = child.material.clone()
                      child.material.side = THREE.DoubleSide
                      child.material.transparent = false
                      child.material.opacity = 1.0
                      
                      if (!child.material.map) {
                        child.material.wireframe = true
                        child.material.color = new THREE.Color(0x00ff00)
                      }
                      
                      child.material.needsUpdate = true
                    }
                  }
                })
                
                console.log(`FBX processed ${meshCount} meshes`)
                
                const distance = targetScale * 1.8
                camera.position.set(distance, distance * 0.8, distance)
                camera.lookAt(0, targetScale * 0.3, 0)
                controls.target.set(0, targetScale * 0.3, 0)
                controls.update()
                
                scene.add(object)
                setLoading(false)
                console.log('FBX fallback loaded successfully')
                
                const animate = () => {
                  controls.update()
                  renderer.render(scene, camera)
                  frameId = requestAnimationFrame(animate)
                }
                animate()
              },
              (progress) => {
                console.log('FBX fallback progress:', (progress.loaded / progress.total * 100) + '%')
              },
              (fbxError) => {
                console.error('FBX fallback also failed:', fbxError)
                console.log('Loading placeholder avatar instead...')
                
                // Create a placeholder avatar (simple humanoid shape)
                const group = new THREE.Group()
            
            // Head
            const headGeometry = new THREE.SphereGeometry(0.15, 16, 16)
            const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac })
            const head = new THREE.Mesh(headGeometry, headMaterial)
            head.position.y = 0.6
            head.castShadow = true
            group.add(head)
            
            // Body
            const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 8)
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 })
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
            body.position.y = 0.1
            body.castShadow = true
            group.add(body)
            
            // Arms
            const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8)
            const armMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac })
            
            const leftArm = new THREE.Mesh(armGeometry, armMaterial)
            leftArm.position.set(-0.2, 0.2, 0)
            leftArm.rotation.z = Math.PI / 6
            leftArm.castShadow = true
            group.add(leftArm)
            
            const rightArm = new THREE.Mesh(armGeometry, armMaterial)
            rightArm.position.set(0.2, 0.2, 0)
            rightArm.rotation.z = -Math.PI / 6
            rightArm.castShadow = true
            group.add(rightArm)
            
            // Legs
            const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8)
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 })
            
            const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
            leftLeg.position.set(-0.08, -0.4, 0)
            leftLeg.castShadow = true
            group.add(leftLeg)
            
            const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
            rightLeg.position.set(0.08, -0.4, 0)
            rightLeg.castShadow = true
            group.add(rightLeg)
            
            // Add a simple animation
            let time = 0
            const animatePlaceholder = () => {
              time += 0.01
              group.rotation.y = Math.sin(time) * 0.1
              head.rotation.x = Math.sin(time * 2) * 0.05
              controls.update()
              renderer.render(scene, camera)
              frameId = requestAnimationFrame(animatePlaceholder)
            }
            
                scene.add(group)
                setLoading(false)
                console.log('Placeholder avatar loaded')
                animatePlaceholder()
              }
            )
          }
        )

      } catch (err) {
        console.error('Error initializing 3D viewer:', err)
        setError('Failed to initialize 3D viewer')
        setLoading(false)
      }
    }

    init()

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
      if (renderer && mountRef.current) {
        try {
          mountRef.current.removeChild(renderer.domElement)
        } catch (e) {
          console.warn('Error removing renderer element:', e)
        }
        renderer.dispose()
      }
      if (scene) {
        scene.clear()
      }
    }
  }, [width, height])

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-900 text-red-400 rounded-lg"
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-900 text-white rounded-lg"
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="animate-spin text-2xl mb-2">⚙️</div>
          <div>Loading 3D Avatar...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={mountRef} 
      className="rounded-lg overflow-hidden border border-gray-300"
      style={{ width, height }} 
    />
  )
}

export default FbxViewer
