import { Canvas } from '@react-three/fiber'
import { KeyboardControls, OrbitControls } from '@react-three/drei'
import { Piece } from './components/Piece'
import { Piece2 } from './components/Piece2'
import './App.css'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <KeyboardControls
        map={[
          { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
          { name: 'right', keys: ['ArrowRight', 'KeyD'] },
          { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
          { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
          { name: 'rotateLeft', keys: ['KeyQ'] },
          { name: 'rotateRight', keys: ['KeyE'] },
          { name: 'fastDrop', keys: ['Space'] }
        ]}
      >
        <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
          <OrbitControls />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <gridHelper args={[9, 9]} />
          {/* Front wall grid */}
          <gridHelper args={[9, 9]} position={[0, 4.5, 4.5]} rotation={[Math.PI/2, 0, 0]} />
          {/* Back wall grid */}
          <gridHelper args={[9, 9]} position={[0, 4.5, -4.5]} rotation={[Math.PI/2, 0, 0]} />
          {/* Left wall grid */}
          <gridHelper args={[9, 9]} position={[-4.5, 4.5, 0]} rotation={[0, 0, Math.PI/2]} />
          {/* Right wall grid */}
          <gridHelper args={[9, 9]} position={[4.5, 4.5, 0]} rotation={[0, 0, Math.PI/2]} />
          <mesh position={[0, 4.5, 0]} scale={[9, 9, 9]} wireframe>
            <boxGeometry />
            <meshStandardMaterial color="white" opacity={0.2} transparent />
          </mesh>
          <Piece2 />
        </Canvas>
      </KeyboardControls>
    </div>
  )
}
