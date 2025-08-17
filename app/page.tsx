"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import GameBoard from './components/GameBoard';
import PlayerInfo from './components/PlayerInfo';
import GameControls from './components/GameControls';
import GameStats from './components/GameStats';
import GameStatus from './components/GameStatus';
import { useGomokuLogic } from './hooks/useGomokuLogic';
import { useGomokuAI } from './hooks/useGomokuAI';
import { Player, GameMode, AIDifficulty, Room, WinningLine } from './types';

function GomokuGameContent() {
  const searchParams = useSearchParams();
  const socketRef = useRef<Socket | null>(null);
  
  // Game state
  const [board, setBoard] = useState<(string | null)[]>(Array(36).fill(null));
  const [currentTurn, setCurrentTurn] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  
  // Game settings
  const [gameMode, setGameMode] = useState<GameMode>('single-player');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  
  // Multiplayer state
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  
  // Players
  const [players, setPlayers] = useState<Player[]>([]);
  
  // Hooks
  const { 
    initializeBoard, 
    checkWinner, 
    isValidMove, 
    makeMove, 
    gameStats, 
    updateStats, 
    resetStats 
  } = useGomokuLogic();
  
  const { makeAIMove, isThinking } = useGomokuAI();
  
  // URL parameters for multiplayer
  const gameSessionUuid = searchParams?.get('gameSessionUuid');
  const playerUuid = searchParams?.get('uuid');
  
  // Initialize multiplayer if URL params exist
  useEffect(() => {
    if (gameSessionUuid && playerUuid) {
      setGameMode('multiplayer');
      setLoading(true);
      initializeMultiplayerGame();
    } else {
      initializeSinglePlayerGame();
    }
  }, [gameSessionUuid, playerUuid]);
  
  // WebSocket connection for multiplayer
  useEffect(() => {
    if (gameMode === 'multiplayer' && gameSessionUuid && playerUuid) {
      const socket = io({
        path: '/api/socket',
      });
      socketRef.current = socket;
      
      socket.on('connect', () => {
        setConnectionStatus('Connected');
        socket.emit('join-game', { gameSessionUuid, playerUuid });
      });
      
      socket.on('player-joined', ({ playerUuid: joinedPlayerUuid }) => {
        console.log(`Player joined: ${joinedPlayerUuid}`);
        if (!opponent) {
          initializeMultiplayerGame();
        }
      });
      
      socket.on('move-made', ({ playerUuid: movePlayer, position, gameBoard, currentTurn }) => {
        setBoard(gameBoard);
        setCurrentTurn(currentTurn);
        const { winner: gameWinner, winningLine } = checkWinner(gameBoard);
        if (gameWinner) {
          setWinner(gameWinner);
          setWinningLine(winningLine);
          setGameOver(true);
        } else if (gameBoard.every((square: string | null) => square !== null)) {
          setGameOver(true);
        }
      });
      
      socket.on('game-ended', ({ winner }) => {
        setWinner(winner);
        setGameOver(true);
      });
      
      socket.on('disconnect', () => {
        setConnectionStatus('Disconnected');
      });
      
      socket.on('connect_error', () => {
        setConnectionStatus('Connection Error');
      });
      
      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [gameMode, gameSessionUuid, playerUuid]);
  
  const initializeSinglePlayerGame = useCallback(() => {
    const newBoard = initializeBoard();
    const humanPlayer: Player = {
      uuid: 'human-player',
      name: 'You',
      symbol: 'X',
      isAI: false
    };
    
    const aiPlayer: Player = {
      uuid: 'ai-player',
      name: `AI (${aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)})`,
      symbol: 'O',
      isAI: true
    };
    
    setBoard(newBoard);
    setPlayers([humanPlayer, aiPlayer]);
    setCurrentTurn(humanPlayer.uuid);
    setWinner(null);
    setWinningLine(null);
    setGameOver(false);
    setLoading(false);
  }, [initializeBoard, aiDifficulty]);
  
  const initializeMultiplayerGame = async () => {
    if (!gameSessionUuid) return;
    
    try {
      const response = await fetch(`/api/get-room?gameSessionUuid=${gameSessionUuid}`);
      const data = await response.json();
      
      if (data.status && data.payload) {
        setRoom(data.payload);
        setBoard(data.payload.gameBoard || Array(36).fill(null));
        setCurrentTurn(data.payload.currentTurn);
        setWinner(data.payload.winner);
        
        const current = data.payload.players.find((p: Player) => p.uuid === playerUuid);
        const opp = data.payload.players.find((p: Player) => p.uuid !== playerUuid);
        
        setCurrentPlayer(current || null);
        setOpponent(opp || null);
        setPlayers(data.payload.players || []);
        
        if (data.payload.winner || data.payload.gameBoard?.every((square: string | null) => square !== null)) {
          setGameOver(true);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching room data:', error);
      setLoading(false);
      setConnectionStatus('Connection Error');
    }
  };
  
  const handleCellClick = async (index: number) => {
    if (gameOver || !isValidMove(board, index)) return;
    
    if (gameMode === 'single-player') {
      // Single player vs AI
      if (currentTurn !== 'human-player' || isThinking) return;
      
      const newBoard = makeMove(board, index, 'X');
      setBoard(newBoard);
      
      const { winner: gameWinner, winningLine } = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        setWinningLine(winningLine);
        setGameOver(true);
        updateStats(gameWinner === 'X' ? 'win' : 'loss');
        return;
      }
      
      if (newBoard.every(cell => cell !== null)) {
        setGameOver(true);
        updateStats('draw');
        return;
      }
      
      setCurrentTurn('ai-player');
      
      // AI move
      setTimeout(async () => {
        const aiMove = await makeAIMove(newBoard, aiDifficulty, 'O', 'X');
        const aiBoard = makeMove(newBoard, aiMove, 'O');
        setBoard(aiBoard);
        
        const { winner: aiWinner, winningLine: aiWinningLine } = checkWinner(aiBoard);
        if (aiWinner) {
          setWinner(aiWinner);
          setWinningLine(aiWinningLine);
          setGameOver(true);
          updateStats(aiWinner === 'X' ? 'win' : 'loss');
        } else if (aiBoard.every(cell => cell !== null)) {
          setGameOver(true);
          updateStats('draw');
        } else {
          setCurrentTurn('human-player');
        }
      }, 100);
      
    } else {
      // Multiplayer
      if (currentTurn !== playerUuid || !socketRef.current?.connected || !room) return;
      
      const symbol = room.players[0].uuid === playerUuid ? 'X' : 'O';
      const newBoard = makeMove(board, index, symbol);
      const newCurrentTurn = opponent?.uuid || '';
      
      setBoard(newBoard);
      setCurrentTurn(newCurrentTurn);
      
      socketRef.current?.emit('make-move', {
        gameSessionUuid,
        playerUuid,
        position: index,
        gameBoard: newBoard,
        currentTurn: newCurrentTurn,
      });
      
      const { winner: gameWinner } = checkWinner(newBoard);
      if (gameWinner) {
        const winnerPlayer = gameWinner === 'X' ? room.players[0] : room.players[1];
        setWinner(gameWinner);
        setGameOver(true);
        
        sendWinnerData(winnerPlayer.uuid);
        socketRef.current?.emit('game-won', { gameSessionUuid, winner: gameWinner });
      } else if (newBoard.every((square: string | null) => square !== null)) {
        setGameOver(true);
        socketRef.current?.emit('game-won', { gameSessionUuid, winner: null });
      }
    }
  };
  
  const sendWinnerData = async (winnerUuid: string) => {
    try {
      const response = await fetch('/api/send-winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameSessionUuid,
          winner: winnerUuid,
        }),
      });
      
      const result = await response.json();
      console.log('Winner data sent:', result);
    } catch (error) {
      console.error('Error sending winner data:', error);
    }
  };
  
  const handleNewGame = () => {
    if (gameMode === 'single-player') {
      initializeSinglePlayerGame();
    } else {
      window.location.reload();
    }
  };
  
  const handleGameModeChange = (mode: GameMode) => {
    if (mode !== gameMode) {
      setGameMode(mode);
      if (mode === 'single-player') {
        initializeSinglePlayerGame();
      }
    }
  };
  
  const handleDifficultyChange = (difficulty: AIDifficulty) => {
    setAiDifficulty(difficulty);
    if (gameMode === 'single-player') {
      initializeSinglePlayerGame();
    }
  };
  
  const isDraw = gameOver && !winner;
  const isMyTurn = gameMode === 'multiplayer' ? currentTurn === playerUuid : currentTurn === 'human-player';
  const currentPlayerSymbol = gameMode === 'single-player' 
    ? (currentTurn === 'human-player' ? 'X' : 'O')
    : (currentPlayer?.symbol || 'X');
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="text-6xl mb-4 animate-spin">🎮</div>
          <div className="text-2xl font-bold text-white mb-2">Loading Gomoku...</div>
          <div className="text-white/80">{connectionStatus}</div>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (gameMode === 'multiplayer' && (!room || !currentPlayer || !opponent)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl font-bold text-red-300 mb-2">Game Error</div>
          <div className="text-white/80">Could not load multiplayer game data</div>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            🎯 Gomoku
          </h1>
          <p className="text-white/80 text-lg">
            {gameMode === 'single-player' ? 'Connect 4 in a row to win!' : 'Multiplayer Battle'}
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Controls & Stats */}
            <div className="lg:col-span-1 space-y-6">
              {gameMode === 'single-player' && (
                <>
                  <GameControls
                    gameMode={gameMode}
                    aiDifficulty={aiDifficulty}
                    onGameModeChange={handleGameModeChange}
                    onDifficultyChange={handleDifficultyChange}
                    onNewGame={handleNewGame}
                    onResetStats={resetStats}
                    gameOver={gameOver}
                    disabled={isThinking}
                  />
                  <GameStats stats={gameStats} gameMode={gameMode} />
                </>
              )}
              
              {gameMode === 'multiplayer' && (
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4 text-center">🌐 Multiplayer</h3>
                  <div className="space-y-3 text-center">
                    <div className="text-white/80 text-sm">
                      Room: {gameSessionUuid?.slice(-8)}
                    </div>
                    <button
                      onClick={handleNewGame}
                      className="w-full bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      🔄 Refresh Game
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Center - Game Area */}
            <div className="lg:col-span-2">
              <GameStatus
                gameOver={gameOver}
                winner={winner}
                isDraw={isDraw}
                currentTurn={currentTurn}
                players={players}
                isThinking={isThinking}
                connectionStatus={gameMode === 'multiplayer' ? connectionStatus : undefined}
              />
              
              <PlayerInfo
                players={players}
                currentTurn={currentTurn}
                gameOver={gameOver}
                winner={winner}
                isThinking={isThinking}
              />
              
              <GameBoard
                board={board}
                onCellClick={handleCellClick}
                disabled={gameOver || (gameMode === 'single-player' ? currentTurn !== 'human-player' || isThinking : !isMyTurn)}
                winningLine={winningLine}
                currentPlayerSymbol={currentPlayerSymbol}
              />
              
              {gameOver && (
                <div className="text-center mt-8">
                  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl inline-block">
                    <div className="text-2xl font-bold text-white mb-4">
                      {winner ? (
                        <span className="text-green-300">
                          🎉 {players.find(p => p.symbol === winner)?.name} Wins!
                        </span>
                      ) : (
                        <span className="text-yellow-300">🤝 It&apos;s a Draw!</span>
                      )}
                    </div>
                    <button
                      onClick={handleNewGame}
                      className="bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      🔄 Play Again
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Sidebar - Additional Info */}
            <div className="lg:col-span-1">
              {gameMode === 'single-player' && (
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4 text-center">🎯 How to Play</h3>
                  <div className="space-y-3 text-white/80 text-sm">
                    <div className="flex items-start space-x-2">
                      <span className="text-purple-300">●</span>
                      <span>Connect 4 pieces in a row</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-pink-300">○</span>
                      <span>Horizontal, vertical, or diagonal</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-300">🎯</span>
                      <span>Block your opponent</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-300">🏆</span>
                      <span>First to connect 4 wins!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GomokuGame() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="text-6xl mb-4 animate-spin">🎮</div>
          <div className="text-2xl font-bold text-white mb-2">Loading Gomoku...</div>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <GomokuGameContent />
    </Suspense>
  );
}