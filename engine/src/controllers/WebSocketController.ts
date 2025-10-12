import { WebSocket } from 'ws';
import { GameService } from '../services/GameService';
import { MoveService } from '../services/MoveService';
import { ConnectionService } from '../services/ConnectionService';
import { Player, WebSocketMessage, MoveRequest } from '../types';
import { MatchmakingClient } from '../MatchmakingClient';

export class WebSocketController {
  private matchmakingClient: MatchmakingClient | null = null;

  constructor(
    private gameService: GameService,
    private moveService: MoveService,
    private connectionService: ConnectionService,
    matchmakingURL?: string
  ) {
    if (matchmakingURL) {
      this.matchmakingClient = new MatchmakingClient(matchmakingURL);
    }
  }

  /**
   * Handles new WebSocket connection
   */
  handleConnection(
    ws: WebSocket,
    gameId: string,
    playerId: string,
    color: 'white' | 'black'
  ): { success: boolean; error?: string } {
    // Validate game exists
    if (!this.gameService.gameExists(gameId)) {
      return {
        success: false,
        error: 'Game not found',
      };
    }

    // Create player object
    const player: Player = {
      id: playerId,
      ws,
      color,
    };

    // Register player
    const registered = this.connectionService.registerPlayer(gameId, player);
    if (!registered) {
      return {
        success: false,
        error: 'Unable to register player - may already be connected',
      };
    }

    // Send connection confirmation
    this.sendConnectionConfirmation(gameId, player);

    // If it's this player's turn, send board state
    const gameState = this.gameService.getGame(gameId);
    if (gameState && gameState.currentTurn === color) {
      this.sendBoardState(player, gameState.boardState, gameState.currentTurn);
    }

    return { success: true };
  }

  /**
   * Handles incoming WebSocket message
   */
  handleMessage(
    gameId: string,
    playerId: string,
    message: WebSocketMessage
  ): { success: boolean; error?: string } {
    switch (message.type) {
      case 'move':
        return this.handleMoveMessage(gameId, playerId, message.data as MoveRequest);
      default:
        return {
          success: false,
          error: 'Unknown message type',
        };
    }
  }

  /**
   * Handles move message
   */
  private handleMoveMessage(
    gameId: string,
    playerId: string,
    moveRequest: MoveRequest
  ): { success: boolean; error?: string } {
    const moveResponse = this.moveService.makeMove(gameId, playerId, moveRequest);
    const gameState = this.gameService.getGame(gameId);

    if (!gameState) {
      return {
        success: false,
        error: 'Game not found',
      };
    }

    // Send move response to the player who made the move
    const currentPlayer = gameState.players.white?.id === playerId
      ? gameState.players.white
      : gameState.players.black;

    if (currentPlayer) {
      this.connectionService.sendToPlayer(currentPlayer, {
        type: 'move',
        data: moveResponse,
      });
    }

    if (moveResponse.success) {
      // If game is over, notify both players
      if (moveResponse.gameOver && moveResponse.result) {
        this.connectionService.broadcastToGame(gameId, {
          type: 'game_over',
          data: moveResponse.result,
        });

        // Cleanup matchmaking for both players
        if (this.matchmakingClient && gameState.players.white && gameState.players.black) {
          this.matchmakingClient.cleanupPlayer(gameState.players.white.id);
          this.matchmakingClient.cleanupPlayer(gameState.players.black.id);
        }

        return { success: true };
      }

      // Send board state to the next player
      const nextPlayer = this.connectionService.getCurrentPlayer(gameId);
      if (nextPlayer) {
        this.sendBoardState(nextPlayer, moveResponse.boardState, gameState.currentTurn);
      }
    }

    return { success: moveResponse.success, error: moveResponse.error };
  }

  /**
   * Sends connection confirmation message
   */
  private sendConnectionConfirmation(gameId: string, player: Player): void {
    const gameState = this.gameService.getGame(gameId);
    if (!gameState) {
      return;
    }

    this.connectionService.sendToPlayer(player, {
      type: 'connection',
      data: {
        gameId,
        playerId: player.id,
        color: player.color,
        boardState: gameState.boardState,
        currentTurn: gameState.currentTurn,
      },
    });
  }

  /**
   * Sends board state to a player
   */
  private sendBoardState(
    player: Player,
    boardState: string,
    currentTurn: 'white' | 'black'
  ): void {
    this.connectionService.sendToPlayer(player, {
      type: 'board_state',
      data: {
        boardState,
        currentTurn,
        message: 'Your turn to move',
      },
    });
  }

  /**
   * Handles player disconnect
   */
  handleDisconnect(gameId: string, playerId: string): void {
    const color = this.connectionService.getPlayerColor(gameId, playerId);
    if (color) {
      this.connectionService.removePlayer(gameId, color);
    }

    // Cleanup player from matchmaking on disconnect
    if (this.matchmakingClient) {
      this.matchmakingClient.cleanupPlayer(playerId);
    }
  }

  /**
   * Sends error message to player
   */
  sendError(player: Player, errorMessage: string): void {
    this.connectionService.sendToPlayer(player, {
      type: 'error',
      data: { message: errorMessage },
    });
  }
}
