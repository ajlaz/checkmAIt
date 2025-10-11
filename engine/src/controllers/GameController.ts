import { GameService } from '../services/GameService';
import { CreateGameRequest, CreateGameResponse } from '../types';

export class GameController {
  constructor(
    private gameService: GameService,
    private wsPortGenerator: (gameId: string) => number
  ) {}

  /**
   * Handles game creation request
   */
  createGame(request: CreateGameRequest): CreateGameResponse {
    try {
      const { gameId, whitePlayerId, blackPlayerId } = request;

      if (!gameId || !whitePlayerId || !blackPlayerId) {
        return {
          success: false,
          gameId: gameId || '',
          wsPort: 0,
          error: 'Missing required fields: gameId, whitePlayerId, blackPlayerId',
        };
      }

      // Check if game already exists
      if (this.gameService.gameExists(gameId)) {
        return {
          success: false,
          gameId,
          wsPort: 0,
          error: `Game with ID ${gameId} already exists`,
        };
      }

      // Create the game
      this.gameService.createGame(gameId);

      // Generate WebSocket port for this specific game
      const wsPort = this.wsPortGenerator(gameId);

      return {
        success: true,
        gameId,
        wsPort,
      };
    } catch (error) {
      return {
        success: false,
        gameId: request.gameId || '',
        wsPort: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gets game state
   */
  getGameState(gameId: string) {
    const gameState = this.gameService.getGame(gameId);

    if (!gameState) {
      return {
        error: 'Game not found',
      };
    }

    return {
      gameId: gameState.gameId,
      boardState: gameState.boardState,
      currentTurn: gameState.currentTurn,
      isGameOver: gameState.isGameOver,
      result: gameState.result,
    };
  }

  /**
   * Gets game result (for reporting to web server)
   */
  getGameResult(gameId: string) {
    const gameState = this.gameService.getGame(gameId);

    if (!gameState) {
      return {
        error: 'Game not found',
      };
    }

    if (!gameState.isGameOver || !gameState.result) {
      return {
        error: 'Game is not over',
      };
    }

    return {
      success: true,
      result: gameState.result,
    };
  }

  /**
   * Deletes a game
   */
  deleteGame(gameId: string): { success: boolean } {
    this.gameService.removeGame(gameId);
    return { success: true };
  }

  /**
   * Lists all active games
   */
  listGames() {
    const games = this.gameService.getAllGameIds();
    return { games };
  }
}
