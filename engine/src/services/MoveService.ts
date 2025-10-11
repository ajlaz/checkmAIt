import { Chess, Move } from 'chess.js';
import { MoveRequest, MoveResponse, GameState } from '../types';
import { GameService } from './GameService';

export class MoveService {
  constructor(private gameService: GameService) {}

  /**
   * Validates and executes a move
   */
  makeMove(gameId: string, playerId: string, moveRequest: MoveRequest): MoveResponse {
    const gameState = this.gameService.getGame(gameId);
    const chess = this.gameService.getChessInstance(gameId);

    if (!gameState || !chess) {
      return {
        success: false,
        boardState: '',
        error: 'Game not found',
      };
    }

    // Verify it's the player's turn
    if (!this.isPlayerTurn(gameState, playerId)) {
      return {
        success: false,
        boardState: chess.fen(),
        error: 'Not your turn',
      };
    }

    // Attempt the move
    try {
      const move = chess.move({
        from: moveRequest.from,
        to: moveRequest.to,
        promotion: moveRequest.promotion,
      });

      if (!move) {
        return {
          success: false,
          boardState: chess.fen(),
          error: 'Invalid move',
        };
      }

      // Update game state
      this.gameService.updateBoardState(gameId, chess.fen());
      this.gameService.switchTurn(gameId);

      // Check for game over conditions
      const gameResult = this.gameService.checkGameOver(gameId);
      if (gameResult) {
        this.gameService.endGame(gameId, gameResult);
      }

      return {
        success: true,
        move: {
          from: move.from,
          to: move.to,
          san: move.san,
          promotion: move.promotion,
        },
        boardState: chess.fen(),
        gameOver: gameState.isGameOver,
        result: gameState.result,
      };
    } catch (error) {
      return {
        success: false,
        boardState: chess.fen(),
        error: error instanceof Error ? error.message : 'Invalid move',
      };
    }
  }

  /**
   * Validates a move without executing it
   */
  validateMove(gameId: string, moveRequest: MoveRequest): boolean {
    const chess = this.gameService.getChessInstance(gameId);
    if (!chess) {
      return false;
    }

    // Create a copy to test the move
    const testChess = new Chess(chess.fen());
    try {
      const move = testChess.move({
        from: moveRequest.from,
        to: moveRequest.to,
        promotion: moveRequest.promotion,
      });
      return move !== null;
    } catch {
      return false;
    }
  }

  /**
   * Gets all legal moves for the current position
   */
  getLegalMoves(gameId: string): string[] {
    const chess = this.gameService.getChessInstance(gameId);
    if (!chess) {
      return [];
    }
    return chess.moves();
  }

  /**
   * Gets legal moves for a specific square
   */
  getLegalMovesForSquare(gameId: string, square: string): string[] {
    const chess = this.gameService.getChessInstance(gameId);
    if (!chess) {
      return [];
    }
    return chess.moves({ square: square as any, verbose: false });
  }

  /**
   * Checks if it's the specified player's turn
   */
  private isPlayerTurn(gameState: GameState, playerId: string): boolean {
    const currentPlayer = gameState.players[gameState.currentTurn];
    return currentPlayer?.id === playerId;
  }

  /**
   * Gets the move history for a game
   */
  getMoveHistory(gameId: string): Move[] {
    const chess = this.gameService.getChessInstance(gameId);
    if (!chess) {
      return [];
    }
    return chess.history({ verbose: true });
  }

  /**
   * Checks if the current position is in check
   */
  isInCheck(gameId: string): boolean {
    const chess = this.gameService.getChessInstance(gameId);
    if (!chess) {
      return false;
    }
    return chess.inCheck();
  }
}
