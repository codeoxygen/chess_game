import { ChessPiece, Position, Move, GameState, PieceColor, PieceType, Difficulty } from '../types/chess';

export class ChessEngine {
  private static instance: ChessEngine;
  
  public static getInstance(): ChessEngine {
    if (!ChessEngine.instance) {
      ChessEngine.instance = new ChessEngine();
    }
    return ChessEngine.instance;
  }

  public initializeBoard(): (ChessPiece | null)[][] {
    const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place pawns
    for (let col = 0; col < 8; col++) {
      board[1][col] = { type: 'pawn', color: 'black' };
      board[6][col] = { type: 'pawn', color: 'white' };
    }
    
    // Place other pieces
    const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: pieceOrder[col], color: 'black' };
      board[7][col] = { type: pieceOrder[col], color: 'white' };
    }
    
    return board;
  }

  public isValidMove(board: (ChessPiece | null)[][], from: Position, to: Position, currentPlayer: PieceColor): boolean {
    const piece = board[from.row][from.col];
    if (!piece || piece.color !== currentPlayer) return false;
    
    const targetPiece = board[to.row][to.col];
    if (targetPiece && targetPiece.color === piece.color) return false;
    
    if (!this.isValidPieceMove(board, from, to, piece)) return false;
    
    // Check if move would put own king in check
    const testBoard = this.makeTestMove(board, from, to);
    return !this.isInCheck(testBoard, currentPlayer);
  }

  private isValidPieceMove(board: (ChessPiece | null)[][], from: Position, to: Position, piece: ChessPiece): boolean {
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);
    
    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(board, from, to, piece);
      case 'rook':
        return (rowDiff === 0 || colDiff === 0) && this.isPathClear(board, from, to);
      case 'bishop':
        return absRowDiff === absColDiff && this.isPathClear(board, from, to);
      case 'queen':
        return (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) && this.isPathClear(board, from, to);
      case 'king':
        return absRowDiff <= 1 && absColDiff <= 1;
      case 'knight':
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
      default:
        return false;
    }
  }

  private isValidPawnMove(board: (ChessPiece | null)[][], from: Position, to: Position, piece: ChessPiece): boolean {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    const rowDiff = to.row - from.row;
    const colDiff = Math.abs(to.col - from.col);
    
    // Forward move
    if (colDiff === 0) {
      if (board[to.row][to.col]) return false; // Blocked
      if (rowDiff === direction) return true; // One square forward
      if (from.row === startRow && rowDiff === 2 * direction) return true; // Two squares from start
    }
    
    // Diagonal capture
    if (colDiff === 1 && rowDiff === direction) {
      return board[to.row][to.col] !== null; // Must capture
    }
    
    return false;
  }

  private isPathClear(board: (ChessPiece | null)[][], from: Position, to: Position): boolean {
    const rowStep = Math.sign(to.row - from.row);
    const colStep = Math.sign(to.col - from.col);
    
    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;
    
    while (currentRow !== to.row || currentCol !== to.col) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  }

  public getAllValidMoves(board: (ChessPiece | null)[][], color: PieceColor): Move[] {
    const moves: Move[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const from = { row, col };
          const pieceMoves = this.getPieceValidMoves(board, from);
          moves.push(...pieceMoves);
        }
      }
    }
    
    return moves;
  }

  public getPieceValidMoves(board: (ChessPiece | null)[][], from: Position): Move[] {
    const moves: Move[] = [];
    const piece = board[from.row][from.col];
    if (!piece) return moves;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const to = { row, col };
        if (this.isValidMove(board, from, to, piece.color)) {
          moves.push({
            from,
            to,
            piece,
            capturedPiece: board[to.row][to.col] || undefined
          });
        }
      }
    }
    
    return moves;
  }

  public makeMove(board: (ChessPiece | null)[][], move: Move): (ChessPiece | null)[][] {
    const newBoard = board.map(row => [...row]);
    newBoard[move.to.row][move.to.col] = move.piece;
    newBoard[move.from.row][move.from.col] = null;
    return newBoard;
  }

  private makeTestMove(board: (ChessPiece | null)[][], from: Position, to: Position): (ChessPiece | null)[][] {
    const testBoard = board.map(row => [...row]);
    testBoard[to.row][to.col] = testBoard[from.row][from.col];
    testBoard[from.row][from.col] = null;
    return testBoard;
  }

  public isInCheck(board: (ChessPiece | null)[][], color: PieceColor): boolean {
    const kingPosition = this.findKing(board, color);
    if (!kingPosition) return false;
    
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === opponentColor) {
          if (this.isValidPieceMove(board, { row, col }, kingPosition, piece)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  public isCheckmate(board: (ChessPiece | null)[][], color: PieceColor): boolean {
    if (!this.isInCheck(board, color)) return false;
    return this.getAllValidMoves(board, color).length === 0;
  }

  public isStalemate(board: (ChessPiece | null)[][], color: PieceColor): boolean {
    if (this.isInCheck(board, color)) return false;
    return this.getAllValidMoves(board, color).length === 0;
  }

  private findKing(board: (ChessPiece | null)[][], color: PieceColor): Position | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  public evaluateBoard(board: (ChessPiece | null)[][], color: PieceColor): number {
    const pieceValues = {
      pawn: 1,
      knight: 3,
      bishop: 3,
      rook: 5,
      queen: 9,
      king: 0
    };
    
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const value = pieceValues[piece.type];
          score += piece.color === color ? value : -value;
        }
      }
    }
    
    return score;
  }

  public getBestMove(board: (ChessPiece | null)[][], color: PieceColor, difficulty: Difficulty): Move | null {
    const moves = this.getAllValidMoves(board, color);
    if (moves.length === 0) return null;
    
    switch (difficulty) {
      case 'easy':
        return moves[Math.floor(Math.random() * moves.length)];
      case 'medium':
        return this.getBestMoveWithDepth(board, color, 2);
      case 'hard':
        return this.getBestMoveWithDepth(board, color, 4);
      default:
        return moves[0];
    }
  }

  private getBestMoveWithDepth(board: (ChessPiece | null)[][], color: PieceColor, depth: number): Move | null {
    const moves = this.getAllValidMoves(board, color);
    if (moves.length === 0) return null;
    
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const newBoard = this.makeMove(board, move);
      const score = this.minimax(newBoard, depth - 1, false, color, -Infinity, Infinity);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  private minimax(board: (ChessPiece | null)[][], depth: number, isMaximizing: boolean, aiColor: PieceColor, alpha: number, beta: number): number {
    if (depth === 0) {
      return this.evaluateBoard(board, aiColor);
    }
    
    const currentColor = isMaximizing ? aiColor : (aiColor === 'white' ? 'black' : 'white');
    const moves = this.getAllValidMoves(board, currentColor);
    
    if (moves.length === 0) {
      if (this.isInCheck(board, currentColor)) {
        return isMaximizing ? -10000 : 10000;
      }
      return 0; // Stalemate
    }
    
    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const move of moves) {
        const newBoard = this.makeMove(board, move);
        const score = this.minimax(newBoard, depth - 1, false, aiColor, alpha, beta);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of moves) {
        const newBoard = this.makeMove(board, move);
        const score = this.minimax(newBoard, depth - 1, true, aiColor, alpha, beta);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }
}