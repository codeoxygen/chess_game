'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, GameMode, Difficulty, Position, Move, ChessPiece, PieceColor, MoveData } from './types/chess';
import { ChessEngine } from './components/ChessEngine';
import MainMenu from './components/MainMenu';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import './globals.css';

const chessEngine = ChessEngine.getInstance();

const GAME_SESSION_UUID = 'chess-game-session-' + Math.random().toString(36).substr(2, 9);
const PLAYER_UUID = 'player-' + Math.random().toString(36).substr(2, 9);

export default function ChessGame() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    board: chessEngine.initializeBoard(),
    currentPlayer: 'white',
    gameStatus: 'waiting',
    selectedSquare: null,
    validMoves: [],
    moveHistory: [],
    isCheck: false,
    winner: null,
    gameMode: 'single',
    difficulty: 'medium',
    gameSessionUuid: GAME_SESSION_UUID,
    playerUuid: PLAYER_UUID,
    playerColor: 'white',
    currentTurn: PLAYER_UUID,
    isMyTurn: true
  });
  const [showMenu, setShowMenu] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Initialize socket connection for multiplayer
  useEffect(() => {
    if (gameState.gameMode === 'multiplayer') {
      const newSocket = io({
        path: '/api/socket',
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        newSocket.emit('join-game', {
          gameSessionUuid: GAME_SESSION_UUID,
          playerUuid: PLAYER_UUID
        });
      });

      newSocket.on('move-made', (data: MoveData) => {
        if (data.playerUuid !== PLAYER_UUID) {
          setGameState(prev => ({
            ...prev,
            board: data.gameBoard,
            currentPlayer: data.currentTurn === PLAYER_UUID ? prev.playerColor! : (prev.playerColor === 'white' ? 'black' : 'white'),
            currentTurn: data.currentTurn,
            isMyTurn: data.currentTurn === PLAYER_UUID,
            gameStatus: data.gameStatus,
            isCheck: data.isCheck,
            winner: data.winner,
            selectedSquare: null,
            validMoves: []
          }));
        }
      });

      newSocket.on('game-ended', (data: { winner: string }) => {
        setGameState(prev => ({
          ...prev,
          gameStatus: 'checkmate',
          winner: data.winner === PLAYER_UUID ? prev.playerColor! : (prev.playerColor === 'white' ? 'black' : 'white')
        }));
      });

      newSocket.on('player-joined', (data: { playerUuid: string }) => {
        console.log('Player joined:', data.playerUuid);
        if (data.playerUuid !== PLAYER_UUID) {
          setGameState(prev => ({
            ...prev,
            gameStatus: 'playing'
          }));
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [gameState.gameMode]);

  // AI move logic
  useEffect(() => {
    if (gameState.gameMode === 'single' && 
        gameState.currentPlayer === 'black' && 
        gameState.gameStatus === 'playing' && 
        !isAiThinking) {
      
      setIsAiThinking(true);
      
      setTimeout(() => {
        const aiMove = chessEngine.getBestMove(gameState.board, 'black', gameState.difficulty!);
        if (aiMove) {
          makeMove(aiMove);
        }
        setIsAiThinking(false);
      }, 500); // Add delay for better UX
    }
  }, [gameState.currentPlayer, gameState.gameStatus, gameState.gameMode, isAiThinking]);

  const startGame = (mode: GameMode, difficulty?: Difficulty) => {
    const newBoard = chessEngine.initializeBoard();
    const playerColor: PieceColor = mode === 'multiplayer' ? 'white' : 'white';
    
    setGameState({
      board: newBoard,
      currentPlayer: 'white',
      gameStatus: mode === 'multiplayer' ? 'waiting' : 'playing',
      selectedSquare: null,
      validMoves: [],
      moveHistory: [],
      isCheck: false,
      winner: null,
      gameMode: mode,
      difficulty: difficulty || 'medium',
      gameSessionUuid: GAME_SESSION_UUID,
      playerUuid: PLAYER_UUID,
      playerColor,
      currentTurn: PLAYER_UUID,
      isMyTurn: true
    });
    setShowMenu(false);
  };

  const makeMove = useCallback(async (move: Move) => {
    const newBoard = chessEngine.makeMove(gameState.board, move);
    const opponentColor: PieceColor = gameState.currentPlayer === 'white' ? 'black' : 'white';
    const isCheck = chessEngine.isInCheck(newBoard, opponentColor);
    const isCheckmate = chessEngine.isCheckmate(newBoard, opponentColor);
    const isStalemate = chessEngine.isStalemate(newBoard, opponentColor);
    
    let newGameStatus = gameState.gameStatus;
    let winner = null;
    
    if (isCheckmate) {
      newGameStatus = 'checkmate';
      winner = gameState.currentPlayer;
    } else if (isStalemate) {
      newGameStatus = 'stalemate';
    }
    
    const newMoveHistory = [...gameState.moveHistory, move];
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: opponentColor,
      gameStatus: newGameStatus,
      selectedSquare: null,
      validMoves: [],
      moveHistory: newMoveHistory,
      isCheck,
      winner,
      isMyTurn: gameState.gameMode === 'single' ? true : !prev.isMyTurn
    }));

    // Handle multiplayer move
    if (gameState.gameMode === 'multiplayer' && socket) {
      try {
        const response = await fetch('/api/game-move', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameSessionUuid: GAME_SESSION_UUID,
            playerUuid: PLAYER_UUID,
            move
          }),
        });

        const result = await response.json();
        
        if (result.status) {
          socket.emit('make-move', {
            gameSessionUuid: GAME_SESSION_UUID,
            playerUuid: PLAYER_UUID,
            move,
            gameBoard: result.payload.gameBoard,
            currentTurn: result.payload.currentTurn,
            gameStatus: result.payload.gameStatus,
            isCheck: result.payload.isCheck,
            winner: result.payload.winner
          });

          if (result.payload.winner) {
            socket.emit('game-won', {
              gameSessionUuid: GAME_SESSION_UUID,
              winner: result.payload.winner
            });
            
            // Send winner to external API
            await fetch('/api/send-winner', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                gameSessionUuid: GAME_SESSION_UUID,
                winner: result.payload.winner
              }),
            });
          }
        }
      } catch (error) {
        console.error('Error making multiplayer move:', error);
      }
    }
  }, [gameState, socket]);

  const handleSquareClick = (position: Position) => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.gameMode === 'multiplayer' && !gameState.isMyTurn) return;
    if (gameState.gameMode === 'single' && gameState.currentPlayer === 'black') return;

    const piece = gameState.board[position.row][position.col];
    
    // If clicking on a valid move square
    if (gameState.selectedSquare && 
        gameState.validMoves.some(move => move.row === position.row && move.col === position.col)) {
      
      const move: Move = {
        from: gameState.selectedSquare,
        to: position,
        piece: gameState.board[gameState.selectedSquare.row][gameState.selectedSquare.col]!,
        capturedPiece: piece || undefined
      };
      
      makeMove(move);
      return;
    }
    
    // If clicking on own piece
    if (piece && piece.color === gameState.currentPlayer) {
      const validMoves = chessEngine.getPieceValidMoves(gameState.board, position)
        .map(move => move.to);
      
      setGameState(prev => ({
        ...prev,
        selectedSquare: position,
        validMoves
      }));
    } else {
      // Deselect
      setGameState(prev => ({
        ...prev,
        selectedSquare: null,
        validMoves: []
      }));
    }
  };

  const handleNewGame = () => {
    if (gameState.gameMode === 'multiplayer' && socket) {
      socket.disconnect();
    }
    startGame(gameState.gameMode, gameState.difficulty);
  };

  const handleBackToMenu = () => {
    if (gameState.gameMode === 'multiplayer' && socket) {
      socket.disconnect();
    }
    setShowMenu(true);
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setGameState(prev => ({
      ...prev,
      difficulty
    }));
  };

  if (showMenu) {
    return <MainMenu onStartGame={startGame} />;
  }

  return (
    <div className="chess-game">
      <div className="game-container">
        <div className="game-board-section">
          <ChessBoard
            gameState={gameState}
            onSquareClick={handleSquareClick}
            onMove={makeMove}
          />
          {isAiThinking && (
            <div className="ai-thinking">
              <div className="thinking-indicator">
                <div className="spinner"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="game-info-section">
          <GameInfo
            gameState={gameState}
            onNewGame={handleNewGame}
            onBackToMenu={handleBackToMenu}
            onDifficultyChange={gameState.gameMode === 'single' ? handleDifficultyChange : undefined}
          />
        </div>
      </div>
    </div>
  );
}