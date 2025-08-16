import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Room from "@/lib/models/Room"
import { ChessLogic } from "@/app/components/ChessLogic"
import { GameState, Position, ChessPiece } from "@/app/types/chess"

interface Player {
  uuid: string;
  name: string;
  profileImage: string;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { gameSessionUuid, playerUuid, from, to } = body

    const room = await Room.findOne({ gameSessionUuid })

    if (!room) {
      return NextResponse.json(
        {
          status: false,
          message: "Room not found",
        },
        { status: 404 },
      )
    }

    // Check if it's the player's turn
    if (room.currentTurn !== playerUuid) {
      return NextResponse.json(
        {
          status: false,
          message: "Not your turn",
        },
        { status: 400 },
      )
    }

    // Initialize game board if it doesn't exist
    if (!room.gameBoard) {
      room.gameBoard = ChessLogic.createInitialBoard()
      room.moveHistory = []
      room.capturedPieces = { white: [], black: [] }
      room.castlingRights = {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true
      }
    }

    // Create current game state
    const currentGameState: GameState = {
      board: room.gameBoard,
      currentTurn: room.players[0].uuid === playerUuid ? 'white' : 'black',
      gameStatus: room.gameStatus || 'active',
      winner: room.winner ? (room.winner === room.players[0].uuid ? 'white' : 'black') : null,
      moveHistory: room.moveHistory || [],
      capturedPieces: room.capturedPieces || { white: [], black: [] },
      enPassantTarget: room.enPassantTarget || null,
      castlingRights: room.castlingRights || {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true
      }
    }

    // Validate the move
    const fromPos: Position = { row: from.row, col: from.col }
    const toPos: Position = { row: to.row, col: to.col }
    
    const piece = ChessLogic.getPieceAt(currentGameState.board, fromPos)
    if (!piece) {
      return NextResponse.json(
        {
          status: false,
          message: "No piece at source position",
        },
        { status: 400 },
      )
    }

    // Check if the piece belongs to the current player
    const playerColor = room.players[0].uuid === playerUuid ? 'white' : 'black'
    if (piece.color !== playerColor) {
      return NextResponse.json(
        {
          status: false,
          message: "Cannot move opponent's piece",
        },
        { status: 400 },
      )
    }

    // Get valid moves for the piece
    const validMoves = ChessLogic.getValidMoves(currentGameState, fromPos)
    const isValidMove = validMoves.some(move => move.row === toPos.row && move.col === toPos.col)
    
    if (!isValidMove) {
      return NextResponse.json(
        {
          status: false,
          message: "Invalid move",
        },
        { status: 400 },
      )
    }

    // Make the move
    const newGameState = ChessLogic.makeMove(currentGameState, fromPos, toPos)

    // Update room with new game state
    room.gameBoard = newGameState.board
    room.moveHistory = newGameState.moveHistory
    room.capturedPieces = newGameState.capturedPieces
    room.enPassantTarget = newGameState.enPassantTarget
    room.castlingRights = newGameState.castlingRights
    room.lastMove = { from: fromPos, to: toPos }
    
    // Switch turns
    const otherPlayer = room.players.find((p: Player) => p.uuid !== playerUuid)
    room.currentTurn = otherPlayer?.uuid

    // Update game status
    room.gameStatus = newGameState.gameStatus
    if (newGameState.winner) {
      const winnerUuid = newGameState.winner === 'white' ? room.players[0].uuid : room.players[1].uuid
      room.winner = winnerUuid
    }

    await room.save()

    return NextResponse.json({
      status: true,
      message: "Move made successfully",
      payload: {
        gameBoard: room.gameBoard,
        currentTurn: room.currentTurn,
        gameStatus: room.gameStatus,
        winner: room.winner,
        moveHistory: room.moveHistory,
        capturedPieces: room.capturedPieces,
        lastMove: room.lastMove,
        enPassantTarget: room.enPassantTarget,
        castlingRights: room.castlingRights
      },
    })
  } catch (error) {
    console.error("Error making move:", error)
    return NextResponse.json(
      {
        status: false,
        message: "Error making move",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}