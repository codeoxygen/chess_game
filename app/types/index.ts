export type Player = {
  uuid: string;
  name: string;
  profileImage?: string;
  symbol: 'X' | 'O';
  isAI?: boolean;
};

export type GameMode = 'single-player' | 'multiplayer';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type GameState = {
  board: (string | null)[];
  currentTurn: string;
  winner: string | null;
  gameOver: boolean;
  isDraw: boolean;
};

export type Room = {
  gameSessionUuid: string;
  players: Player[];
  gameBoard: (string | null)[];
  currentTurn: string;
  winner: string | null;
  gameMode: GameMode;
  createdAt: string;
};

export type Position = {
  row: number;
  col: number;
  index: number;
};

export type WinningLine = {
  positions: Position[];
  direction: 'horizontal' | 'vertical' | 'diagonal-right' | 'diagonal-left';
};

export type GameStats = {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
};