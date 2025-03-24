import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls, OrbitControls } from '@react-three/drei'
import { Piece } from './components/Piece'
import { useGame } from './hooks/useGame'
import './App.css'

// Definir los controles del teclado
export const Controls = {
  left: 'left',
  right: 'right',
  forward: 'forward',
  backward: 'backward',
  fastDrop: 'fastDrop'
}

function GameContainer() {
  const gameLogic = useGame()
  const [activePiece, setActivePiece] = useState(0)

  const handlePieceLock = useCallback(() => {
    // Incrementar el contador para crear una nueva pieza
    setActivePiece(prev => prev + 1)
  }, [])

  return (
    <>
      {/* Luz ambiental para iluminación general */}
      <ambientLight intensity={0.5} />
      {/* Luz direccional principal */}
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {/* Grid helper para mejor orientación */}
      <gridHelper args={[10, 10]} />
      {/* Contenedor del juego (5x5x10) */}
      <mesh position={[0, 5, 0]} scale={[5, 10, 5]} wireframe>
        <boxGeometry />
        <meshStandardMaterial color="white" opacity={0.2} transparent />
      </mesh>
      {/* Piezas bloqueadas */}
      {gameLogic.board.map((plane, y) =>
        plane.map((row, x) =>
          row.map((cell, z) =>
            cell === 1 && (
              <mesh key={`${x}-${y}-${z}`} position={[x - 2, y, z - 2]}>
                <boxGeometry args={[0.9, 0.9, 0.9]} />
                <meshStandardMaterial color="gray" />
              </mesh>
            )
          )
        )
      )}
      {/* Pieza actual */}
      <Piece key={activePiece} gameLogic={gameLogic} onLock={handlePieceLock} />
    </>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <KeyboardControls
        map={[
          { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
          { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
          { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
          { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
          { name: Controls.fastDrop, keys: ['Space'] }
        ]}
      >
        <Canvas
          camera={{ position: [10, 10, 10], fov: 50 }}
          shadows
        >
          <GameContainer />
          <OrbitControls />
        </Canvas>
      </KeyboardControls>
    </div>
  )
}

export default App
