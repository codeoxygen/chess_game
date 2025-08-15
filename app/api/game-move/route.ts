import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Room from "@/lib/models/Room"
import { ChessEngine } from "@/app/components/ChessEngine"
import { PieceColor } from "@/app/types/chess"

interface Player {
  uuid: string;
  [key: string]: unknown;
}

const chessEngine = ChessEngine.getInstance();

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { gameSessionUuid, playerUuid, move } = body

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

    if (room.currentTurn !== playerUuid) {
      return NextResponse.json(
        {
          status: false,
          message: "Not your turn",
        },
        { status: 400 },
      )
    }

    if (room.gameStatus !== "PLAYING") {
      return NextResponse.json(
        {
          status: false,
          message: "Game is not in playing state",
        },
        { status: 400 },
      )
    }

    // Get player color
    const playerIndex = room.players.findIndex((p: Player) => p.uuid === playerUuid)
    const playerColor: PieceColor = playerIndex === 0 ? "white" : "black"

    // Validate the move
    const isValid = chessEngine.isValidMove(
      room.gameBoard,
      move.from,
      move.to,
      playerColor
    )

    if (!isValid) {
      return NextResponse.json(
        {
          status: false,
          message: "Invalid move",
        },
        { status: 400 },
      )
    }

    // Make the move
    const newBoard = chessEngine.makeMove(room.gameBoard, move)
    room.gameBoard = newBoard

    // Check game state
    const opponentColor: PieceColor = playerColor === "white" ? "black" : "white"
    const isCheck = chessEngine.isInCheck(newBoard, opponentColor)
    const isCheckmate = chessEngine.isCheckmate(newBoard, opponentColor)
    const isStalemate = chessEngine.isStalemate(newBoard, opponentColor)

    let gameStatus = "PLAYING"
    let winner = null

    if (isCheckmate) {
      gameStatus = "FINISHED"
      winner = playerUuid
      room.gameStatus = "FINISHED"
      room.winner = winner
    } else if (isStalemate) {
      gameStatus = "FINISHED"
      room.gameStatus = "FINISHED"
    }

    // Switch turns
    if (gameStatus === "PLAYING") {
      const otherPlayer = room.players.find((p: Player) => p.uuid !== playerUuid)
      room.currentTurn = otherPlayer?.uuid
    }

    await room.save()

    return NextResponse.json({
      status: true,
      message: "Move made successfully",
      payload: {
        gameBoard: room.gameBoard,
        currentTurn: room.currentTurn,
        gameStatus,
        isCheck,
        winner,
        move
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