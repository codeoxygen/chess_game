"use client";

import React from 'react';
import { GameMode, AIDifficulty } from '../types';

interface GameControlsProps {
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  onGameModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: AIDifficulty) => void;
  onNewGame: () => void;
  onResetStats: () => void;
  gameOver: boolean;
  disabled?: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  gameMode,
  aiDifficulty,
  onGameModeChange,
  onDifficultyChange,
  onNewGame,
  onResetStats,
  gameOver,
  disabled = false
}) => {
  const difficultyColors = {
    easy: 'from-green-500 to-green-600',
    medium: 'from-yellow-500 to-orange-500',
    hard: 'from-red-500 to-red-600'
  };

  const difficultyIcons = {
    easy: '😊',
    medium: '🤔',
    hard: '😤'
  };

  return (
    <div className="space-y-6">
      {/* Game Mode Selection */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 text-center">🎮 Game Mode</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onGameModeChange('single-player')}
            disabled={disabled}
            className={`p-4 rounded-xl font-semibold transition-all duration-300 border-2 ${
              gameMode === 'single-player'
                ? 'bg-gradient-to-br from-purple-500 to-purple-700 border-purple-400 text-white shadow-lg transform scale-105'
                : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
          >
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm">vs AI</div>
          </button>
          
          <button
            onClick={() => onGameModeChange('multiplayer')}
            disabled={disabled}
            className={`p-4 rounded-xl font-semibold transition-all duration-300 border-2 ${
              gameMode === 'multiplayer'
                ? 'bg-gradient-to-br from-pink-500 to-pink-700 border-pink-400 text-white shadow-lg transform scale-105'
                : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm">Multiplayer</div>
          </button>
        </div>
      </div>

      {/* AI Difficulty Selection */}
      {gameMode === 'single-player' && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 text-center">🎯 AI Difficulty</h3>
          <div className="space-y-3">
            {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => onDifficultyChange(difficulty)}
                disabled={disabled}
                className={`w-full p-3 rounded-xl font-semibold transition-all duration-300 border-2 flex items-center justify-center space-x-3 ${
                  aiDifficulty === difficulty
                    ? `bg-gradient-to-br ${difficultyColors[difficulty]} border-white/50 text-white shadow-lg transform scale-105`
                    : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
              >
                <span className="text-xl">{difficultyIcons[difficulty]}</span>
                <span className="capitalize">{difficulty}</span>
                {aiDifficulty === difficulty && (
                  <span className="text-sm bg-white/20 px-2 py-1 rounded-full">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game Actions */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 text-center">⚡ Actions</h3>
        <div className="space-y-3">
          <button
            onClick={onNewGame}
            className="w-full bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
          >
            <span className="text-xl">🔄</span>
            <span>{gameOver ? 'Play Again' : 'New Game'}</span>
          </button>
          
          <button
            onClick={onResetStats}
            className="w-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
          >
            <span className="text-xl">🗑️</span>
            <span>Reset Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameControls;