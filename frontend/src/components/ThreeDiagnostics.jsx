import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

function GeometryChecker() {
  const meshRef = useRef()

  useEffect(() => {
    const position = meshRef.current?.geometry?.attributes?.position?.array
    if (position) {
      for (let i = 0; i < position.length; i++) {
        if (Number.isNaN(position[i])) {
          console.warn(`NaN found in geometry position at index ${i}`)
        }
      }
    }
  }, [])

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

function RenderInfoLogger() {
  useFrame(({ gl }) => {
    const { calls, triangles } = gl.info.render
    console.log(`Draw calls: ${calls}, Triangles: ${triangles}`)
  })
  return null
}

export default function ThreeDiagnostics() {
  return (
    <Canvas className="three-canvas" gl={{ logarithmicDepthBuffer: true }}>
      <RenderInfoLogger />
      <ambientLight />
      <GeometryChecker />
    </Canvas>
  )
}
