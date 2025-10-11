import { GameController } from '../controllers/GameController';
import { GameService } from '../services/GameService';
import { CreateGameRequest } from '../types';

// Mock GameService
jest.mock('../services/GameService');

describe('GameController', () => {
  let gameController: GameController;
  let mockGameService: jest.Mocked<GameService>;
  let mockWsPortGenerator: jest.Mock;

  beforeEach(() => {
    // Create mock instances
    mockGameService = new GameService() as jest.Mocked<GameService>;
    mockWsPortGenerator = jest.fn((gameId: string) => 8080); // Now takes gameId parameter

    // Setup default mock implementations
    mockGameService.gameExists = jest.fn().mockReturnValue(false);
    mockGameService.createGame = jest.fn();
    mockGameService.getGame = jest.fn();
    mockGameService.removeGame = jest.fn();
    mockGameService.getAllGameIds = jest.fn().mockReturnValue([]);

    // Create controller with mocks
    gameController = new GameController(mockGameService, mockWsPortGenerator);
  });

  describe('createGame', () => {
    it('should create a game successfully', () => {
      const request: CreateGameRequest = {
        gameId: 'game-123',
        whitePlayerId: 'player-1',
        blackPlayerId: 'player-2',
      };

      mockWsPortGenerator.mockReturnValue(8080);

      const response = gameController.createGame(request);

      expect(response.success).toBe(true);
      expect(response.gameId).toBe('game-123');
      expect(response.wsPort).toBe(8080);
      expect(response.error).toBeUndefined();
      expect(mockGameService.createGame).toHaveBeenCalledWith('game-123');
      expect(mockWsPortGenerator).toHaveBeenCalledWith('game-123'); // Now expects gameId
    });

    it('should return error when gameId is missing', () => {
      const request: CreateGameRequest = {
        gameId: '',
        whitePlayerId: 'player-1',
        blackPlayerId: 'player-2',
      };

      const response = gameController.createGame(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Missing required fields');
      expect(mockGameService.createGame).not.toHaveBeenCalled();
    });

    it('should return error when whitePlayerId is missing', () => {
      const request: CreateGameRequest = {
        gameId: 'game-123',
        whitePlayerId: '',
        blackPlayerId: 'player-2',
      };

      const response = gameController.createGame(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Missing required fields');
      expect(mockGameService.createGame).not.toHaveBeenCalled();
    });

    it('should return error when blackPlayerId is missing', () => {
      const request: CreateGameRequest = {
        gameId: 'game-123',
        whitePlayerId: 'player-1',
        blackPlayerId: '',
      };

      const response = gameController.createGame(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Missing required fields');
      expect(mockGameService.createGame).not.toHaveBeenCalled();
    });

    it('should return error when game already exists', () => {
      mockGameService.gameExists.mockReturnValue(true);

      const request: CreateGameRequest = {
        gameId: 'game-123',
        whitePlayerId: 'player-1',
        blackPlayerId: 'player-2',
      };

      const response = gameController.createGame(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('already exists');
      expect(mockGameService.createGame).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', () => {
      mockGameService.createGame.mockImplementation(() => {
        throw new Error('Database error');
      });

      const request: CreateGameRequest = {
        gameId: 'game-123',
        whitePlayerId: 'player-1',
        blackPlayerId: 'player-2',
      };

      const response = gameController.createGame(request);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Database error');
    });
  });

  describe('getGameState', () => {
    it('should return game state for existing game', () => {
      const mockGameState = {
        gameId: 'game-123',
        players: {},
        boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        currentTurn: 'white' as const,
        isGameOver: false,
      };

      mockGameService.getGame.mockReturnValue(mockGameState);

      const result = gameController.getGameState('game-123');

      expect(result.gameId).toBe('game-123');
      expect(result.boardState).toBe(mockGameState.boardState);
      expect(result.currentTurn).toBe('white');
      expect(result.isGameOver).toBe(false);
      expect(mockGameService.getGame).toHaveBeenCalledWith('game-123');
    });

    it('should return error when game not found', () => {
      mockGameService.getGame.mockReturnValue(undefined);

      const result = gameController.getGameState('non-existent');

      expect(result.error).toBe('Game not found');
      expect(mockGameService.getGame).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('getGameResult', () => {
    it('should return game result when game is over', () => {
      const mockGameState = {
        gameId: 'game-123',
        players: {},
        boardState: 'some-fen',
        currentTurn: 'white' as const,
        isGameOver: true,
        result: {
          winner: 'white' as const,
          reason: 'checkmate' as const,
          timestamp: Date.now(),
        },
      };

      mockGameService.getGame.mockReturnValue(mockGameState);

      const result = gameController.getGameResult('game-123');

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockGameState.result);
    });

    it('should return error when game not found', () => {
      mockGameService.getGame.mockReturnValue(undefined);

      const result = gameController.getGameResult('non-existent');

      expect(result.error).toBe('Game not found');
    });

    it('should return error when game is not over', () => {
      const mockGameState = {
        gameId: 'game-123',
        players: {},
        boardState: 'some-fen',
        currentTurn: 'white' as const,
        isGameOver: false,
      };

      mockGameService.getGame.mockReturnValue(mockGameState);

      const result = gameController.getGameResult('game-123');

      expect(result.error).toBe('Game is not over');
    });
  });

  describe('deleteGame', () => {
    it('should delete game successfully', () => {
      const result = gameController.deleteGame('game-123');

      expect(result.success).toBe(true);
      expect(mockGameService.removeGame).toHaveBeenCalledWith('game-123');
    });

    it('should return success even if game does not exist', () => {
      const result = gameController.deleteGame('non-existent');

      expect(result.success).toBe(true);
      expect(mockGameService.removeGame).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('listGames', () => {
    it('should return empty array when no games exist', () => {
      mockGameService.getAllGameIds.mockReturnValue([]);

      const result = gameController.listGames();

      expect(result.games).toEqual([]);
      expect(mockGameService.getAllGameIds).toHaveBeenCalled();
    });

    it('should return all game IDs', () => {
      mockGameService.getAllGameIds.mockReturnValue(['game-1', 'game-2', 'game-3']);

      const result = gameController.listGames();

      expect(result.games).toEqual(['game-1', 'game-2', 'game-3']);
      expect(mockGameService.getAllGameIds).toHaveBeenCalled();
    });
  });
});
