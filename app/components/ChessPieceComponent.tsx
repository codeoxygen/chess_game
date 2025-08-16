"use client"

import { ChessPiece, Position } from '@/app/types/chess'

interface ChessPieceComponentProps {
  piece: ChessPiece
  position: Position
  isSelected: boolean
}

const PIECE_SYMBOLS = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟'
  }
}

export function ChessPieceComponent({ piece, position, isSelected }: ChessPieceComponentProps) {
  const symbol = PIECE_SYMBOLS[piece.color][piece.type]
  
  return (
    <div 
      className={`
        text-4xl font-bold select-none transition-all duration-200
        ${isSelected ? 'transform scale-110 drop-shadow-lg' : ''}
        ${piece.color === 'white' ? 'text-white drop-shadow-[2px_2px_2px_rgba(0,0,0,0.8)]' : 'text-gray-900 drop-shadow-[1px_1px_1px_rgba(255,255,255,0.3)]'}
        hover:transform hover:scale-105
      `}
      style={{
        filter: piece.color === 'white' 
          ? 'drop-shadow(0 0 3px rgba(255,255,255,0.8))' 
          : 'drop-shadow(0 0 2px rgba(0,0,0,0.5))'
      }}
    >
      {symbol}
    </div>
  )
}