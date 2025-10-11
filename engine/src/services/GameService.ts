import { Chess } from 'chess.js';
import { GameState, GameResult } from '../types';

export class GameService {
  private games: Map<string, GameState> = new Map();
  private chessInstances: Map<string, Chess> = new Map();

  /**
   * Creates a new game with the given ID
   */
  createGame(gameId: string): GameState {
    if (this.games.has(gameId)) {
      throw new Error(`Game with ID ${gameId} already exists`);
    }

    const chess = new Chess();
    const gameState: GameState = {
      gameId,
      players: {},
      boardState: chess.fen(),
      currentTurn: 'white',
      isGameOver: false,
    };

    this.games.set(gameId, gameState);
    this.chessInstances.set(gameId, chess);

    return gameState;
  }

  /**
   * Retrieves a game by ID
   */
  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  /**
   * Gets the chess instance for a game
   */
  getChessInstance(gameId: string): Chess | undefined {
    return this.chessInstances.get(gameId);
  }

  /**
   * Updates the board state for a game
   */
  updateBoardState(gameId: string, fen: string): void {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found`);
    }
    gameState.boardState = fen;
  }

  /**
   * Switches the current turn
   */
  switchTurn(gameId: string): void {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found`);
    }
    gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
  }

  /**
   * Marks a game as over with the given result
   */
  endGame(gameId: string, result: GameResult): void {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found`);
    }
    gameState.isGameOver = true;
    gameState.result = result;
  }

  /**
   * Checks if the game is over and returns the result
   */
  checkGameOver(gameId: string): GameResult | null {
    const chess = this.chessInstances.get(gameId);
    if (!chess) {
      return null;
    }

    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'black' : 'white';
      return {
        winner,
        reason: 'checkmate',
        timestamp: Date.now(),
      };
    }

    if (chess.isStalemate()) {
      return {
        winner: 'draw',
        reason: 'stalemate',
        timestamp: Date.now(),
      };
    }

    if (chess.isDraw()) {
      return {
        winner: 'draw',
        reason: 'draw',
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Removes a game
   */
  removeGame(gameId: string): void {
    this.games.delete(gameId);
    this.chessInstances.delete(gameId);
  }

  /**
   * Gets all active game IDs
   */
  getAllGameIds(): string[] {
    return Array.from(this.games.keys());
  }

  /**
   * Checks if a game exists
   */
  gameExists(gameId: string): boolean {
    return this.games.has(gameId);
  }
}
