import { useRef, useState, useEffect } from 'react'
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
  const [gameState, setGameState] = useState({
    lockedPieces: [],
    currentPiece: null,
    currentWall: WALLS.FRONT,
    isLocked: false,
    bendAngle: 0, // Ángulo de doblado de la pieza
    bendAxis: new THREE.Vector3(1, 0, 0) // Eje de doblado
  })
  const groupRef = useRef()
  
  const [, getKeys] = useKeyboardControls()

  // Crear una nueva pieza aleatoria
  const createRandomPiece = (wall) => {
    const pieces = Object.entries(PIECES)
    const [type, config] = pieces[Math.floor(Math.random() * pieces.length)]
    
    // La posición inicial dependerá de la pared actual
    let position, rotation
    switch(wall) {
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
      wall
    }
  }

  // Verificar colisiones
  const checkCollision = (position) => {
    if (!gameState.currentPiece) return false

    const boardSize = 4.5
    const matrix = new THREE.Matrix4()
    matrix.makeRotationFromEuler(groupRef.current.rotation)

    for (const [x, y, z] of gameState.currentPiece.shape) {
      const rotatedPoint = new THREE.Vector3(x, y, z)
      rotatedPoint.applyMatrix4(matrix)

      const worldPos = new THREE.Vector3(
        position.x + rotatedPoint.x,
        position.y + rotatedPoint.y,
        position.z + rotatedPoint.z
      )
      
      const halfSize = 0.5
      
      // Ajustar límites según la pared actual
      switch(gameState.currentWall) {
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
      for (const locked of gameState.lockedPieces) {
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
  useEffect(() => {
    if (!gameState.currentPiece && !gameState.isLocked) {
      setGameState(prev => ({
        ...prev,
        currentPiece: createRandomPiece(prev.currentWall)
      }))
    }
  }, [gameState.currentPiece, gameState.isLocked])

  // Calcular el ángulo de doblado y transformación basado en la posición
  const calculateBendTransform = (position, wall) => {
    const threshold = 2.5 // Distancia desde la esquina donde comienza el doblado
    const maxBend = Math.PI / 2 // 90 grados en radianes
    let bendAxis = new THREE.Vector3(1, 0, 0) // Eje de rotación por defecto (X)
    
    // Calcular qué tan cerca está del suelo
    const heightRatio = Math.max(0, Math.min(1, position.y / threshold))
    const bendAmount = (1 - heightRatio) * maxBend
    
    // Ajustar el eje de rotación según la pared
    switch(wall) {
      case WALLS.FRONT:
        bendAxis.set(1, 0, 0)
        break
      case WALLS.RIGHT:
        bendAxis.set(0, 0, 1)
        break
      case WALLS.BACK:
        bendAxis.set(-1, 0, 0)
        break
      case WALLS.LEFT:
        bendAxis.set(0, 0, -1)
        break
    }
    
    return {
      angle: bendAmount,
      axis: bendAxis
    }
  }

  useFrame((state, delta) => {
    if (!gameState.currentPiece || !groupRef.current || gameState.isLocked) return

    const keys = getKeys()
    const moveSpeed = 5 * delta
    const rotateSpeed = Math.PI * delta

    const newPosition = groupRef.current.position.clone()
    const newRotation = groupRef.current.rotation.clone()

    // Movimiento lateral según la pared actual
    switch(gameState.currentWall) {
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
      
      // Actualizar la transformación de doblado
      const bendTransform = calculateBendTransform(newPosition, gameState.currentWall)
      setGameState(prev => ({ 
        ...prev, 
        bendAngle: bendTransform.angle,
        bendAxis: bendTransform.axis
      }))
    } else {
      if (newPosition.y !== groupRef.current.position.y) {
        // Marcar como bloqueado para prevenir más actualizaciones
        setGameState(prev => ({
          ...prev,
          isLocked: true,
          lockedPieces: [
            ...prev.lockedPieces,
            {
              ...prev.currentPiece,
              position: groupRef.current.position.clone(),
              rotation: groupRef.current.rotation.clone()
            }
          ],
          currentPiece: null,
          currentWall: (() => {
            switch(prev.currentWall) {
              case WALLS.FRONT: return WALLS.RIGHT
              case WALLS.RIGHT: return WALLS.BACK
              case WALLS.BACK: return WALLS.LEFT
              case WALLS.LEFT: return WALLS.FRONT
              default: return WALLS.FRONT
            }
          })()
        }))

        // Desbloquear después de un delay para permitir la siguiente pieza
        setTimeout(() => {
          setGameState(prev => ({ ...prev, isLocked: false }))
        }, 300)
      } else {
        // Si la colisión es lateral, mantener la posición anterior
        switch(gameState.currentWall) {
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
      {gameState.lockedPieces.map((piece, index) => (
        <group key={index} position={piece.position} rotation={piece.rotation}>
          {piece.shape.map((coords, blockIndex) => (
            <mesh key={blockIndex} position={coords}>
              <boxGeometry args={[1, 1, 0.01]} />
              <meshStandardMaterial color={piece.color} />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Renderizar pieza actual */}
      {gameState.currentPiece && (
        <group 
          ref={groupRef}
          position={gameState.currentPiece.position}
          rotation={gameState.currentPiece.rotation}
        >
          {gameState.currentPiece.shape.map((coords, index) => {
            // Crear una matriz de rotación para el doblado
            const bendMatrix = new THREE.Matrix4()
            if (gameState.bendAxis) {
              bendMatrix.makeRotationAxis(
                gameState.bendAxis,
                gameState.bendAngle * Math.abs(coords[1]) / 2
              )
            }
            
            // Aplicar la transformación a la posición
            const position = new THREE.Vector3(coords[0], coords[1], coords[2])
            position.applyMatrix4(bendMatrix)
            
            return (
              <mesh key={index} position={position}>
                <boxGeometry args={[1, 1, 0.01]} />
                <meshStandardMaterial color={gameState.currentPiece.color} />
              </mesh>
            )
          })}
        </group>
      )}
    </>
  )
}
