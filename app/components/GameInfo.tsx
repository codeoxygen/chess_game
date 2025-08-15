'use client';

import React from 'react';
import { GameState, GameMode, Difficulty } from '../types/chess';
import './GameInfo.css';

interface GameInfoProps {
  gameState: GameState;
  onNewGame: () => void;
  onBackToMenu: () => void;
  onDifficultyChange?: (difficulty: Difficulty) => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ 
  gameState, 
  onNewGame, 
  onBackToMenu, 
  onDifficultyChange 
}) => {
  const { currentPlayer, gameStatus, isCheck, winner, gameMode, difficulty, isMyTurn } = gameState;

  const getStatusMessage = (): string => {
    if (gameStatus === 'checkmate') {
      return `Checkmate! ${winner === 'white' ? 'White' : 'Black'} wins!`;
    }
    if (gameStatus === 'stalemate') {
      return 'Stalemate! Game is a draw.';
    }
    if (gameStatus === 'draw') {
      return 'Game ended in a draw.';
    }
    if (isCheck) {
      return `${currentPlayer === 'white' ? 'White' : 'Black'} is in check!`;
    }
    if (gameMode === 'multiplayer') {
      return isMyTurn ? 'Your turn' : 'Opponent\'s turn';
    }
    return `${currentPlayer === 'white' ? 'White' : 'Black'} to move`;
  };

  const getStatusClass = (): string => {
    if (gameStatus === 'checkmate') return 'checkmate';
    if (gameStatus === 'stalemate' || gameStatus === 'draw') return 'draw';
    if (isCheck) return 'check';
    if (gameMode === 'multiplayer' && isMyTurn) return 'my-turn';
    return 'normal';
  };

  return (
    <div className="game-info">
      <div className="game-info-card">
        <div className="status-section">
          <h2 className="game-title">Chess Game</h2>
          <div className={`status-message ${getStatusClass()}`}>
            {getStatusMessage()}
          </div>
          
          {gameMode === 'single' && (
            <div className="current-player">
              <div className={`player-indicator ${currentPlayer}`}>
                <div className="player-dot"></div>
                <span>{currentPlayer === 'white' ? 'White' : 'Black'}</span>
              </div>
            </div>
          )}
        </div>

        {gameMode === 'single' && onDifficultyChange && (
          <div className="difficulty-section">
            <label className="difficulty-label">AI Difficulty:</label>
            <div className="difficulty-buttons">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
                  onClick={() => onDifficultyChange(level)}
                  disabled={gameStatus === 'playing'}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="game-controls">
          <button 
            className="control-btn new-game"
            onClick={onNewGame}
          >
            <span className="btn-icon">🔄</span>
            New Game
          </button>
          
          <button 
            className="control-btn back-menu"
            onClick={onBackToMenu}
          >
            <span className="btn-icon">🏠</span>
            Main Menu
          </button>
        </div>

        {gameMode === 'multiplayer' && (
          <div className="multiplayer-info">
            <div className="connection-status">
              <div className="status-dot connected"></div>
              <span>Connected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameInfo;