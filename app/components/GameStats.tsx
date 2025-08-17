"use client";

import React from 'react';
import { GameStats as GameStatsType } from '../types';

interface GameStatsProps {
  stats: GameStatsType;
  gameMode: 'single-player' | 'multiplayer';
}

const GameStats: React.FC<GameStatsProps> = ({ stats, gameMode }) => {
  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
  
  const getWinRateColor = (rate: number) => {
    if (rate >= 70) return 'from-green-400 to-green-600';
    if (rate >= 50) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getWinRateEmoji = (rate: number) => {
    if (rate >= 80) return '🏆';
    if (rate >= 60) return '🥈';
    if (rate >= 40) return '🥉';
    return '📈';
  };

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
      <h3 className="text-lg font-bold text-white mb-4 text-center flex items-center justify-center space-x-2">
        <span>📊</span>
        <span>Statistics</span>
        <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
          {gameMode === 'single-player' ? 'vs AI' : 'Multiplayer'}
        </span>
      </h3>
      
      {stats.totalGames === 0 ? (
        <div className="text-center text-white/60 py-8">
          <div className="text-4xl mb-2">🎮</div>
          <p>No games played yet!</p>
          <p className="text-sm mt-1">Start playing to see your stats</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Win Rate Circle */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#winRateGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(winRate / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="winRateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl">{getWinRateEmoji(winRate)}</span>
                <span className="text-lg font-bold text-white">{winRate}%</span>
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-400/30">
              <div className="text-center">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-2xl font-bold text-green-300">{stats.wins}</div>
                <div className="text-sm text-green-200">Wins</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-400/30">
              <div className="text-center">
                <div className="text-2xl mb-1">💔</div>
                <div className="text-2xl font-bold text-red-300">{stats.losses}</div>
                <div className="text-sm text-red-200">Losses</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-400/30">
              <div className="text-center">
                <div className="text-2xl mb-1">🤝</div>
                <div className="text-2xl font-bold text-yellow-300">{stats.draws}</div>
                <div className="text-sm text-yellow-200">Draws</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-400/30">
              <div className="text-center">
                <div className="text-2xl mb-1">🎮</div>
                <div className="text-2xl font-bold text-blue-300">{stats.totalGames}</div>
                <div className="text-sm text-blue-200">Total</div>
              </div>
            </div>
          </div>
          
          {/* Performance Badges */}
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-semibold text-white/80 text-center">Performance</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {winRate >= 80 && (
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 text-xs px-3 py-1 rounded-full font-semibold">
                  🏆 Champion
                </span>
              )}
              {winRate >= 60 && winRate < 80 && (
                <span className="bg-gradient-to-r from-green-400 to-green-600 text-green-900 text-xs px-3 py-1 rounded-full font-semibold">
                  🥈 Expert
                </span>
              )}
              {stats.totalGames >= 10 && (
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 text-blue-900 text-xs px-3 py-1 rounded-full font-semibold">
                  🎯 Veteran
                </span>
              )}
              {stats.wins >= 5 && (
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 text-purple-900 text-xs px-3 py-1 rounded-full font-semibold">
                  ⭐ Winner
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStats;