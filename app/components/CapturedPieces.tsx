"use client"

import { ChessPiece } from '@/app/types/chess'
import { ChessPieceComponent } from './ChessPieceComponent'

interface CapturedPiecesProps {
  capturedPieces: {
    white: ChessPiece[]
    black: ChessPiece[]
  }
  playerColor: 'white' | 'black'
}

const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0
}

export function CapturedPieces({ capturedPieces, playerColor }: CapturedPiecesProps) {
  const calculateMaterialAdvantage = () => {
    const whiteValue = capturedPieces.black.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0)
    const blackValue = capturedPieces.white.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0)
    return whiteValue - blackValue
  }

  const materialAdvantage = calculateMaterialAdvantage()
  const opponentColor = playerColor === 'white' ? 'black' : 'white'

  return (
    <div className="space-y-4">
      {/* Opponent's captured pieces (pieces you captured) */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-green-800">Captured</h3>
          <div className="text-sm text-green-600">
            {capturedPieces[opponentColor].length} pieces
          </div>
        </div>
        <div className="flex flex-wrap gap-1 min-h-[40px]">
          {capturedPieces[opponentColor].map((piece, index) => (
            <div key={index} className="transform scale-75">
              <ChessPieceComponent 
                piece={piece} 
                position={{ row: 0, col: 0 }} 
                isSelected={false} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Your captured pieces (pieces opponent captured) */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-red-800">Lost</h3>
          <div className="text-sm text-red-600">
            {capturedPieces[playerColor].length} pieces
          </div>
        </div>
        <div className="flex flex-wrap gap-1 min-h-[40px]">
          {capturedPieces[playerColor].map((piece, index) => (
            <div key={index} className="transform scale-75 opacity-75">
              <ChessPieceComponent 
                piece={piece} 
                position={{ row: 0, col: 0 }} 
                isSelected={false} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Material advantage indicator */}
      {materialAdvantage !== 0 && (
        <div className={`text-center p-2 rounded-lg font-bold ${
          (materialAdvantage > 0 && playerColor === 'white') || (materialAdvantage < 0 && playerColor === 'black')
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {Math.abs(materialAdvantage) > 0 && (
            <span>
              {(materialAdvantage > 0 && playerColor === 'white') || (materialAdvantage < 0 && playerColor === 'black')
                ? '+' : '-'}
              {Math.abs(materialAdvantage)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}