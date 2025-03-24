import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { Vector3 } from 'three'

// Definición básica de una pieza en L
const PIECE_L = [
  [0, 0, 0],
  [0, -1, 0],
  [0, -2, 0],
  [1, -2, 0],
]

export function Piece({ onLock, gameLogic }) {
  const position = useRef(new Vector3(0, 8, 0))
  const [locked, setLocked] = useState(false)
  
  // Referencias para el tiempo
  const lastDrop = useRef(0)
  const lastMove = useRef(0)
  const dropInterval = useRef(1000) // 1 segundo entre caídas
  const moveInterval = 100 // 100ms entre movimientos
  
  // Velocidad de movimiento
  const moveAmount = 1 // Mover una unidad completa

  // Obtener el estado de los controles
  const [subscribeKeys, getKeys] = useKeyboardControls()

  useFrame((state) => {
    if (locked) return

    const now = state.clock.getElapsedTime() * 1000
    const keys = getKeys()
    let moved = false

    // Manejar movimientos horizontales cada 100ms
    if (now - lastMove.current >= moveInterval) {
      const newPos = position.current.clone()

      if (keys.left) {
        newPos.x = Math.max(-2, position.current.x - moveAmount)
        moved = true
      } else if (keys.right) {
        newPos.x = Math.min(2, position.current.x + moveAmount)
        moved = true
      } else if (keys.forward) {
        newPos.z = Math.max(-2, position.current.z - moveAmount)
        moved = true
      } else if (keys.backward) {
        newPos.z = Math.min(2, position.current.z + moveAmount)
        moved = true
      }

      if (moved && gameLogic.canPieceMove(PIECE_L, newPos)) {
        position.current.copy(newPos)
        lastMove.current = now
      }
    }

    // Manejar caída
    const timeSinceLastDrop = now - lastDrop.current
    dropInterval.current = keys.fastDrop ? 100 : 1000 // 100ms para caída rápida

    if (timeSinceLastDrop >= dropInterval.current) {
      const newPos = position.current.clone()
      newPos.y -= 1

      if (gameLogic.canPieceMove(PIECE_L, newPos)) {
        position.current.copy(newPos)
      } else {
        // Si no puede moverse hacia abajo, fijar la pieza
        const finalPos = position.current.clone()
        finalPos.x = Math.round(finalPos.x)
        finalPos.y = Math.floor(finalPos.y)
        finalPos.z = Math.round(finalPos.z)
        
        gameLogic.lockPiece(PIECE_L, finalPos)
        setLocked(true)
        if (onLock) onLock()
      }
      
      lastDrop.current = now
    }
  })

  if (locked) return null

  // Renderizar cada cubo que forma la pieza
  return (
    <group position={position.current}>
      {PIECE_L.map((coords, index) => (
        <mesh key={index} position={[coords[0], coords[1], coords[2]]}>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial color="cyan" />
        </mesh>
      ))}
    </group>
  )
}
