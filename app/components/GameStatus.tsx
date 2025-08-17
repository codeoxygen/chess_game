"use client";

import React from 'react';
import { Player } from '../types';

interface GameStatusProps {
  gameOver: boolean;
  winner: string | null;
  isDraw: boolean;
  currentTurn: string;
  players: Player[];
  isThinking?: boolean;
  connectionStatus?: string;
}

const GameStatus: React.FC<GameStatusProps> = ({
  gameOver,
  winner,
  isDraw,
  currentTurn,
  players,
  isThinking = false,
  connectionStatus
}) => {
  const getCurrentPlayer = () => {
    return players.find(p => p.uuid === currentTurn);
  };

  const getWinnerPlayer = () => {
    return players.find(p => p.symbol === winner);
  };

  const getStatusMessage = () => {
    if (gameOver) {
      if (isDraw) {
        return {
          icon: '🤝',
          message: 'Game Draw!',
          subMessage: 'Well played by both players',
          bgGradient: 'from-yellow-500/20 to-orange-500/20',
          borderColor: 'border-yellow-400/50',
          textColor: 'text-yellow-200'
        };
      }
      
      if (winner) {
        const winnerPlayer = getWinnerPlayer();
        return {
          icon: '🏆',
          message: `${winnerPlayer?.name || 'Player'} Wins!`,
          subMessage: winnerPlayer?.isAI ? 'AI Victory!' : 'Congratulations!',
          bgGradient: 'from-green-500/20 to-emerald-500/20',
          borderColor: 'border-green-400/50',
          textColor: 'text-green-200'
        };
      }
    }
    
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer) {
      if (currentPlayer.isAI && isThinking) {
        return {
          icon: '🤔',
          message: 'AI is thinking...',
          subMessage: 'Please wait for AI move',
          bgGradient: 'from-blue-500/20 to-purple-500/20',
          borderColor: 'border-blue-400/50',
          textColor: 'text-blue-200'
        };
      }
      
      if (currentPlayer.isAI) {
        return {
          icon: '🤖',
          message: 'AI Turn',
          subMessage: `${currentPlayer.name} is making a move`,
          bgGradient: 'from-purple-500/20 to-pink-500/20',
          borderColor: 'border-purple-400/50',
          textColor: 'text-purple-200'
        };
      }
      
      return {
        icon: '🎯',
        message: `${currentPlayer.name}'s Turn`,
        subMessage: `Place your ${currentPlayer.symbol === 'X' ? '●' : '○'}`,
        bgGradient: currentPlayer.symbol === 'X' ? 'from-purple-500/20 to-purple-600/20' : 'from-pink-500/20 to-pink-600/20',
        borderColor: currentPlayer.symbol === 'X' ? 'border-purple-400/50' : 'border-pink-400/50',
        textColor: currentPlayer.symbol === 'X' ? 'text-purple-200' : 'text-pink-200'
      };
    }
    
    return {
      icon: '🎮',
      message: 'Game Ready',
      subMessage: 'Let\'s start playing!',
      bgGradient: 'from-gray-500/20 to-gray-600/20',
      borderColor: 'border-gray-400/50',
      textColor: 'text-gray-200'
    };
  };

  const status = getStatusMessage();

  return (
    <div className="mb-8">
      {/* Connection Status (for multiplayer) */}
      {connectionStatus && (
        <div className="text-center mb-4">
          <div className={`text-sm px-4 py-2 rounded-full inline-block transition-all duration-300 ${
            connectionStatus.includes('Connected')
              ? 'bg-green-500/20 text-green-300 border border-green-400/50'
              : connectionStatus.includes('Error') || connectionStatus.includes('Disconnected')
              ? 'bg-red-500/20 text-red-300 border border-red-400/50'
              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/50'
          }`}>
            <span className="mr-2">
              {connectionStatus.includes('Connected') ? '🟢' : 
               connectionStatus.includes('Error') || connectionStatus.includes('Disconnected') ? '🔴' : '🟡'}
            </span>
            {connectionStatus}
          </div>
        </div>
      )}
      
      {/* Main Game Status */}
      <div className={`bg-gradient-to-br ${status.bgGradient} backdrop-blur-md rounded-2xl p-6 border ${status.borderColor} shadow-xl mx-4 transition-all duration-500`}>
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">{status.icon}</div>
          <h2 className={`text-2xl sm:text-3xl font-bold ${status.textColor} mb-2`}>
            {status.message}
          </h2>
          <p className={`text-sm sm:text-base ${status.textColor} opacity-80`}>
            {status.subMessage}
          </p>
          
          {/* Thinking animation */}
          {isThinking && (
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          
          {/* Turn indicator for active game */}
          {!gameOver && !isThinking && (
            <div className="mt-4">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 border border-white/20`}>
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  getCurrentPlayer()?.symbol === 'X' ? 'bg-purple-400' : 'bg-pink-400'
                }`}></div>
                <span className="text-white text-sm font-medium">
                  {getCurrentPlayer()?.symbol === 'X' ? '● Turn' : '○ Turn'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameStatus;