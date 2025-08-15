'use client';

import React from 'react';
import { ChessPiece, Position } from '../types/chess';
import './ChessPiece.css';

interface ChessPieceProps {
  piece: ChessPiece;
  position: Position;
  isSelected?: boolean;
}

const ChessPieceComponent: React.FC<ChessPieceProps> = ({ piece, position, isSelected }) => {
  const getPieceSymbol = (): string => {
    const symbols = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    };
    
    return symbols[piece.color][piece.type];
  };

  const getPieceClasses = (): string => {
    const classes = ['chess-piece', piece.color, piece.type];
    if (isSelected) classes.push('selected');
    return classes.join(' ');
  };

  return (
    <div className={getPieceClasses()}>
      <span className="piece-symbol">
        {getPieceSymbol()}
      </span>
    </div>
  );
};

export default ChessPieceComponent;