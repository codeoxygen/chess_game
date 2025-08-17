import { useState, useCallback } from 'react';
import { AIDifficulty, Position } from '../types';

const BOARD_SIZE = 6;
const WIN_LENGTH = 4;

export const useGomokuAI = () => {
  const [isThinking, setIsThinking] = useState(false);

  const getRandomMove = useCallback((board: (string | null)[]): number => {
    const availableMoves = board
      .map((cell, index) => cell === null ? index : null)
      .filter(index => index !== null) as number[];
    
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }, []);

  const evaluatePosition = useCallback((board: (string | null)[], position: number, symbol: string): number => {
    const row = Math.floor(position / BOARD_SIZE);
    const col = position % BOARD_SIZE;
    let score = 0;

    // Check all four directions
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal right
      [1, -1]   // diagonal left
    ];

    directions.forEach(([dRow, dCol]) => {
      let count = 1;
      let openEnds = 0;

      // Check positive direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
        const newPos = newRow * BOARD_SIZE + newCol;
        if (board[newPos] === symbol) count++;
        else if (board[newPos] === null) { openEnds++; break; }
        else break;
      }

      // Check negative direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const newRow = row - i * dRow;
        const newCol = col - i * dCol;
        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
        const newPos = newRow * BOARD_SIZE + newCol;
        if (board[newPos] === symbol) count++;
        else if (board[newPos] === null) { openEnds++; break; }
        else break;
      }

      // Score based on count and open ends
      if (count >= WIN_LENGTH) score += 1000;
      else if (count === 3 && openEnds >= 1) score += 100;
      else if (count === 2 && openEnds >= 1) score += 10;
      else if (count === 1 && openEnds >= 1) score += 1;
    });

    return score;
  }, []);

  const getBestMove = useCallback((board: (string | null)[], aiSymbol: string, playerSymbol: string): number => {
    const availableMoves = board
      .map((cell, index) => cell === null ? index : null)
      .filter(index => index !== null) as number[];

    let bestMove = availableMoves[0];
    let bestScore = -Infinity;

    availableMoves.forEach(move => {
      const testBoard = [...board];
      testBoard[move] = aiSymbol;

      // Check if this move wins
      const winScore = evaluatePosition(testBoard, move, aiSymbol);
      if (winScore >= 1000) {
        bestMove = move;
        bestScore = Infinity;
        return;
      }

      // Check if we need to block player win
      testBoard[move] = playerSymbol;
      const blockScore = evaluatePosition(testBoard, move, playerSymbol);
      
      let totalScore = winScore - blockScore * 0.9;
      
      // Add positional bonus (center is better)
      const row = Math.floor(move / BOARD_SIZE);
      const col = move % BOARD_SIZE;
      const centerDistance = Math.abs(row - 2.5) + Math.abs(col - 2.5);
      totalScore += (5 - centerDistance) * 2;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = move;
      }
    });

    return bestMove;
  }, [evaluatePosition]);

  const makeAIMove = useCallback(async (board: (string | null)[], difficulty: AIDifficulty, aiSymbol: string, playerSymbol: string): Promise<number> => {
    setIsThinking(true);
    
    // Add thinking delay for better UX
    await new Promise(resolve => setTimeout(resolve, difficulty === 'easy' ? 500 : difficulty === 'medium' ? 1000 : 1500));
    
    let move: number;
    
    switch (difficulty) {
      case 'easy':
        // 70% random, 30% best move
        move = Math.random() < 0.7 ? getRandomMove(board) : getBestMove(board, aiSymbol, playerSymbol);
        break;
      case 'medium':
        // 30% random, 70% best move
        move = Math.random() < 0.3 ? getRandomMove(board) : getBestMove(board, aiSymbol, playerSymbol);
        break;
      case 'hard':
        // Always best move
        move = getBestMove(board, aiSymbol, playerSymbol);
        break;
      default:
        move = getRandomMove(board);
    }
    
    setIsThinking(false);
    return move;
  }, [getRandomMove, getBestMove]);

  return {
    makeAIMove,
    isThinking
  };
};