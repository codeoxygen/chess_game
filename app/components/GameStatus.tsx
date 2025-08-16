"use client"

import { PieceColor } from '@/app/types/chess'

interface GameStatusProps {
  currentTurn: PieceColor
  gameStatus: string
  winner: string | null
  isMyTurn: boolean
  playerColor: PieceColor
  isCheck: boolean
}

export function GameStatus({ 
  currentTurn, 
  gameStatus, 
  winner, 
  isMyTurn, 
  playerColor,
  isCheck 
}: GameStatusProps) {
  const getStatusMessage = () => {
    if (gameStatus === 'checkmate') {
      return winner ? `🏆 ${winner === 'white' ? 'White' : 'Black'} Wins!` : '🏆 Game Over'
    }
    
    if (gameStatus === 'stalemate') {
      return '🤝 Stalemate - Draw!'
    }
    
    if (gameStatus === 'draw') {
      return '🤝 Draw!'
    }
    
    if (isCheck) {
      return `⚠️ ${currentTurn === 'white' ? 'White' : 'Black'} King in Check!`
    }
    
    return isMyTurn ? '🎯 Your Turn' : '⏳ Opponent\'s Turn'
  }

  const getStatusColor = () => {
    if (gameStatus === 'checkmate') {
      return winner === playerColor ? 'text-green-600' : 'text-red-600'
    }
    
    if (gameStatus === 'stalemate' || gameStatus === 'draw') {
      return 'text-yellow-600'
    }
    
    if (isCheck) {
      return 'text-red-600'
    }
    
    return isMyTurn ? 'text-blue-600' : 'text-orange-600'
  }

  return (
    <div className="text-center py-4">
      <div className={`text-2xl font-bold mb-2 ${getStatusColor()}`}>
        {getStatusMessage()}
      </div>
      
      {gameStatus === 'active' && (
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
            currentTurn === 'white' 
              ? 'bg-white text-gray-800 shadow-lg transform scale-105' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            <div className="w-3 h-3 bg-white border-2 border-gray-800 rounded-full" />
            <span className="font-semibold">White</span>
          </div>
          
          <div className="text-2xl font-bold text-gray-400">VS</div>
          
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
            currentTurn === 'black' 
              ? 'bg-gray-800 text-white shadow-lg transform scale-105' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            <div className="w-3 h-3 bg-gray-800 rounded-full" />
            <span className="font-semibold">Black</span>
          </div>
        </div>
      )}
    </div>
  )
}