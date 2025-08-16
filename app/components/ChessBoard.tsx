"use client"

import { ChessPiece, Position } from '@/app/types/chess'
import { ChessSquare } from './ChessSquare'
import { ChessPieceComponent } from './ChessPieceComponent'

interface ChessBoardProps {
  board: (ChessPiece | null)[][]
  selectedSquare: Position | null
  validMoves: Position[]
  onSquareClick: (position: Position) => void
  isMyTurn: boolean
  playerColor: 'white' | 'black'
  lastMove: { from: Position; to: Position } | null
}

export function ChessBoard({
  board,
  selectedSquare,
  validMoves,
  onSquareClick,
  isMyTurn,
  playerColor,
  lastMove
}: ChessBoardProps) {
  const isSquareSelected = (row: number, col: number) => {
    return selectedSquare?.row === row && selectedSquare?.col === col
  }

  const isValidMove = (row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col)
  }

  const isLastMove = (row: number, col: number): boolean => {
    return !!lastMove && (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    )
  }

  const renderBoard = () => {
    const squares = []
    const startRow = playerColor === 'white' ? 0 : 7
    const endRow = playerColor === 'white' ? 8 : -1
    const rowIncrement = playerColor === 'white' ? 1 : -1

    for (let row = startRow; row !== endRow; row += rowIncrement) {
      const startCol = playerColor === 'white' ? 0 : 7
      const endCol = playerColor === 'white' ? 8 : -1
      const colIncrement = playerColor === 'white' ? 1 : -1

      for (let col = startCol; col !== endCol; col += colIncrement) {
        const piece = board[row][col]
        const isLight = (row + col) % 2 === 0
        const position = { row, col }

        squares.push(
          <ChessSquare
            key={`${row}-${col}`}
            position={position}
            isLight={isLight}
            isSelected={isSquareSelected(row, col)}
            isValidMove={isValidMove(row, col)}
            isLastMove={isLastMove(row, col)}
            onClick={() => onSquareClick(position)}
            disabled={!isMyTurn}
          >
            {piece && (
              <ChessPieceComponent
                piece={piece}
                position={position}
                isSelected={isSquareSelected(row, col)}
              />
            )}
          </ChessSquare>
        )
      }
    }

    return squares
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-8 gap-0 w-96 h-96 border-4 border-amber-800 rounded-lg shadow-2xl bg-gradient-to-br from-amber-100 to-amber-200">
        {renderBoard()}
      </div>
      
      {/* Coordinate labels */}
      <div className="absolute -left-6 top-0 h-full flex flex-col justify-around text-xs font-bold text-amber-800">
        {(playerColor === 'white' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8']).map(num => (
          <div key={num} className="h-12 flex items-center">{num}</div>
        ))}
      </div>
      
      <div className="absolute -bottom-6 left-0 w-full flex justify-around text-xs font-bold text-amber-800">
        {(playerColor === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']).map(letter => (
          <div key={letter} className="w-12 text-center">{letter}</div>
        ))}
      </div>
    </div>
  )
}