import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

// Definición de piezas con sus colores (las mismas que en Piece.jsx)
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

// Enumeración para las paredes
const WALLS = {
  FRONT: 'FRONT',
  RIGHT: 'RIGHT',
  BACK: 'BACK',
  LEFT: 'LEFT'
}

export function Piece2() {
  const [lockedPieces, setLockedPieces] = useState([])
  const [currentPiece, setCurrentPiece] = useState(null)
  const [currentWall, setCurrentWall] = useState(WALLS.FRONT)
  const groupRef = useRef()
  const isCollidingRef = useRef(false)
  
  const [, getKeys] = useKeyboardControls()

  // Crear una nueva pieza aleatoria
  const createRandomPiece = () => {
    const pieces = Object.entries(PIECES)
    const [type, config] = pieces[Math.floor(Math.random() * pieces.length)]
    
    // La posición inicial dependerá de la pared actual
    let position, rotation
    switch(currentWall) {
      case WALLS.FRONT:
        position = new THREE.Vector3(0, 8, 4.5)
        rotation = new THREE.Euler(0, 0, 0)
        break
      case WALLS.RIGHT:
        position = new THREE.Vector3(4.5, 8, 0)
        rotation = new THREE.Euler(0, -Math.PI/2, 0)
        break
      case WALLS.BACK:
        position = new THREE.Vector3(0, 8, -4.5)
        rotation = new THREE.Euler(0, Math.PI, 0)
        break
      case WALLS.LEFT:
        position = new THREE.Vector3(-4.5, 8, 0)
        rotation = new THREE.Euler(0, Math.PI/2, 0)
        break
    }

    return {
      type,
      ...config,
      position,
      rotation,
      wall: currentWall
    }
  }

  // Verificar colisiones
  const checkCollision = (position) => {
    if (!currentPiece) return false

    const boardSize = 4.5
    const matrix = new THREE.Matrix4()
    matrix.makeRotationFromEuler(groupRef.current.rotation)

    for (const [x, y, z] of currentPiece.shape) {
      const rotatedPoint = new THREE.Vector3(x, y, z)
      rotatedPoint.applyMatrix4(matrix)

      const worldPos = new THREE.Vector3(
        position.x + rotatedPoint.x,
        position.y + rotatedPoint.y,
        position.z + rotatedPoint.z
      )
      
      const halfSize = 0.5
      
      // Ajustar límites según la pared actual
      switch(currentWall) {
        case WALLS.FRONT:
          if (worldPos.x < -boardSize || worldPos.x > boardSize ||
              worldPos.y < 0 ||
              Math.abs(worldPos.z - boardSize) > 0.1) return true
          break
        case WALLS.RIGHT:
          if (Math.abs(worldPos.x - boardSize) > 0.1 ||
              worldPos.y < 0 ||
              worldPos.z < -boardSize || worldPos.z > boardSize) return true
          break
        case WALLS.BACK:
          if (worldPos.x < -boardSize || worldPos.x > boardSize ||
              worldPos.y < 0 ||
              Math.abs(worldPos.z + boardSize) > 0.1) return true
          break
        case WALLS.LEFT:
          if (Math.abs(worldPos.x + boardSize) > 0.1 ||
              worldPos.y < 0 ||
              worldPos.z < -boardSize || worldPos.z > boardSize) return true
          break
      }

      // Verificar colisión con piezas bloqueadas
      for (const locked of lockedPieces) {
        const lockedMatrix = new THREE.Matrix4()
        lockedMatrix.makeRotationFromEuler(locked.rotation)

        for (const [lx, ly, lz] of locked.shape) {
          const rotatedLockedPoint = new THREE.Vector3(lx, ly, lz)
          rotatedLockedPoint.applyMatrix4(lockedMatrix)

          const lockedPos = new THREE.Vector3(
            locked.position.x + rotatedLockedPoint.x,
            locked.position.y + rotatedLockedPoint.y,
            locked.position.z + rotatedLockedPoint.z
          )

          if (Math.abs(worldPos.x - lockedPos.x) < 0.95 &&
              Math.abs(worldPos.y - lockedPos.y) < 0.95 &&
              Math.abs(worldPos.z - lockedPos.z) < 0.95) {
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

    // Movimiento lateral según la pared actual
    switch(currentWall) {
      case WALLS.FRONT:
      case WALLS.BACK:
        if (keys.left) newPosition.x -= moveSpeed
        if (keys.right) newPosition.x += moveSpeed
        break
      case WALLS.RIGHT:
      case WALLS.LEFT:
        if (keys.left) newPosition.z += moveSpeed
        if (keys.right) newPosition.z -= moveSpeed
        break
    }
    
    // Rotación solo en el plano de la pared
    if (keys.rotateLeft) {
      const currentRotation = newRotation.y % (Math.PI * 2)
      newRotation.y = currentRotation + rotateSpeed
    }
    if (keys.rotateRight) {
      const currentRotation = newRotation.y % (Math.PI * 2)
      newRotation.y = currentRotation - rotateSpeed
    }

    // Deslizamiento constante hacia abajo
    newPosition.y -= delta * 2
    if (keys.fastDrop) newPosition.y -= delta * 8

    // Verificar colisiones antes de aplicar el movimiento
    if (!checkCollision(newPosition)) {
      groupRef.current.position.copy(newPosition)
      groupRef.current.rotation.copy(newRotation)
    } else {
      if (newPosition.y !== groupRef.current.position.y && !isCollidingRef.current) {
        isCollidingRef.current = true;
        // Bloquear la pieza y crear una nueva
        setLockedPieces(prev => [...prev, {
          ...currentPiece,
          position: groupRef.current.position.clone(),
          rotation: groupRef.current.rotation.clone()
        }])
        
        // Cambiar a la siguiente pared en sentido horario
        setCurrentWall(prevWall => {
          switch(prevWall) {
            case WALLS.FRONT: return WALLS.RIGHT
            case WALLS.RIGHT: return WALLS.BACK
            case WALLS.BACK: return WALLS.LEFT
            case WALLS.LEFT: return WALLS.FRONT
            default: return WALLS.FRONT
          }
        })
        
        // Usar setTimeout para asegurar que la nueva pieza se cree después de que los estados se actualicen
        setTimeout(() => {
          setCurrentPiece(createRandomPiece())
          isCollidingRef.current = false
        }, 0)
      } else {
        // Si la colisión es lateral, mantener la posición anterior
        switch(currentWall) {
          case WALLS.FRONT:
          case WALLS.BACK:
            newPosition.x = groupRef.current.position.x
            break
          case WALLS.RIGHT:
          case WALLS.LEFT:
            newPosition.z = groupRef.current.position.z
            break
        }
        groupRef.current.position.copy(newPosition)
        groupRef.current.rotation.copy(newRotation)
      }
    }
  })

  return (
    <>
      {/* Renderizar piezas bloqueadas */}
      {lockedPieces.map((piece, index) => (
        <group key={index} position={piece.position} rotation={piece.rotation}>
          {piece.shape.map((coords, blockIndex) => (
            <mesh key={blockIndex} position={coords}>
              <boxGeometry args={[1, 1, 0.2]} />
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
              <boxGeometry args={[1, 1, 0.2]} />
              <meshStandardMaterial color={currentPiece.color} />
            </mesh>
          ))}
        </group>
      )}
    </>
  )
}
