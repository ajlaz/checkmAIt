import { WebSocketController } from '../controllers/WebSocketController';
import { GameService } from '../services/GameService';
import { MoveService } from '../services/MoveService';
import { ConnectionService } from '../services/ConnectionService';
import { Player, WebSocketMessage, MoveRequest } from '../types';
import { WebSocket } from 'ws';

// Mock services
jest.mock('../services/GameService');
jest.mock('../services/MoveService');
jest.mock('../services/ConnectionService');

describe('WebSocketController', () => {
  let wsController: WebSocketController;
  let mockGameService: jest.Mocked<GameService>;
  let mockMoveService: jest.Mocked<MoveService>;
  let mockConnectionService: jest.Mocked<ConnectionService>;

  const createMockWebSocket = (): WebSocket => {
    return {
      readyState: WebSocket.OPEN,
      send: jest.fn(),
      close: jest.fn(),
    } as any;
  };

  beforeEach(() => {
    // Create mock instances
    mockGameService = new GameService() as jest.Mocked<GameService>;
    mockMoveService = new MoveService(mockGameService) as jest.Mocked<MoveService>;
    mockConnectionService = new ConnectionService(mockGameService) as jest.Mocked<ConnectionService>;

    // Setup default mock implementations
    mockGameService.gameExists = jest.fn().mockReturnValue(true);
    mockGameService.getGame = jest.fn();
    mockConnectionService.registerPlayer = jest.fn().mockReturnValue(true);
    mockConnectionService.sendToPlayer = jest.fn();
    mockConnectionService.broadcastToGame = jest.fn();
    mockConnectionService.getCurrentPlayer = jest.fn();
    mockConnectionService.getPlayerColor = jest.fn();
    mockConnectionService.removePlayer = jest.fn();
    mockMoveService.makeMove = jest.fn();

    // Create controller with mocks
    wsController = new WebSocketController(
      mockGameService,
      mockMoveService,
      mockConnectionService
    );
  });

  describe('handleConnection', () => {
    it('should handle new connection successfully', () => {
      const ws = createMockWebSocket();
      const gameState = {
        gameId: 'game-123',
        players: {},
        boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        currentTurn: 'white' as const,
        isGameOver: false,
      };

      mockGameService.getGame.mockReturnValue(gameState);

      const result = wsController.handleConnection(ws, 'game-123', 'player-1', 'white');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockGameService.gameExists).toHaveBeenCalledWith('game-123');
      expect(mockConnectionService.registerPlayer).toHaveBeenCalled();
      expect(mockConnectionService.sendToPlayer).toHaveBeenCalled();
    });

    it('should return error when game does not exist', () => {
      mockGameService.gameExists.mockReturnValue(false);
      const ws = createMockWebSocket();

      const result = wsController.handleConnection(ws, 'non-existent', 'player-1', 'white');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not found');
      expect(mockConnectionService.registerPlayer).not.toHaveBeenCalled();
    });

    it('should return error when player registration fails', () => {
      mockConnectionService.registerPlayer.mockReturnValue(false);
      const ws = createMockWebSocket();

      const result = wsController.handleConnection(ws, 'game-123', 'player-1', 'white');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unable to register player');
    });

    it('should send board state when it is the player\'s turn', () => {
      const ws = createMockWebSocket();
      const gameState = {
        gameId: 'game-123',
        players: {},
        boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        currentTurn: 'white' as const,
        isGameOver: false,
      };

      mockGameService.getGame.mockReturnValue(gameState);

      wsController.handleConnection(ws, 'game-123', 'player-1', 'white');

      // Should send connection confirmation + board state (2 calls)
      expect(mockConnectionService.sendToPlayer).toHaveBeenCalledTimes(2);
    });

    it('should not send board state when it is not the player\'s turn', () => {
      const ws = createMockWebSocket();
      const gameState = {
        gameId: 'game-123',
        players: {},
        boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        currentTurn: 'white' as const,
        isGameOver: false,
      };

      mockGameService.getGame.mockReturnValue(gameState);

      wsController.handleConnection(ws, 'game-123', 'player-1', 'black');

      // Should only send connection confirmation (1 call)
      expect(mockConnectionService.sendToPlayer).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleMessage', () => {
    it('should handle move message successfully', () => {
      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
      };

      const message: WebSocketMessage = {
        type: 'move',
        data: moveRequest,
      };

      const gameState = {
        gameId: 'game-123',
        players: {
          white: {
            id: 'player-white',
            color: 'white' as const,
            ws: createMockWebSocket(),
          },
        },
        boardState: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        currentTurn: 'black' as const,
        isGameOver: false,
      };

      mockGameService.getGame.mockReturnValue(gameState);
      mockMoveService.makeMove.mockReturnValue({
        success: true,
        boardState: gameState.boardState,
        move: {
          from: 'e2',
          to: 'e4',
          san: 'e4',
        },
      });

      const result = wsController.handleMessage('game-123', 'player-white', message);

      expect(result.success).toBe(true);
      expect(mockMoveService.makeMove).toHaveBeenCalledWith('game-123', 'player-white', moveRequest);
    });

    it('should return error for unknown message type', () => {
      const message: WebSocketMessage = {
        type: 'unknown' as any,
        data: {},
      };

      const result = wsController.handleMessage('game-123', 'player-1', message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown message type');
    });

    it('should broadcast game over when game ends', () => {
      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
      };

      const message: WebSocketMessage = {
        type: 'move',
        data: moveRequest,
      };

      const gameState = {
        gameId: 'game-123',
        players: {
          white: {
            id: 'player-white',
            color: 'white' as const,
            ws: createMockWebSocket(),
          },
        },
        boardState: 'some-fen',
        currentTurn: 'black' as const,
        isGameOver: true,
        result: {
          winner: 'white' as const,
          reason: 'checkmate' as const,
          timestamp: Date.now(),
        },
      };

      mockGameService.getGame.mockReturnValue(gameState);
      mockMoveService.makeMove.mockReturnValue({
        success: true,
        boardState: gameState.boardState,
        gameOver: true,
        result: gameState.result,
      });

      wsController.handleMessage('game-123', 'player-white', message);

      expect(mockConnectionService.broadcastToGame).toHaveBeenCalledWith(
        'game-123',
        expect.objectContaining({
          type: 'game_over',
        })
      );
    });

    it('should send board state to next player after move', () => {
      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
      };

      const message: WebSocketMessage = {
        type: 'move',
        data: moveRequest,
      };

      const nextPlayer: Player = {
        id: 'player-black',
        color: 'black',
        ws: createMockWebSocket(),
      };

      const gameState = {
        gameId: 'game-123',
        players: {
          white: {
            id: 'player-white',
            color: 'white' as const,
            ws: createMockWebSocket(),
          },
          black: nextPlayer,
        },
        boardState: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        currentTurn: 'black' as const,
        isGameOver: false,
      };

      mockGameService.getGame.mockReturnValue(gameState);
      mockConnectionService.getCurrentPlayer.mockReturnValue(nextPlayer);
      mockMoveService.makeMove.mockReturnValue({
        success: true,
        boardState: gameState.boardState,
        move: {
          from: 'e2',
          to: 'e4',
          san: 'e4',
        },
      });

      wsController.handleMessage('game-123', 'player-white', message);

      expect(mockConnectionService.getCurrentPlayer).toHaveBeenCalledWith('game-123');
      expect(mockConnectionService.sendToPlayer).toHaveBeenCalledWith(
        nextPlayer,
        expect.objectContaining({
          type: 'board_state',
        })
      );
    });

    it('should return error when move fails', () => {
      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e5',
      };

      const message: WebSocketMessage = {
        type: 'move',
        data: moveRequest,
      };

      const gameState = {
        gameId: 'game-123',
        players: {
          white: {
            id: 'player-white',
            color: 'white' as const,
            ws: createMockWebSocket(),
          },
        },
        boardState: 'some-fen',
        currentTurn: 'white' as const,
        isGameOver: false,
      };

      mockGameService.getGame.mockReturnValue(gameState);
      mockMoveService.makeMove.mockReturnValue({
        success: false,
        boardState: gameState.boardState,
        error: 'Invalid move',
      });

      const result = wsController.handleMessage('game-123', 'player-white', message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid move');
    });
  });

  describe('handleDisconnect', () => {
    it('should remove player on disconnect', () => {
      mockConnectionService.getPlayerColor.mockReturnValue('white');

      wsController.handleDisconnect('game-123', 'player-white');

      expect(mockConnectionService.getPlayerColor).toHaveBeenCalledWith('game-123', 'player-white');
      expect(mockConnectionService.removePlayer).toHaveBeenCalledWith('game-123', 'white');
    });

    it('should handle disconnect when player not found', () => {
      mockConnectionService.getPlayerColor.mockReturnValue(undefined);

      wsController.handleDisconnect('game-123', 'unknown-player');

      expect(mockConnectionService.removePlayer).not.toHaveBeenCalled();
    });
  });

  describe('sendError', () => {
    it('should send error message to player', () => {
      const player: Player = {
        id: 'player-1',
        color: 'white',
        ws: createMockWebSocket(),
      };

      wsController.sendError(player, 'Test error message');

      expect(mockConnectionService.sendToPlayer).toHaveBeenCalledWith(
        player,
        {
          type: 'error',
          data: { message: 'Test error message' },
        }
      );
    });
  });
});
