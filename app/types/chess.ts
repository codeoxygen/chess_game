export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
export type PieceColor = 'white' | 'black'
export type GameMode = 'multiplayer' | 'ai'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface ChessPiece {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean
}

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
  piece: ChessPiece
  capturedPiece?: ChessPiece
  isEnPassant?: boolean
  isCastling?: boolean
  isPromotion?: boolean
  promotionPiece?: PieceType
}

export interface GameState {
  board: (ChessPiece | null)[][]
  currentTurn: PieceColor
  gameStatus: 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw'
  winner: PieceColor | null
  moveHistory: Move[]
  capturedPieces: {
    white: ChessPiece[]
    black: ChessPiece[]
  }
  enPassantTarget: Position | null
  castlingRights: {
    whiteKingSide: boolean
    whiteQueenSide: boolean
    blackKingSide: boolean
    blackQueenSide: boolean
  }
}

export interface Player {
  uuid: string
  name: string
  profileImage: string
  color: PieceColor
  ready: boolean
  winState?: string
}

export interface Room {
  gameSessionUuid: string
  players: Player[]
  gameBoard: (ChessPiece | null)[][]
  currentTurn: string
  gameStatus: string
  winner: string | null
  moveHistory: Move[]
}