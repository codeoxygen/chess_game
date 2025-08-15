'use client';

import React from 'react';
import { ChessPiece, Position, GameState, Move } from '../types/chess';
import ChessSquare from './ChessSquare';
import './ChessBoard.css';

interface ChessBoardProps {
  gameState: GameState;
  onSquareClick: (position: Position) => void;
  onMove: (move: Move) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ gameState, onSquareClick, onMove }) => {
  const { board, selectedSquare, validMoves, currentPlayer, gameMode, isMyTurn } = gameState;

  const isSquareSelected = (row: number, col: number): boolean => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  };

  const isValidMove = (row: number, col: number): boolean => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  const isSquareHighlighted = (row: number, col: number): boolean => {
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    if (!lastMove) return false;
    return (lastMove.from.row === row && lastMove.from.col === col) ||
           (lastMove.to.row === row && lastMove.to.col === col);
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameMode === 'multiplayer' && !isMyTurn) return;
    onSquareClick({ row, col });
  };

  const renderBoard = () => {
    const squares = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        const isLight = (row + col) % 2 === 0;
        const isSelected = isSquareSelected(row, col);
        const isValid = isValidMove(row, col);
        const isHighlighted = isSquareHighlighted(row, col);
        
        squares.push(
          <ChessSquare
            key={`${row}-${col}`}
            piece={piece}
            position={{ row, col }}
            isLight={isLight}
            isSelected={isSelected}
            isValidMove={isValid}
            isHighlighted={isHighlighted}
            onClick={() => handleSquareClick(row, col)}
            disabled={gameMode === 'multiplayer' && !isMyTurn}
          />
        );
      }
    }
    return squares;
  };

  return (
    <div className="chess-board-container">
      <div className="chess-board">
        <div className="board-grid">
          {renderBoard()}
        </div>
        <div className="board-coordinates">
          <div className="files">
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
              <span key={file} className="file-label">{file}</span>
            ))}
          </div>
          <div className="ranks">
            {[8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
              <span key={rank} className="rank-label">{rank}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;