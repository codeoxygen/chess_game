"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ChessBoard } from "./components/ChessBoard"
import { GameStatus } from "./components/GameStatus"
import { CapturedPieces } from "./components/CapturedPieces"
import { ChessLogic } from "./components/ChessLogic"
import { GameState, Position, PieceColor, ChessPiece } from "./types/chess"

interface Player {
  uuid: string;
  name: string;
  profileImage: string;
}

interface MoveHistoryItem {
  from: Position;
  to: Position;
  capturedPiece?: ChessPiece;
}

interface CapturedPiecesData {
  white: ChessPiece[];
  black: ChessPiece[];
}

interface Room {
  players: Player[];
  gameBoard: (ChessPiece | null)[][];
  currentTurn: string;
  gameStatus: string;
  winner: string | null;
  moveHistory: MoveHistoryItem[];
  capturedPieces: CapturedPiecesData;
  lastMove: { from: Position; to: Position } | null;
  enPassantTarget: Position | null;
  castlingRights: {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
  };
}

function ChessGameContent() {
  const searchParams = useSearchParams()
  const [gameState, setGameState] = useState<GameState>(ChessLogic.createInitialGameState())
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [opponent, setOpponent] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Connecting...")
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const gameSessionUuid = searchParams.get("gameSessionUuid")
  const playerUuid = searchParams.get("uuid")

  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`/api/get-room?gameSessionUuid=${gameSessionUuid}`)
      const data = await response.json()

      if (data.status && data.payload) {
        const gameData = data.payload
        
        if (gameData.gameBoard) {
          const newGameState: GameState = {
            board: gameData.gameBoard,
            currentTurn: gameData.currentTurn === room?.players[0]?.uuid ? 'white' : 'black',
            gameStatus: gameData.gameStatus || 'active',
            winner: gameData.winner ? (gameData.winner === room?.players[0]?.uuid ? 'white' : 'black') : null,
            moveHistory: gameData.moveHistory || [],
            capturedPieces: gameData.capturedPieces || { white: [], black: [] },
            enPassantTarget: gameData.enPassantTarget || null,
            castlingRights: gameData.castlingRights || {
              whiteKingSide: true,
              whiteQueenSide: true,
              blackKingSide: true,
              blackQueenSide: true
            }
          }
          
          setGameState(newGameState)
          
          if (gameData.lastMove) {
            setLastMove(gameData.lastMove)
          }
        }

        if (gameData.winner || gameData.gameStatus === 'checkmate' || gameData.gameStatus === 'stalemate') {
          setGameOver(true)
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
          }
        }

        setConnectionStatus("Connected")
      }
    } catch (error) {
      console.error("Error fetching game state:", error)
      setConnectionStatus("Connection Error")
    }
  }, [gameSessionUuid, room?.players])

  const startPolling = useCallback(() => {
    pollingRef.current = setInterval(() => {
      if (!gameOver) {
        fetchGameState()
      }
    }, 1000)
  }, [gameOver, fetchGameState])

  const initializeGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/get-room?gameSessionUuid=${gameSessionUuid}`)
      const data = await response.json()

      if (data.status && data.payload) {
        setRoom(data.payload)
        
        const current = data.payload.players.find((p: Player) => p.uuid === playerUuid)
        const opp = data.payload.players.find((p: Player) => p.uuid !== playerUuid)

        setCurrentPlayer(current || null)
        setOpponent(opp || null)

        // Initialize game board if it exists
        if (data.payload.gameBoard) {
          const newGameState: GameState = {
            board: data.payload.gameBoard,
            currentTurn: data.payload.currentTurn === data.payload.players[0]?.uuid ? 'white' : 'black',
            gameStatus: data.payload.gameStatus || 'active',
            winner: data.payload.winner ? (data.payload.winner === data.payload.players[0]?.uuid ? 'white' : 'black') : null,
            moveHistory: data.payload.moveHistory || [],
            capturedPieces: data.payload.capturedPieces || { white: [], black: [] },
            enPassantTarget: data.payload.enPassantTarget || null,
            castlingRights: data.payload.castlingRights || {
              whiteKingSide: true,
              whiteQueenSide: true,
              blackKingSide: true,
              blackQueenSide: true
            }
          }
          setGameState(newGameState)
        } else {
          // Initialize with starting position
          const initialState = ChessLogic.createInitialGameState()
          setGameState(initialState)
        }

        if (data.payload.winner || data.payload.gameStatus === 'checkmate') {
          setGameOver(true)
        } else {
          setConnectionStatus("Connected - Game Active")
        }
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching room data:", error)
      setLoading(false)
    }
  }, [gameSessionUuid, playerUuid])

  useEffect(() => {
    if (gameSessionUuid && playerUuid) {
      initializeGame()
      startPolling()
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [gameSessionUuid, playerUuid, initializeGame, startPolling])

  const handleSquareClick = async (position: Position) => {
    if (gameOver || !isMyTurn()) return

    const piece = ChessLogic.getPieceAt(gameState.board, position)
    
    if (selectedSquare) {
      // Try to make a move
      if (validMoves.some(move => move.row === position.row && move.col === position.col)) {
        await makeMove(selectedSquare, position)
      } else if (piece && piece.color === getPlayerColor()) {
        // Select different piece
        setSelectedSquare(position)
        setValidMoves(ChessLogic.getValidMoves(gameState, position))
      } else {
        // Deselect
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else {
      // Select piece
      if (piece && piece.color === getPlayerColor()) {
        setSelectedSquare(position)
        setValidMoves(ChessLogic.getValidMoves(gameState, position))
      }
    }
  }

  const makeMove = async (from: Position, to: Position) => {
    try {
      const response = await fetch("/api/game-move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameSessionUuid,
          playerUuid,
          from,
          to,
        }),
      })

      const result = await response.json()

      if (result.status) {
        const newGameState: GameState = {
          board: result.payload.gameBoard,
          currentTurn: result.payload.currentTurn === room?.players[0]?.uuid ? 'white' : 'black',
          gameStatus: result.payload.gameStatus || 'active',
          winner: result.payload.winner ? (result.payload.winner === room?.players[0]?.uuid ? 'white' : 'black') : null,
          moveHistory: result.payload.moveHistory || [],
          capturedPieces: result.payload.capturedPieces || { white: [], black: [] },
          enPassantTarget: result.payload.enPassantTarget || null,
          castlingRights: result.payload.castlingRights || gameState.castlingRights
        }

        setGameState(newGameState)
        setSelectedSquare(null)
        setValidMoves([])
        setLastMove({ from, to })

        if (result.payload.gameStatus === 'checkmate' || result.payload.gameStatus === 'stalemate') {
          setGameOver(true)
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
          }
          
          if (result.payload.winner) {
            await sendWinnerData(result.payload.winner)
          }
        }
      }
    } catch (error) {
      console.error("Error making move:", error)
    }
  }

  const sendWinnerData = async (winnerUuid: string) => {
    try {
      const response = await fetch("/api/send-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameSessionUuid,
          winner: winnerUuid,
        }),
      })

      const result = await response.json()
      console.log("Winner data sent:", result)
    } catch (error) {
      console.error("Error sending winner data:", error)
    }
  }

  const isMyTurn = (): boolean => {
    if (!room || !currentPlayer) return false
    const playerColor = getPlayerColor()
    return gameState.currentTurn === playerColor
  }

  const getPlayerColor = (): PieceColor => {
    if (!room || !currentPlayer) return 'white'
    return room.players[0].uuid === currentPlayer.uuid ? 'white' : 'black'
  }

  const isInCheck = (): boolean => {
    return ChessLogic.isInCheck(gameState, gameState.currentTurn)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-2xl font-bold text-gray-800 mb-2">Loading Chess Game...</div>
          <div className="text-sm text-gray-600">{connectionStatus}</div>
        </div>
      </div>
    )
  }

  if (!room || !currentPlayer || !opponent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-2xl font-bold text-red-600">Game Error</div>
          <div className="text-gray-600 mt-2">Could not load game data</div>
        </div>
      </div>
    )
  }

  const playerColor = getPlayerColor()
  const myTurn = isMyTurn()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent mb-2">
            ♔ Chess Master ♛
          </h1>
          <div className={`text-sm px-4 py-2 rounded-full inline-block font-semibold ${
            connectionStatus.includes("Connected")
              ? "bg-green-100 text-green-800"
              : connectionStatus.includes("Error")
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
          }`}>
            {connectionStatus}
          </div>
        </div>

        {/* Players Info */}
        <div className="flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={room.players[0].profileImage || "/placeholder.svg?height=80&width=80"}
                alt={room.players[0].name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {gameState.currentTurn === 'white' && !gameOver && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
              )}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-bold shadow-md">
                ♔ White
              </div>
            </div>
            <div>
              <h3 className="font-bold text-2xl text-gray-800">{room.players[0].name}</h3>
              {playerUuid === room.players[0].uuid && (
                <p className="text-sm text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full inline-block">👤 You</p>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">⚔️</div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Room: {gameSessionUuid?.slice(-6)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <h3 className="font-bold text-2xl text-gray-800">{room.players[1].name}</h3>
              {playerUuid === room.players[1].uuid && (
                <p className="text-sm text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full inline-block">👤 You</p>
              )}
            </div>
            <div className="relative">
              <img
                src={room.players[1].profileImage || "/placeholder.svg?height=80&width=80"}
                alt={room.players[1].name}
                className="w-20 h-20 rounded-full border-4 border-gray-800 shadow-lg object-cover"
              />
              {gameState.currentTurn === 'black' && !gameOver && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
              )}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                ♛ Black
              </div>
            </div>
          </div>
        </div>

        {/* Game Status */}
        <GameStatus
          currentTurn={gameState.currentTurn}
          gameStatus={gameState.gameStatus}
          winner={gameState.winner}
          isMyTurn={myTurn}
          playerColor={playerColor}
          isCheck={isInCheck()}
        />

        {/* Main Game Area */}
        <div className="flex justify-center items-start space-x-8">
          {/* Captured Pieces - Left */}
          <div className="w-64">
            <CapturedPieces
              capturedPieces={gameState.capturedPieces}
              playerColor={playerColor}
            />
          </div>

          {/* Chess Board */}
          <div className="flex-shrink-0">
            <ChessBoard
              board={gameState.board}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              onSquareClick={handleSquareClick}
              isMyTurn={myTurn}
              playerColor={playerColor}
              lastMove={lastMove}
            />
          </div>

          {/* Game Info - Right */}
          <div className="w-64 space-y-4">
            {/* Move History */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center">
                📜 Move History
              </h3>
              <div className="space-y-1 text-sm">
                {gameState.moveHistory.length === 0 ? (
                  <p className="text-gray-500 italic">No moves yet</p>
                ) : (
                  gameState.moveHistory.map((move, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-2 rounded bg-gray-50">
                      <span className="font-mono text-xs">
                        {index + 1}. {String.fromCharCode(97 + move.from.col)}{8 - move.from.row} → {String.fromCharCode(97 + move.to.col)}{8 - move.to.row}
                      </span>
                      {move.capturedPiece && <span className="text-red-500">×</span>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Game Controls */}
            {gameOver && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 text-center">
                <div className="text-2xl font-bold mb-4">
                  {gameState.winner ? (
                    <span className={gameState.winner === playerColor ? 'text-green-600' : 'text-red-600'}>
                      {gameState.winner === playerColor ? '🎉 You Win!' : '😔 You Lose'}
                    </span>
                  ) : (
                    <span className="text-yellow-600">🤝 Draw!</span>
                  )}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🔄 New Game
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChessGame() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-2xl font-bold text-gray-800 mb-2">Loading Chess Game...</div>
          <div className="text-sm text-gray-600">Initializing...</div>
        </div>
      </div>
    }>
      <ChessGameContent />
    </Suspense>
  )
}