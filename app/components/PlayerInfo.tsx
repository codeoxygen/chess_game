"use client";

import React from 'react';
import { Player } from '../types';

interface PlayerInfoProps {
  players: Player[];
  currentTurn: string;
  gameOver: boolean;
  winner?: string | null;
  isThinking?: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ 
  players, 
  currentTurn, 
  gameOver, 
  winner,
  isThinking = false 
}) => {
  const getPlayerStatus = (player: Player) => {
    if (gameOver) {
      if (winner === player.symbol) return '🏆 Winner!';
      if (winner === null) return '🤝 Draw';
      return '😔 Lost';
    }
    
    if (currentTurn === player.uuid) {
      if (player.isAI && isThinking) return '🤔 Thinking...';
      if (player.isAI) return '🤖 AI Turn';
      return '🎯 Your Turn';
    }
    
    return '⏳ Waiting';
  };

  const getPlayerBorderColor = (player: Player) => {
    if (gameOver && winner === player.symbol) return 'border-yellow-400 shadow-yellow-400/50';
    if (currentTurn === player.uuid && !gameOver) return player.symbol === 'X' ? 'border-purple-400 shadow-purple-400/50' : 'border-pink-400 shadow-pink-400/50';
    return 'border-white/30';
  };

  const getSymbolDisplay = (symbol: string) => {
    return symbol === 'X' ? '●' : '○';
  };

  return (
    <div className="flex justify-between items-center mb-8 px-4">
      {players.map((player, index) => (
        <div key={player.uuid} className={`flex items-center space-x-4 ${index === 1 ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className="relative">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 transition-all duration-300 overflow-hidden ${getPlayerBorderColor(player)} shadow-lg`}>
              {player.profileImage ? (
                <img
                  src={player.profileImage}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-bold ${
                  player.symbol === 'X' 
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white' 
                    : 'bg-gradient-to-br from-pink-500 to-pink-700 text-white'
                }`}>
                  {player.isAI ? '🤖' : player.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Turn indicator */}
            {currentTurn === player.uuid && !gameOver && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full animate-pulse shadow-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
            )}
            
            {/* Winner crown */}
            {gameOver && winner === player.symbol && (
              <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
                👑
              </div>
            )}
            
            {/* AI thinking indicator */}
            {player.isAI && isThinking && currentTurn === player.uuid && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full animate-spin">
                <div className="w-2 h-2 bg-white rounded-full m-1.5" />
              </div>
            )}
          </div>
          
          <div className={`${index === 1 ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-lg sm:text-xl text-white">
                {player.name}
                {player.isAI && (
                  <span className="ml-2 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full">
                    AI
                  </span>
                )}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-2xl font-bold ${
                player.symbol === 'X' ? 'text-purple-300' : 'text-pink-300'
              }`}>
                {getSymbolDisplay(player.symbol)}
              </span>
              <span className={`text-sm font-medium ${
                player.symbol === 'X' ? 'text-purple-200' : 'text-pink-200'
              }`}>
                Player {player.symbol}
              </span>
            </div>
            
            <div className="mt-2">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                gameOver && winner === player.symbol
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
                  : currentTurn === player.uuid && !gameOver
                  ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
                  : 'bg-white/20 text-white/80'
              }`}>
                {getPlayerStatus(player)}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {/* VS indicator */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center border border-white/30 shadow-lg">
          <span className="text-white font-bold text-lg">VS</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;