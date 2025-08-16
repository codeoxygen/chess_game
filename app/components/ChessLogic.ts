import { ChessPiece, Position, Move, GameState, PieceColor, PieceType } from '@/app/types/chess'

export class ChessLogic {
  static createInitialBoard(): (ChessPiece | null)[][] {
    const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null))
    
    // Place pawns
    for (let col = 0; col < 8; col++) {
      board[1][col] = { type: 'pawn', color: 'black' }
      board[6][col] = { type: 'pawn', color: 'white' }
    }
    
    // Place other pieces
    const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    
    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: pieceOrder[col], color: 'black' }
      board[7][col] = { type: pieceOrder[col], color: 'white' }
    }
    
    return board
  }

  static createInitialGameState(): GameState {
    return {
      board: this.createInitialBoard(),
      currentTurn: 'white',
      gameStatus: 'active',
      winner: null,
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      enPassantTarget: null,
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true
      }
    }
  }

  static isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8
  }

  static getPieceAt(board: (ChessPiece | null)[][], pos: Position): ChessPiece | null {
    if (!this.isValidPosition(pos)) return null
    return board[pos.row][pos.col]
  }

  static getValidMoves(gameState: GameState, from: Position): Position[] {
    const piece = this.getPieceAt(gameState.board, from)
    if (!piece || piece.color !== gameState.currentTurn) return []

    let moves: Position[] = []

    switch (piece.type) {
      case 'pawn':
        moves = this.getPawnMoves(gameState, from)
        break
      case 'rook':
        moves = this.getRookMoves(gameState, from)
        break
      case 'knight':
        moves = this.getKnightMoves(gameState, from)
        break
      case 'bishop':
        moves = this.getBishopMoves(gameState, from)
        break
      case 'queen':
        moves = this.getQueenMoves(gameState, from)
        break
      case 'king':
        moves = this.getKingMoves(gameState, from)
        break
    }

    // Filter out moves that would put own king in check
    return moves.filter(to => !this.wouldBeInCheck(gameState, from, to, piece.color))
  }

  static getPawnMoves(gameState: GameState, from: Position): Position[] {
    const moves: Position[] = []
    const piece = this.getPieceAt(gameState.board, from)!
    const direction = piece.color === 'white' ? -1 : 1
    const startRow = piece.color === 'white' ? 6 : 1

    // Forward move
    const oneForward = { row: from.row + direction, col: from.col }
    if (this.isValidPosition(oneForward) && !this.getPieceAt(gameState.board, oneForward)) {
      moves.push(oneForward)

      // Two squares forward from starting position
      if (from.row === startRow) {
        const twoForward = { row: from.row + 2 * direction, col: from.col }
        if (this.isValidPosition(twoForward) && !this.getPieceAt(gameState.board, twoForward)) {
          moves.push(twoForward)
        }
      }
    }

    // Diagonal captures
    const captureLeft = { row: from.row + direction, col: from.col - 1 }
    const captureRight = { row: from.row + direction, col: from.col + 1 }

    if (this.isValidPosition(captureLeft)) {
      const leftPiece = this.getPieceAt(gameState.board, captureLeft)
      if (leftPiece && leftPiece.color !== piece.color) {
        moves.push(captureLeft)
      }
    }

    if (this.isValidPosition(captureRight)) {
      const rightPiece = this.getPieceAt(gameState.board, captureRight)
      if (rightPiece && rightPiece.color !== piece.color) {
        moves.push(captureRight)
      }
    }

    // En passant
    if (gameState.enPassantTarget) {
      if ((captureLeft.row === gameState.enPassantTarget.row && captureLeft.col === gameState.enPassantTarget.col) ||
          (captureRight.row === gameState.enPassantTarget.row && captureRight.col === gameState.enPassantTarget.col)) {
        moves.push(gameState.enPassantTarget)
      }
    }

    return moves
  }

  static getRookMoves(gameState: GameState, from: Position): Position[] {
    return this.getSlidingMoves(gameState, from, [
      { row: 0, col: 1 }, { row: 0, col: -1 },
      { row: 1, col: 0 }, { row: -1, col: 0 }
    ])
  }

  static getBishopMoves(gameState: GameState, from: Position): Position[] {
    return this.getSlidingMoves(gameState, from, [
      { row: 1, col: 1 }, { row: 1, col: -1 },
      { row: -1, col: 1 }, { row: -1, col: -1 }
    ])
  }

  static getQueenMoves(gameState: GameState, from: Position): Position[] {
    return [
      ...this.getRookMoves(gameState, from),
      ...this.getBishopMoves(gameState, from)
    ]
  }

  static getKnightMoves(gameState: GameState, from: Position): Position[] {
    const moves: Position[] = []
    const piece = this.getPieceAt(gameState.board, from)!
    const knightMoves = [
      { row: -2, col: -1 }, { row: -2, col: 1 },
      { row: -1, col: -2 }, { row: -1, col: 2 },
      { row: 1, col: -2 }, { row: 1, col: 2 },
      { row: 2, col: -1 }, { row: 2, col: 1 }
    ]

    for (const move of knightMoves) {
      const to = { row: from.row + move.row, col: from.col + move.col }
      if (this.isValidPosition(to)) {
        const targetPiece = this.getPieceAt(gameState.board, to)
        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push(to)
        }
      }
    }

    return moves
  }

  static getKingMoves(gameState: GameState, from: Position): Position[] {
    const moves: Position[] = []
    const piece = this.getPieceAt(gameState.board, from)!
    const kingMoves = [
      { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
      { row: 0, col: -1 }, { row: 0, col: 1 },
      { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
    ]

    for (const move of kingMoves) {
      const to = { row: from.row + move.row, col: from.col + move.col }
      if (this.isValidPosition(to)) {
        const targetPiece = this.getPieceAt(gameState.board, to)
        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push(to)
        }
      }
    }

    // Castling
    if (!piece.hasMoved && !this.isInCheck(gameState, piece.color)) {
      // King side castling
      if (piece.color === 'white' && gameState.castlingRights.whiteKingSide) {
        if (this.canCastle(gameState, from, { row: 7, col: 6 }, { row: 7, col: 7 })) {
          moves.push({ row: 7, col: 6 })
        }
      } else if (piece.color === 'black' && gameState.castlingRights.blackKingSide) {
        if (this.canCastle(gameState, from, { row: 0, col: 6 }, { row: 0, col: 7 })) {
          moves.push({ row: 0, col: 6 })
        }
      }

      // Queen side castling
      if (piece.color === 'white' && gameState.castlingRights.whiteQueenSide) {
        if (this.canCastle(gameState, from, { row: 7, col: 2 }, { row: 7, col: 0 })) {
          moves.push({ row: 7, col: 2 })
        }
      } else if (piece.color === 'black' && gameState.castlingRights.blackQueenSide) {
        if (this.canCastle(gameState, from, { row: 0, col: 2 }, { row: 0, col: 0 })) {
          moves.push({ row: 0, col: 2 })
        }
      }
    }

    return moves
  }

  static getSlidingMoves(gameState: GameState, from: Position, directions: Position[]): Position[] {
    const moves: Position[] = []
    const piece = this.getPieceAt(gameState.board, from)!

    for (const direction of directions) {
      for (let i = 1; i < 8; i++) {
        const to = {
          row: from.row + direction.row * i,
          col: from.col + direction.col * i
        }

        if (!this.isValidPosition(to)) break

        const targetPiece = this.getPieceAt(gameState.board, to)
        if (!targetPiece) {
          moves.push(to)
        } else {
          if (targetPiece.color !== piece.color) {
            moves.push(to)
          }
          break
        }
      }
    }

    return moves
  }

  static canCastle(gameState: GameState, kingPos: Position, kingTarget: Position, rookPos: Position): boolean {
    const rook = this.getPieceAt(gameState.board, rookPos)
    if (!rook || rook.type !== 'rook' || rook.hasMoved) return false

    // Check if squares between king and rook are empty
    const minCol = Math.min(kingPos.col, rookPos.col)
    const maxCol = Math.max(kingPos.col, rookPos.col)
    
    for (let col = minCol + 1; col < maxCol; col++) {
      if (this.getPieceAt(gameState.board, { row: kingPos.row, col })) {
        return false
      }
    }

    // Check if king passes through check
    const step = kingTarget.col > kingPos.col ? 1 : -1
    for (let col = kingPos.col; col !== kingTarget.col + step; col += step) {
      if (this.isSquareAttacked(gameState, { row: kingPos.row, col }, rook.color === 'white' ? 'black' : 'white')) {
        return false
      }
    }

    return true
  }

  static makeMove(gameState: GameState, from: Position, to: Position): GameState {
    const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState
    const piece = this.getPieceAt(newGameState.board, from)!
    const capturedPiece = this.getPieceAt(newGameState.board, to)

    // Create move object
    const move: Move = {
      from,
      to,
      piece: { ...piece },
      capturedPiece: capturedPiece ? { ...capturedPiece } : undefined
    }

    // Handle captures
    if (capturedPiece) {
      newGameState.capturedPieces[capturedPiece.color].push(capturedPiece)
    }

    // Move the piece
    newGameState.board[to.row][to.col] = { ...piece, hasMoved: true }
    newGameState.board[from.row][from.col] = null

    // Handle special moves
    this.handleSpecialMoves(newGameState, move)

    // Update game state
    newGameState.currentTurn = newGameState.currentTurn === 'white' ? 'black' : 'white'
    newGameState.moveHistory.push(move)
    newGameState.enPassantTarget = null

    // Set en passant target for pawn double moves
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      newGameState.enPassantTarget = {
        row: from.row + (to.row - from.row) / 2,
        col: from.col
      }
    }

    // Update castling rights
    this.updateCastlingRights(newGameState, move)

    // Check game status
    newGameState.gameStatus = this.getGameStatus(newGameState)
    if (newGameState.gameStatus === 'checkmate') {
      newGameState.winner = piece.color
    }

    return newGameState
  }

  static handleSpecialMoves(gameState: GameState, move: Move): void {
    // Handle castling
    if (move.piece.type === 'king' && Math.abs(move.to.col - move.from.col) === 2) {
      const isKingSide = move.to.col > move.from.col
      const rookFromCol = isKingSide ? 7 : 0
      const rookToCol = isKingSide ? 5 : 3
      const row = move.from.row

      // Move the rook
      const rook = gameState.board[row][rookFromCol]!
      gameState.board[row][rookToCol] = { ...rook, hasMoved: true }
      gameState.board[row][rookFromCol] = null
      move.isCastling = true
    }

    // Handle en passant
    if (move.piece.type === 'pawn' && move.to.col !== move.from.col && !move.capturedPiece) {
      const capturedPawnRow = move.from.row
      const capturedPawn = gameState.board[capturedPawnRow][move.to.col]!
      gameState.board[capturedPawnRow][move.to.col] = null
      gameState.capturedPieces[capturedPawn.color].push(capturedPawn)
      move.isEnPassant = true
      move.capturedPiece = capturedPawn
    }

    // Handle pawn promotion
    if (move.piece.type === 'pawn' && (move.to.row === 0 || move.to.row === 7)) {
      gameState.board[move.to.row][move.to.col] = {
        type: 'queen', // Auto-promote to queen
        color: move.piece.color,
        hasMoved: true
      }
      move.isPromotion = true
      move.promotionPiece = 'queen'
    }
  }

  static updateCastlingRights(gameState: GameState, move: Move): void {
    // King moves
    if (move.piece.type === 'king') {
      if (move.piece.color === 'white') {
        gameState.castlingRights.whiteKingSide = false
        gameState.castlingRights.whiteQueenSide = false
      } else {
        gameState.castlingRights.blackKingSide = false
        gameState.castlingRights.blackQueenSide = false
      }
    }

    // Rook moves
    if (move.piece.type === 'rook') {
      if (move.piece.color === 'white') {
        if (move.from.col === 0) gameState.castlingRights.whiteQueenSide = false
        if (move.from.col === 7) gameState.castlingRights.whiteKingSide = false
      } else {
        if (move.from.col === 0) gameState.castlingRights.blackQueenSide = false
        if (move.from.col === 7) gameState.castlingRights.blackKingSide = false
      }
    }

    // Rook captures
    if (move.capturedPiece?.type === 'rook') {
      if (move.capturedPiece.color === 'white') {
        if (move.to.col === 0) gameState.castlingRights.whiteQueenSide = false
        if (move.to.col === 7) gameState.castlingRights.whiteKingSide = false
      } else {
        if (move.to.col === 0) gameState.castlingRights.blackQueenSide = false
        if (move.to.col === 7) gameState.castlingRights.blackKingSide = false
      }
    }
  }

  static isInCheck(gameState: GameState, color: PieceColor): boolean {
    const kingPos = this.findKing(gameState.board, color)
    if (!kingPos) return false
    return this.isSquareAttacked(gameState, kingPos, color === 'white' ? 'black' : 'white')
  }

  static findKing(board: (ChessPiece | null)[][], color: PieceColor): Position | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col }
        }
      }
    }
    return null
  }

  static isSquareAttacked(gameState: GameState, square: Position, byColor: PieceColor): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col]
        if (piece && piece.color === byColor) {
          const moves = this.getValidMovesWithoutCheckValidation(gameState, { row, col })
          if (moves.some(move => move.row === square.row && move.col === square.col)) {
            return true
          }
        }
      }
    }
    return false
  }

  static getValidMovesWithoutCheckValidation(gameState: GameState, from: Position): Position[] {
    const piece = this.getPieceAt(gameState.board, from)
    if (!piece) return []

    switch (piece.type) {
      case 'pawn': return this.getPawnMoves(gameState, from)
      case 'rook': return this.getRookMoves(gameState, from)
      case 'knight': return this.getKnightMoves(gameState, from)
      case 'bishop': return this.getBishopMoves(gameState, from)
      case 'queen': return this.getQueenMoves(gameState, from)
      case 'king': return this.getKingMoves(gameState, from).filter(move => Math.abs(move.col - from.col) <= 1) // Exclude castling
      default: return []
    }
  }

  static wouldBeInCheck(gameState: GameState, from: Position, to: Position, color: PieceColor): boolean {
    const tempGameState = JSON.parse(JSON.stringify(gameState)) as GameState
    const piece = tempGameState.board[from.row][from.col]!
    
    // Make the move temporarily
    tempGameState.board[to.row][to.col] = piece
    tempGameState.board[from.row][from.col] = null
    
    return this.isInCheck(tempGameState, color)
  }

  static getGameStatus(gameState: GameState): 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw' {
    const currentColor = gameState.currentTurn
    const isInCheck = this.isInCheck(gameState, currentColor)
    const hasValidMoves = this.hasValidMoves(gameState, currentColor)

    if (!hasValidMoves) {
      return isInCheck ? 'checkmate' : 'stalemate'
    }

    if (isInCheck) {
      return 'check'
    }

    // Check for insufficient material
    if (this.isInsufficientMaterial(gameState.board)) {
      return 'draw'
    }

    return 'active'
  }

  static hasValidMoves(gameState: GameState, color: PieceColor): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col]
        if (piece && piece.color === color) {
          const moves = this.getValidMoves(gameState, { row, col })
          if (moves.length > 0) {
            return true
          }
        }
      }
    }
    return false
  }

  static isInsufficientMaterial(board: (ChessPiece | null)[][]): boolean {
    const pieces: ChessPiece[] = []
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece) pieces.push(piece)
      }
    }

    // King vs King
    if (pieces.length === 2) return true

    // King and Bishop/Knight vs King
    if (pieces.length === 3) {
      const nonKings = pieces.filter(p => p.type !== 'king')
      return nonKings.length === 1 && (nonKings[0].type === 'bishop' || nonKings[0].type === 'knight')
    }

    return false
  }
}