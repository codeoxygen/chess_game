'use client';

import React from 'react';
import { GameMode, Difficulty } from '../types/chess';
import './MainMenu.css';

interface MainMenuProps {
  onStartGame: (mode: GameMode, difficulty?: Difficulty) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty>('medium');

  return (
    <div className="main-menu">
      <div className="menu-container">
        <div className="menu-header">
          <h1 className="game-title">
            <span className="title-icon">♔</span>
            Chess Master
            <span className="title-icon">♛</span>
          </h1>
          <p className="game-subtitle">Experience the ultimate chess challenge</p>
        </div>

        <div className="menu-content">
          <div className="game-modes">
            <div className="mode-section">
              <h2 className="section-title">Single Player</h2>
              <p className="section-description">Challenge our AI opponents</p>
              
              <div className="difficulty-selection">
                <h3 className="difficulty-title">Select Difficulty:</h3>
                <div className="difficulty-grid">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                    <button
                      key={level}
                      className={`difficulty-card ${selectedDifficulty === level ? 'selected' : ''}`}
                      onClick={() => setSelectedDifficulty(level)}
                    >
                      <div className="difficulty-icon">
                        {level === 'easy' && '🟢'}
                        {level === 'medium' && '🟡'}
                        {level === 'hard' && '🔴'}
                      </div>
                      <span className="difficulty-name">
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                      <div className="difficulty-description">
                        {level === 'easy' && 'Perfect for beginners'}
                        {level === 'medium' && 'Balanced challenge'}
                        {level === 'hard' && 'Expert level AI'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                className="start-btn single-player"
                onClick={() => onStartGame('single', selectedDifficulty)}
              >
                <span className="btn-icon">🤖</span>
                Start Single Player
              </button>
            </div>

            <div className="mode-divider"></div>

            <div className="mode-section">
              <h2 className="section-title">Multiplayer</h2>
              <p className="section-description">Play against friends online</p>
              
              <div className="multiplayer-features">
                <div className="feature-item">
                  <span className="feature-icon">🌐</span>
                  <span>Real-time gameplay</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>Instant moves</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🏆</span>
                  <span>Competitive play</span>
                </div>
              </div>
              
              <button 
                className="start-btn multiplayer"
                onClick={() => onStartGame('multiplayer')}
              >
                <span className="btn-icon">👥</span>
                Start Multiplayer
              </button>
            </div>
          </div>
        </div>

        <div className="menu-footer">
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-value">∞</span>
              <span className="stat-label">Possibilities</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">64</span>
              <span className="stat-label">Squares</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">32</span>
              <span className="stat-label">Pieces</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;