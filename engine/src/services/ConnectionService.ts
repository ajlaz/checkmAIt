import { WebSocket } from 'ws';
import { Player, WebSocketMessage } from '../types';
import { GameService } from './GameService';

export class ConnectionService {
  constructor(private gameService: GameService) {}

  /**
   * Registers a player to a game
   */
  registerPlayer(gameId: string, player: Player): boolean {
    const gameState = this.gameService.getGame(gameId);
    if (!gameState) {
      return false;
    }

    if (player.color === 'white') {
      if (gameState.players.white) {
        return false; // White player already registered
      }
      gameState.players.white = player;
    } else {
      if (gameState.players.black) {
        return false; // Black player already registered
      }
      gameState.players.black = player;
    }

    return true;
  }

  /**
   * Gets a player by ID and color from a game
   */
  getPlayer(gameId: string, playerId: string, color: 'white' | 'black'): Player | undefined {
    const gameState = this.gameService.getGame(gameId);
    if (!gameState) {
      return undefined;
    }

    const player = gameState.players[color];
    return player?.id === playerId ? player : undefined;
  }

  /**
   * Removes a player from a game
   */
  removePlayer(gameId: string, color: 'white' | 'black'): void {
    const gameState = this.gameService.getGame(gameId);
    if (!gameState) {
      return;
    }

    if (color === 'white') {
      delete gameState.players.white;
    } else {
      delete gameState.players.black;
    }
  }

  /**
   * Checks if both players are connected to a game
   */
  areAllPlayersConnected(gameId: string): boolean {
    const gameState = this.gameService.getGame(gameId);
    if (!gameState) {
      return false;
    }

    return !!(gameState.players.white && gameState.players.black);
  }

  /**
   * Gets the opponent of a player
   */
  getOpponent(gameId: string, playerId: string): Player | undefined {
    const gameState = this.gameService.getGame(gameId);
    if (!gameState) {
      return undefined;
    }

    if (gameState.players.white?.id === playerId) {
      return gameState.players.black;
    } else if (gameState.players.black?.id === playerId) {
      return gameState.players.white;
    }

    return undefined;
  }

  /**
   * Sends a message to a specific player
   */
  sendToPlayer(player: Player, message: WebSocketMessage): void {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcasts a message to all players in a game
   */
  broadcastToGame(gameId: string, message: WebSocketMessage): void {
    const gameState = this.gameService.getGame(gameId);
    if (!gameState) {
      return;
    }

    if (gameState.players.white) {
      this.sendToPlayer(gameState.players.white, message);
    }

    if (gameState.players.black) {
      this.sendToPlayer(gameState.players.black, message);
    }
  }

  /**
   * Gets the current player whose turn it is
   */
  getCurrentPlayer(gameId: string): Player | undefined {
    const gameState = this.gameService.getGame(gameId);
    if (!gameState) {
      return undefined;
    }

    return gameState.players[gameState.currentTurn];
  }

  /**
   * Checks if a WebSocket connection is open
   */
  isConnectionOpen(ws: WebSocket): boolean {
    return ws.readyState === WebSocket.OPEN;
  }

  /**
   * Closes a player's connection
   */
  closeConnection(player: Player): void {
    if (this.isConnectionOpen(player.ws)) {
      player.ws.close();
    }
  }

  /**
   * Gets the player color by player ID
   */
  getPlayerColor(gameId: string, playerId: string): 'white' | 'black' | undefined {
    const gameState = this.gameService.getGame(gameId);
    if (!gameState) {
      return undefined;
    }

    if (gameState.players.white?.id === playerId) {
      return 'white';
    } else if (gameState.players.black?.id === playerId) {
      return 'black';
    }

    return undefined;
  }
}
