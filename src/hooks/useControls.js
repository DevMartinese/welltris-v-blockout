import { useState, useEffect } from 'react'
import { Vector3 } from 'three'

export function useControls(initialPosition) {
  const [position] = useState(() => new Vector3(...initialPosition))

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          position.x -= 1
          break
        case 'ArrowRight':
          position.x += 1
          break
        case 'ArrowUp':
          position.z -= 1
          break
        case 'ArrowDown':
          position.z += 1
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [position])

  return {
    position,
    moveLeft: () => position.x -= 1,
    moveRight: () => position.x += 1,
    moveForward: () => position.z -= 1,
    moveBack: () => position.z += 1,
  }
}
