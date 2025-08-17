import { useState, useCallback } from 'react';
import { GameState, Position, WinningLine } from '../types';

const BOARD_SIZE = 6;
const WIN_LENGTH = 4;

export const useGomokuLogic = () => {
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, draws: 0, totalGames: 0 });

  const initializeBoard = useCallback((): (string | null)[] => {
    return Array(BOARD_SIZE * BOARD_SIZE).fill(null);
  }, []);

  const getPosition = useCallback((index: number): Position => {
    return {
      row: Math.floor(index / BOARD_SIZE),
      col: index % BOARD_SIZE,
      index
    };
  }, []);

  const getIndex = useCallback((row: number, col: number): number => {
    return row * BOARD_SIZE + col;
  }, []);

  const checkWinner = useCallback((board: (string | null)[]): { winner: string | null; winningLine: WinningLine | null } => {
    const directions = [
      { dRow: 0, dCol: 1, type: 'horizontal' as const },
      { dRow: 1, dCol: 0, type: 'vertical' as const },
      { dRow: 1, dCol: 1, type: 'diagonal-right' as const },
      { dRow: 1, dCol: -1, type: 'diagonal-left' as const }
    ];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const currentSymbol = board[getIndex(row, col)];
        if (!currentSymbol) continue;

        for (const { dRow, dCol, type } of directions) {
          const positions: Position[] = [];
          let count = 0;

          for (let i = 0; i < WIN_LENGTH; i++) {
            const newRow = row + i * dRow;
            const newCol = col + i * dCol;
            
            if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
            
            const index = getIndex(newRow, newCol);
            if (board[index] !== currentSymbol) break;
            
            positions.push(getPosition(index));
            count++;
          }

          if (count >= WIN_LENGTH) {
            return {
              winner: currentSymbol,
              winningLine: { positions, direction: type }
            };
          }
        }
      }
    }

    return { winner: null, winningLine: null };
  }, [getIndex, getPosition]);

  const isDraw = useCallback((board: (string | null)[]): boolean => {
    return board.every(cell => cell !== null) && !checkWinner(board).winner;
  }, [checkWinner]);

  const isValidMove = useCallback((board: (string | null)[], position: number): boolean => {
    return position >= 0 && position < BOARD_SIZE * BOARD_SIZE && board[position] === null;
  }, []);

  const makeMove = useCallback((board: (string | null)[], position: number, symbol: string): (string | null)[] => {
    if (!isValidMove(board, position)) return board;
    
    const newBoard = [...board];
    newBoard[position] = symbol;
    return newBoard;
  }, [isValidMove]);

  const getGameState = useCallback((board: (string | null)[]): GameState => {
    const { winner } = checkWinner(board);
    const draw = isDraw(board);
    
    return {
      board,
      currentTurn: '',
      winner,
      gameOver: !!winner || draw,
      isDraw: draw
    };
  }, [checkWinner, isDraw]);

  const updateStats = useCallback((result: 'win' | 'loss' | 'draw') => {
    setGameStats(prev => ({
      ...prev,
      [result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws']: prev[result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws'] + 1,
      totalGames: prev.totalGames + 1
    }));
  }, []);

  const resetStats = useCallback(() => {
    setGameStats({ wins: 0, losses: 0, draws: 0, totalGames: 0 });
  }, []);

  return {
    initializeBoard,
    checkWinner,
    isDraw,
    isValidMove,
    makeMove,
    getGameState,
    getPosition,
    getIndex,
    gameStats,
    updateStats,
    resetStats,
    BOARD_SIZE,
    WIN_LENGTH
  };
};