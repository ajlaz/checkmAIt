import { ConnectionService } from '../services/ConnectionService';
import { GameService } from '../services/GameService';
import { Player, WebSocketMessage } from '../types';
import { WebSocket } from 'ws';

describe('ConnectionService', () => {
  let gameService: GameService;
  let connectionService: ConnectionService;

  beforeEach(() => {
    gameService = new GameService();
    connectionService = new ConnectionService(gameService);
  });

  const createMockWebSocket = (readyState: number = WebSocket.OPEN): WebSocket => {
    return {
      readyState,
      send: jest.fn(),
      close: jest.fn(),
    } as any;
  };

  const createMockPlayer = (id: string, color: 'white' | 'black'): Player => {
    return {
      id,
      color,
      ws: createMockWebSocket(),
    };
  };

  describe('registerPlayer', () => {
    it('should register white player successfully', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const player = createMockPlayer('player-1', 'white');
      const result = connectionService.registerPlayer(gameId, player);

      expect(result).toBe(true);
      const gameState = gameService.getGame(gameId);
      expect(gameState?.players.white).toEqual(player);
    });

    it('should register black player successfully', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const player = createMockPlayer('player-1', 'black');
      const result = connectionService.registerPlayer(gameId, player);

      expect(result).toBe(true);
      const gameState = gameService.getGame(gameId);
      expect(gameState?.players.black).toEqual(player);
    });

    it('should return false when game does not exist', () => {
      const player = createMockPlayer('player-1', 'white');
      const result = connectionService.registerPlayer('non-existent', player);

      expect(result).toBe(false);
    });

    it('should return false when white player already registered', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const player1 = createMockPlayer('player-1', 'white');
      const player2 = createMockPlayer('player-2', 'white');

      connectionService.registerPlayer(gameId, player1);
      const result = connectionService.registerPlayer(gameId, player2);

      expect(result).toBe(false);
      const gameState = gameService.getGame(gameId);
      expect(gameState?.players.white).toEqual(player1);
    });

    it('should return false when black player already registered', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const player1 = createMockPlayer('player-1', 'black');
      const player2 = createMockPlayer('player-2', 'black');

      connectionService.registerPlayer(gameId, player1);
      const result = connectionService.registerPlayer(gameId, player2);

      expect(result).toBe(false);
      const gameState = gameService.getGame(gameId);
      expect(gameState?.players.black).toEqual(player1);
    });
  });

  describe('getPlayer', () => {
    it('should return white player', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const player = createMockPlayer('player-1', 'white');
      connectionService.registerPlayer(gameId, player);

      const retrieved = connectionService.getPlayer(gameId, 'player-1', 'white');
      expect(retrieved).toEqual(player);
    });

    it('should return black player', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const player = createMockPlayer('player-1', 'black');
      connectionService.registerPlayer(gameId, player);

      const retrieved = connectionService.getPlayer(gameId, 'player-1', 'black');
      expect(retrieved).toEqual(player);
    });

    it('should return undefined when game does not exist', () => {
      const retrieved = connectionService.getPlayer('non-existent', 'player-1', 'white');
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined when player ID does not match', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const player = createMockPlayer('player-1', 'white');
      connectionService.registerPlayer(gameId, player);

      const retrieved = connectionService.getPlayer(gameId, 'wrong-id', 'white');
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined when player not registered', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const retrieved = connectionService.getPlayer(gameId, 'player-1', 'white');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('removePlayer', () => {
    it('should remove white player', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const player = createMockPlayer('player-1', 'white');
      connectionService.registerPlayer(gameId, player);

      connectionService.removePlayer(gameId, 'white');

      const gameState = gameService.getGame(gameId);
      expect(gameState?.players.white).toBeUndefined();
    });

    it('should remove black player', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const player = createMockPlayer('player-1', 'black');
      connectionService.registerPlayer(gameId, player);

      connectionService.removePlayer(gameId, 'black');

      const gameState = gameService.getGame(gameId);
      expect(gameState?.players.black).toBeUndefined();
    });

    it('should not throw when game does not exist', () => {
      expect(() => connectionService.removePlayer('non-existent', 'white')).not.toThrow();
    });

    it('should not throw when player not registered', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      expect(() => connectionService.removePlayer(gameId, 'white')).not.toThrow();
    });
  });

  describe('areAllPlayersConnected', () => {
    it('should return true when both players connected', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      connectionService.registerPlayer(gameId, createMockPlayer('player-1', 'white'));
      connectionService.registerPlayer(gameId, createMockPlayer('player-2', 'black'));

      expect(connectionService.areAllPlayersConnected(gameId)).toBe(true);
    });

    it('should return false when only white player connected', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      connectionService.registerPlayer(gameId, createMockPlayer('player-1', 'white'));

      expect(connectionService.areAllPlayersConnected(gameId)).toBe(false);
    });

    it('should return false when only black player connected', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      connectionService.registerPlayer(gameId, createMockPlayer('player-1', 'black'));

      expect(connectionService.areAllPlayersConnected(gameId)).toBe(false);
    });

    it('should return false when no players connected', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      expect(connectionService.areAllPlayersConnected(gameId)).toBe(false);
    });

    it('should return false when game does not exist', () => {
      expect(connectionService.areAllPlayersConnected('non-existent')).toBe(false);
    });
  });

  describe('getOpponent', () => {
    it('should return black player when given white player ID', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const whitePlayer = createMockPlayer('player-white', 'white');
      const blackPlayer = createMockPlayer('player-black', 'black');

      connectionService.registerPlayer(gameId, whitePlayer);
      connectionService.registerPlayer(gameId, blackPlayer);

      const opponent = connectionService.getOpponent(gameId, 'player-white');
      expect(opponent).toEqual(blackPlayer);
    });

    it('should return white player when given black player ID', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const whitePlayer = createMockPlayer('player-white', 'white');
      const blackPlayer = createMockPlayer('player-black', 'black');

      connectionService.registerPlayer(gameId, whitePlayer);
      connectionService.registerPlayer(gameId, blackPlayer);

      const opponent = connectionService.getOpponent(gameId, 'player-black');
      expect(opponent).toEqual(whitePlayer);
    });

    it('should return undefined when opponent not connected', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const whitePlayer = createMockPlayer('player-white', 'white');
      connectionService.registerPlayer(gameId, whitePlayer);

      const opponent = connectionService.getOpponent(gameId, 'player-white');
      expect(opponent).toBeUndefined();
    });

    it('should return undefined when player ID not found', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const opponent = connectionService.getOpponent(gameId, 'unknown-player');
      expect(opponent).toBeUndefined();
    });

    it('should return undefined when game does not exist', () => {
      const opponent = connectionService.getOpponent('non-existent', 'player-white');
      expect(opponent).toBeUndefined();
    });
  });

  describe('sendToPlayer', () => {
    it('should send message when connection is open', () => {
      const player = createMockPlayer('player-1', 'white');
      const message: WebSocketMessage = {
        type: 'board_state',
        data: { test: 'data' },
      };

      connectionService.sendToPlayer(player, message);

      expect(player.ws.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should not send message when connection is not open', () => {
      const player = createMockPlayer('player-1', 'white');
      const closedWs = createMockWebSocket(WebSocket.CLOSED);
      player.ws = closedWs;

      const message: WebSocketMessage = {
        type: 'board_state',
        data: { test: 'data' },
      };

      connectionService.sendToPlayer(player, message);

      expect(player.ws.send).not.toHaveBeenCalled();
    });
  });

  describe('broadcastToGame', () => {
    it('should send message to both players', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const whitePlayer = createMockPlayer('player-white', 'white');
      const blackPlayer = createMockPlayer('player-black', 'black');

      connectionService.registerPlayer(gameId, whitePlayer);
      connectionService.registerPlayer(gameId, blackPlayer);

      const message: WebSocketMessage = {
        type: 'game_over',
        data: { winner: 'white' },
      };

      connectionService.broadcastToGame(gameId, message);

      expect(whitePlayer.ws.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(blackPlayer.ws.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should only send to connected players', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const whitePlayer = createMockPlayer('player-white', 'white');
      connectionService.registerPlayer(gameId, whitePlayer);

      const message: WebSocketMessage = {
        type: 'game_over',
        data: { winner: 'white' },
      };

      connectionService.broadcastToGame(gameId, message);

      expect(whitePlayer.ws.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should not throw when game does not exist', () => {
      const message: WebSocketMessage = {
        type: 'game_over',
        data: { winner: 'white' },
      };

      expect(() => connectionService.broadcastToGame('non-existent', message)).not.toThrow();
    });
  });

  describe('getCurrentPlayer', () => {
    it('should return white player when it is white\'s turn', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const whitePlayer = createMockPlayer('player-white', 'white');
      connectionService.registerPlayer(gameId, whitePlayer);

      const current = connectionService.getCurrentPlayer(gameId);
      expect(current).toEqual(whitePlayer);
    });

    it('should return black player when it is black\'s turn', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const blackPlayer = createMockPlayer('player-black', 'black');
      connectionService.registerPlayer(gameId, blackPlayer);
      gameService.switchTurn(gameId);

      const current = connectionService.getCurrentPlayer(gameId);
      expect(current).toEqual(blackPlayer);
    });

    it('should return undefined when current player not connected', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const current = connectionService.getCurrentPlayer(gameId);
      expect(current).toBeUndefined();
    });

    it('should return undefined when game does not exist', () => {
      const current = connectionService.getCurrentPlayer('non-existent');
      expect(current).toBeUndefined();
    });
  });

  describe('isConnectionOpen', () => {
    it('should return true when connection is open', () => {
      const ws = createMockWebSocket(WebSocket.OPEN);
      expect(connectionService.isConnectionOpen(ws)).toBe(true);
    });

    it('should return false when connection is closed', () => {
      const ws = createMockWebSocket(WebSocket.CLOSED);
      expect(connectionService.isConnectionOpen(ws)).toBe(false);
    });

    it('should return false when connection is connecting', () => {
      const ws = createMockWebSocket(WebSocket.CONNECTING);
      expect(connectionService.isConnectionOpen(ws)).toBe(false);
    });
  });

  describe('closeConnection', () => {
    it('should close connection when it is open', () => {
      const player = createMockPlayer('player-1', 'white');

      connectionService.closeConnection(player);

      expect(player.ws.close).toHaveBeenCalled();
    });

    it('should not throw when connection already closed', () => {
      const player = createMockPlayer('player-1', 'white');
      const closedWs = createMockWebSocket(WebSocket.CLOSED);
      player.ws = closedWs;

      expect(() => connectionService.closeConnection(player)).not.toThrow();
    });
  });

  describe('getPlayerColor', () => {
    it('should return white for white player', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const whitePlayer = createMockPlayer('player-white', 'white');
      connectionService.registerPlayer(gameId, whitePlayer);

      const color = connectionService.getPlayerColor(gameId, 'player-white');
      expect(color).toBe('white');
    });

    it('should return black for black player', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const blackPlayer = createMockPlayer('player-black', 'black');
      connectionService.registerPlayer(gameId, blackPlayer);

      const color = connectionService.getPlayerColor(gameId, 'player-black');
      expect(color).toBe('black');
    });

    it('should return undefined when player not found', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const color = connectionService.getPlayerColor(gameId, 'unknown-player');
      expect(color).toBeUndefined();
    });

    it('should return undefined when game does not exist', () => {
      const color = connectionService.getPlayerColor('non-existent', 'player-white');
      expect(color).toBeUndefined();
    });
  });
});
