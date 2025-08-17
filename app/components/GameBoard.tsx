"use client";

import React from 'react';
import { Position, WinningLine } from '../types';

interface GameBoardProps {
  board: (string | null)[];
  onCellClick: (index: number) => void;
  disabled: boolean;
  winningLine?: WinningLine | null;
  currentPlayerSymbol?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  board, 
  onCellClick, 
  disabled, 
  winningLine,
  currentPlayerSymbol 
}) => {
  const BOARD_SIZE = 6;

  const isWinningCell = (index: number): boolean => {
    return winningLine?.positions.some(pos => pos.index === index) || false;
  };

  const getCellContent = (symbol: string | null): string => {
    if (symbol === 'X') return '●';
    if (symbol === 'O') return '○';
    return '';
  };

  const getCellStyles = (index: number, symbol: string | null) => {
    const isWinning = isWinningCell(index);
    const isEmpty = symbol === null;
    
    let baseClasses = "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl border-2 transition-all duration-300 flex items-center justify-center text-2xl sm:text-3xl font-bold relative overflow-hidden ";
    
    if (isWinning) {
      baseClasses += "bg-gradient-to-br from-yellow-200 to-yellow-400 border-yellow-500 animate-pulse shadow-lg ";
    } else if (symbol === 'X') {
      baseClasses += "bg-gradient-to-br from-purple-500 to-purple-700 border-purple-600 text-white shadow-lg ";
    } else if (symbol === 'O') {
      baseClasses += "bg-gradient-to-br from-pink-500 to-pink-700 border-pink-600 text-white shadow-lg ";
    } else {
      baseClasses += "bg-gradient-to-br from-white/20 to-white/10 border-white/30 backdrop-blur-sm hover:bg-white/30 hover:border-white/50 hover:shadow-lg ";
      
      if (!disabled) {
        baseClasses += "cursor-pointer hover:scale-105 ";
      } else {
        baseClasses += "cursor-not-allowed opacity-50 ";
      }
    }
    
    return baseClasses;
  };

  return (
    <div className="flex justify-center items-center p-4">
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20">
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          {board.map((symbol, index) => (
            <button
              key={index}
              className={getCellStyles(index, symbol)}
              onClick={() => !disabled && symbol === null && onCellClick(index)}
              disabled={disabled || symbol !== null}
            >
              <span className="relative z-10">
                {getCellContent(symbol)}
              </span>
              
              {/* Hover effect for empty cells */}
              {symbol === null && !disabled && (
                <div className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-200">
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {getCellContent(currentPlayerSymbol || 'X')}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Winning cell glow effect */}
              {isWinningCell(index) && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/50 to-yellow-500/50 rounded-xl animate-pulse" />
              )}
            </button>
          ))}
        </div>
        
        {/* Board coordinates (optional) */}
        <div className="flex justify-between mt-2 px-2 text-xs text-white/60">
          {Array.from({ length: BOARD_SIZE }, (_, i) => (
            <span key={i} className="w-12 sm:w-14 md:w-16 text-center">
              {String.fromCharCode(65 + i)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;