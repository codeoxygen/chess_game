export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type GameMode = 'single' | 'multiplayer';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'waiting' | 'playing' | 'finished' | 'checkmate' | 'stalemate' | 'draw';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: ChessPiece;
  capturedPiece?: ChessPiece;
  isEnPassant?: boolean;
  isCastling?: boolean;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
}

export interface GameState {
  board: (ChessPiece | null)[][];
  currentPlayer: PieceColor;
  gameStatus: GameStatus;
  selectedSquare: Position | null;
  validMoves: Position[];
  moveHistory: Move[];
  isCheck: boolean;
  winner: PieceColor | null;
  gameMode: GameMode;
  difficulty?: Difficulty;
  gameSessionUuid?: string;
  playerUuid?: string;
  playerColor?: PieceColor;
  currentTurn?: string;
  isMyTurn?: boolean;
}

export interface Player {
  uuid: string;
  name: string;
  profileImage: string;
  ready: boolean;
  winState: string;
  color: PieceColor;
}

export interface Room {
  gameSessionUuid: string;
  players: Player[];
  gameBoard: (ChessPiece | null)[][];
  currentTurn: string;
  gameStatus: GameStatus;
  winner: string | null;
}

export interface MoveData {
  gameSessionUuid: string;
  playerUuid: string;
  move: Move;
  gameBoard: (ChessPiece | null)[][];
  currentTurn: string;
  gameStatus: GameStatus;
  isCheck: boolean;
  winner: PieceColor | null;
}

export interface SocketEvents {
  'join-game': { gameSessionUuid: string; playerUuid: string };
  'make-move': MoveData;
  'game-won': { gameSessionUuid: string; winner: string };
  'move-made': MoveData;
  'game-ended': { winner: string };
  'player-joined': { playerUuid: string };
}