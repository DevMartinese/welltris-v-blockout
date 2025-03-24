import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

// Definición de piezas con sus colores
const PIECES = {
  L: {
    shape: [
      [0, 0, 0],
      [0, -1, 0],
      [0, -2, 0],
      [1, -2, 0],
    ],
    color: '#00BCD4'
  },
  I: {
    shape: [
      [0, 0, 0],
      [0, -1, 0],
      [0, -2, 0],
      [0, -3, 0],
    ],
    color: '#FF5722'
  },
  O: {
    shape: [
      [0, 0, 0],
      [1, 0, 0],
      [0, -1, 0],
      [1, -1, 0],
    ],
    color: '#FFEB3B'
  },
  T: {
    shape: [
      [0, 0, 0],
      [-1, -1, 0],
      [0, -1, 0],
      [1, -1, 0],
    ],
    color: '#9C27B0'
  }
}

export function Piece() {
  const [lockedPieces, setLockedPieces] = useState([])
  const [currentPiece, setCurrentPiece] = useState(null)
  const groupRef = useRef()
  
  // Hook de controles fuera de useFrame
  const [, getKeys] = useKeyboardControls()

  // Crear una nueva pieza aleatoria
  const createRandomPiece = () => {
    const pieces = Object.entries(PIECES)
    const [type, config] = pieces[Math.floor(Math.random() * pieces.length)]
    return {
      type,
      ...config,
      position: new THREE.Vector3(0, 8, 0),
      rotation: new THREE.Euler(0, 0, 0)
    }
  }

  // Verificar colisiones
  const checkCollision = (position) => {
    const boardSize = 5 // Mitad del tamaño del tablero
    
    if (!currentPiece) return false

    for (const [x, y, z] of currentPiece.shape) {
      const worldPos = new THREE.Vector3(
        position.x + x,
        position.y + y,
        position.z + z
      )
      
      // Verificar límites
      if (worldPos.x < -boardSize || worldPos.x > boardSize ||
          worldPos.y < 0 ||
          worldPos.z < -boardSize || worldPos.z > boardSize) {
        return true
      }
      
      // Verificar colisión con piezas bloqueadas
      for (const locked of lockedPieces) {
        for (const [lx, ly, lz] of locked.shape) {
          const lockedPos = new THREE.Vector3(
            locked.position.x + lx,
            locked.position.y + ly,
            locked.position.z + lz
          )
          if (worldPos.distanceTo(lockedPos) < 0.5) {
            return true
          }
        }
      }
    }
    return false
  }

  // Inicializar la primera pieza
  if (!currentPiece) {
    setCurrentPiece(createRandomPiece())
  }

  useFrame((state, delta) => {
    if (!currentPiece || !groupRef.current) return

    const keys = getKeys()
    const moveSpeed = 5 * delta
    const rotateSpeed = Math.PI * delta

    const newPosition = groupRef.current.position.clone()
    const newRotation = groupRef.current.rotation.clone()

    // Movimiento
    if (keys.left) newPosition.x -= moveSpeed
    if (keys.right) newPosition.x += moveSpeed
    if (keys.forward) newPosition.z -= moveSpeed
    if (keys.backward) newPosition.z += moveSpeed
    
    // Rotación
    if (keys.rotateLeft) newRotation.y += rotateSpeed
    if (keys.rotateRight) newRotation.y -= rotateSpeed

    // Caída constante
    newPosition.y -= delta * 2 // Velocidad base de caída
    if (keys.fastDrop) newPosition.y -= delta * 8 // Caída rápida

    // Verificar colisiones antes de aplicar el movimiento
    if (!checkCollision(newPosition)) {
      groupRef.current.position.copy(newPosition)
      groupRef.current.rotation.copy(newRotation)
    } else if (newPosition.y !== groupRef.current.position.y) {
      // Si hay colisión vertical, bloquear la pieza y crear una nueva
      setLockedPieces(prev => [...prev, {
        ...currentPiece,
        position: groupRef.current.position.clone(),
        rotation: groupRef.current.rotation.clone()
      }])
      
      setCurrentPiece(createRandomPiece())
    }
  })

  return (
    <>
      {/* Renderizar piezas bloqueadas */}
      {lockedPieces.map((piece, index) => (
        <group key={index} position={piece.position} rotation={piece.rotation}>
          {piece.shape.map((coords, blockIndex) => (
            <mesh key={blockIndex} position={coords}>
              <boxGeometry args={[0.9, 0.9, 0.9]} />
              <meshStandardMaterial color={piece.color} />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Renderizar pieza actual */}
      {currentPiece && (
        <group 
          ref={groupRef}
          position={currentPiece.position}
          rotation={currentPiece.rotation}
        >
          {currentPiece.shape.map((coords, index) => (
            <mesh key={index} position={coords}>
              <boxGeometry args={[0.9, 0.9, 0.9]} />
              <meshStandardMaterial color={currentPiece.color} />
            </mesh>
          ))}
        </group>
      )}
    </>
  )
}
