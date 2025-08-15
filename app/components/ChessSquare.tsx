'use client';

import React from 'react';
import { ChessPiece, Position } from '../types/chess';
import ChessPieceComponent from './ChessPiece';
import './ChessSquare.css';

interface ChessSquareProps {
  piece: ChessPiece | null;
  position: Position;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ChessSquare: React.FC<ChessSquareProps> = ({
  piece,
  position,
  isLight,
  isSelected,
  isValidMove,
  isHighlighted,
  onClick,
  disabled = false
}) => {
  const getSquareClasses = (): string => {
    const classes = ['chess-square'];
    
    if (isLight) classes.push('light');
    else classes.push('dark');
    
    if (isSelected) classes.push('selected');
    if (isValidMove) classes.push('valid-move');
    if (isHighlighted) classes.push('highlighted');
    if (disabled) classes.push('disabled');
    
    return classes.join(' ');
  };

  return (
    <div 
      className={getSquareClasses()}
      onClick={disabled ? undefined : onClick}
      data-position={`${position.row}-${position.col}`}
    >
      {piece && (
        <ChessPieceComponent 
          piece={piece} 
          position={position}
          isSelected={isSelected}
        />
      )}
      {isValidMove && !piece && (
        <div className="move-indicator" />
      )}
      {isValidMove && piece && (
        <div className="capture-indicator" />
      )}
    </div>
  );
};

export default ChessSquare;