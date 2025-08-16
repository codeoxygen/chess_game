"use client"

import { Position } from '@/app/types/chess'
import { ReactNode } from 'react'

interface ChessSquareProps {
  position: Position
  isLight: boolean
  isSelected: boolean
  isValidMove: boolean
  isLastMove: boolean
  onClick: () => void
  disabled: boolean
  children?: ReactNode
}

export function ChessSquare({
  position,
  isLight,
  isSelected,
  isValidMove,
  isLastMove,
  onClick,
  disabled,
  children
}: ChessSquareProps) {
  const getSquareClasses = () => {
    let classes = 'w-12 h-12 flex items-center justify-center relative transition-all duration-200 '
    
    // Base square color
    if (isLight) {
      classes += 'bg-gradient-to-br from-amber-50 to-amber-100 '
    } else {
      classes += 'bg-gradient-to-br from-amber-600 to-amber-700 '
    }
    
    // Selected state
    if (isSelected) {
      classes += 'ring-4 ring-blue-400 ring-opacity-80 shadow-lg transform scale-105 '
    }
    
    // Last move highlight
    if (isLastMove) {
      classes += 'bg-gradient-to-br from-yellow-200 to-yellow-300 '
    }
    
    // Hover effect
    if (!disabled) {
      classes += 'hover:shadow-md cursor-pointer '
    } else {
      classes += 'cursor-not-allowed opacity-75 '
    }
    
    return classes
  }

  return (
    <div
      className={getSquareClasses()}
      onClick={!disabled ? onClick : undefined}
    >
      {children}
      
      {/* Valid move indicator */}
      {isValidMove && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {children ? (
            <div className="w-10 h-10 border-4 border-red-500 rounded-full animate-pulse" />
          ) : (
            <div className="w-6 h-6 bg-green-500 rounded-full shadow-lg animate-pulse" />
          )}
        </div>
      )}
    </div>
  )
}