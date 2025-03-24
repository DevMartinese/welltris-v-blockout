import { useState, useCallback } from 'react'
import { Vector3 } from 'three'

// Dimensiones del área de juego
const GAME_WIDTH = 5
const GAME_HEIGHT = 10
const GAME_DEPTH = 5

// Matriz 3D para representar el área de juego
const createEmptyBoard = () => {
  const board = new Array(GAME_HEIGHT)
  for (let y = 0; y < GAME_HEIGHT; y++) {
    board[y] = new Array(GAME_WIDTH)
    for (let x = 0; x < GAME_WIDTH; x++) {
      board[y][x] = new Array(GAME_DEPTH).fill(0)
    }
  }
  return board
}

export function useGame() {
  const [board, setBoard] = useState(createEmptyBoard)
  const [gameOver, setGameOver] = useState(false)

  // Verifica si una posición está dentro de los límites
  const isWithinBounds = useCallback((x, y, z) => {
    return (
      x >= -2 && x <= 2 && // Centrado en el origen
      y >= 0 && y < GAME_HEIGHT &&
      z >= -2 && z <= 2 // Centrado en el origen
    )
  }, [])

  // Verifica si una posición está ocupada
  const isPositionOccupied = useCallback((x, y, z) => {
    // Convertir coordenadas del mundo a índices del tablero
    const boardX = x + 2
    const boardZ = z + 2
    
    if (!isWithinBounds(x, y, z)) return true
    if (y < 0) return true // No permitir posiciones Y negativas
    return board[Math.floor(y)][boardX][boardZ] === 1
  }, [board, isWithinBounds])

  // Verifica si una pieza puede moverse a una nueva posición
  const canPieceMove = useCallback((piece, newPosition) => {
    // Verificar cada bloque de la pieza
    for (const [px, py, pz] of piece) {
      const worldX = Math.round(newPosition.x + px)
      const worldY = Math.floor(newPosition.y + py)
      const worldZ = Math.round(newPosition.z + pz)
      
      if (isPositionOccupied(worldX, worldY, worldZ)) {
        return false
      }
    }
    return true
  }, [isPositionOccupied])

  // Fija una pieza en el tablero
  const lockPiece = useCallback((piece, position) => {
    const newBoard = board.map(row => row.map(col => [...col]))
    
    piece.forEach(([px, py, pz]) => {
      const worldX = Math.round(position.x + px)
      const worldY = Math.floor(position.y + py)
      const worldZ = Math.round(position.z + pz)
      
      // Convertir coordenadas del mundo a índices del tablero
      const boardX = worldX + 2
      const boardZ = worldZ + 2
      
      if (worldY >= 0 && worldY < GAME_HEIGHT && boardX >= 0 && boardX < GAME_WIDTH && boardZ >= 0 && boardZ < GAME_DEPTH) {
        newBoard[worldY][boardX][boardZ] = 1
      }
    })

    setBoard(newBoard)
  }, [board])

  return {
    board,
    gameOver,
    canPieceMove,
    lockPiece,
    GAME_WIDTH,
    GAME_HEIGHT,
    GAME_DEPTH
  }
}
