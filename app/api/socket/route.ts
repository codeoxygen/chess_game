import type { NextRequest } from "next/server"
import type { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"

export const dynamic = "force-dynamic"

interface JoinGameData {
  gameSessionUuid: string;
  playerUuid: string;
}

interface MakeMoveData {
  gameSessionUuid: string;
  playerUuid: string;
  position: number | string;
  gameBoard: unknown;
  currentTurn: string;
}

interface GameWonData {
  gameSessionUuid: string;
  winner: string;
}

// Extend the Response interface to include socket property
interface ResponseWithSocket extends Response {
  socket?: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
}

const gameRooms = new Map<string, Set<string>>()

export async function GET(req: NextRequest) {
  const res = new Response() as ResponseWithSocket

  if (!res.socket?.server.io) {
    console.log("Setting up Socket.IO server...")

    const httpServer: NetServer = res.socket!.server
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      socket.on("join-game", (data: JoinGameData) => {
        const { gameSessionUuid, playerUuid } = data
        socket.join(gameSessionUuid)

        if (!gameRooms.has(gameSessionUuid)) {
          gameRooms.set(gameSessionUuid, new Set<string>())
        }
        gameRooms.get(gameSessionUuid)!.add(socket.id)

        console.log(`Player ${playerUuid} joined game ${gameSessionUuid}`)
        socket.to(gameSessionUuid).emit("player-joined", { playerUuid })
      })

      socket.on("make-move", (data: MakeMoveData) => {
        const { gameSessionUuid, playerUuid, position, gameBoard, currentTurn } = data
        io.to(gameSessionUuid).emit("move-made", {
          playerUuid,
          position,
          gameBoard,
          currentTurn,
        })
      })

      socket.on("game-won", (data: GameWonData) => {
        const { gameSessionUuid, winner } = data
        io.to(gameSessionUuid).emit("game-ended", { winner })
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
        for (const [gameSessionUuid, players] of gameRooms.entries()) {
          if (players.has(socket.id)) {
            players.delete(socket.id)
            if (players.size === 0) {
              gameRooms.delete(gameSessionUuid)
            }
          }
        }
      })
    })

    res.socket!.server.io = io
  }

  return new Response("Socket.IO server is running", { status: 200 })
}