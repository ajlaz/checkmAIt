import { GameService } from '../services/GameService';
import { GameResult } from '../types';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
  });

  describe('createGame', () => {
    it('should create a new game with initial state', () => {
      const gameId = 'game-123';
      const gameState = gameService.createGame(gameId);

      expect(gameState.gameId).toBe(gameId);
      expect(gameState.currentTurn).toBe('white');
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.players).toEqual({});
      expect(gameState.boardState).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('should throw error when creating game with duplicate ID', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      expect(() => gameService.createGame(gameId)).toThrow(`Game with ID ${gameId} already exists`);
    });

    it('should create chess instance for the game', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const chess = gameService.getChessInstance(gameId);
      expect(chess).toBeDefined();
      expect(chess?.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  describe('getGame', () => {
    it('should return game state for existing game', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const gameState = gameService.getGame(gameId);
      expect(gameState).toBeDefined();
      expect(gameState?.gameId).toBe(gameId);
    });

    it('should return undefined for non-existent game', () => {
      const gameState = gameService.getGame('non-existent');
      expect(gameState).toBeUndefined();
    });
  });

  describe('getChessInstance', () => {
    it('should return chess instance for existing game', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const chess = gameService.getChessInstance(gameId);
      expect(chess).toBeDefined();
    });

    it('should return undefined for non-existent game', () => {
      const chess = gameService.getChessInstance('non-existent');
      expect(chess).toBeUndefined();
    });
  });

  describe('updateBoardState', () => {
    it('should update board state for existing game', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const newFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      gameService.updateBoardState(gameId, newFen);

      const gameState = gameService.getGame(gameId);
      expect(gameState?.boardState).toBe(newFen);
    });

    it('should throw error for non-existent game', () => {
      expect(() => gameService.updateBoardState('non-existent', 'some-fen')).toThrow('Game non-existent not found');
    });
  });

  describe('switchTurn', () => {
    it('should switch turn from white to black', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      gameService.switchTurn(gameId);

      const gameState = gameService.getGame(gameId);
      expect(gameState?.currentTurn).toBe('black');
    });

    it('should switch turn from black to white', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      gameService.switchTurn(gameId); // white -> black
      gameService.switchTurn(gameId); // black -> white

      const gameState = gameService.getGame(gameId);
      expect(gameState?.currentTurn).toBe('white');
    });

    it('should throw error for non-existent game', () => {
      expect(() => gameService.switchTurn('non-existent')).toThrow('Game non-existent not found');
    });
  });

  describe('endGame', () => {
    it('should mark game as over with result', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const result: GameResult = {
        winner: 'white',
        reason: 'checkmate',
        timestamp: Date.now(),
      };

      gameService.endGame(gameId, result);

      const gameState = gameService.getGame(gameId);
      expect(gameState?.isGameOver).toBe(true);
      expect(gameState?.result).toEqual(result);
    });

    it('should throw error for non-existent game', () => {
      const result: GameResult = {
        winner: 'white',
        reason: 'checkmate',
        timestamp: Date.now(),
      };

      expect(() => gameService.endGame('non-existent', result)).toThrow('Game non-existent not found');
    });
  });

  describe('checkGameOver', () => {
    it('should return null for ongoing game', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const result = gameService.checkGameOver(gameId);
      expect(result).toBeNull();
    });

    it('should detect checkmate', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const chess = gameService.getChessInstance(gameId);
      // Fool's mate
      chess?.move({ from: 'f2', to: 'f3' });
      chess?.move({ from: 'e7', to: 'e5' });
      chess?.move({ from: 'g2', to: 'g4' });
      chess?.move({ from: 'd8', to: 'h4' }); // Checkmate

      const result = gameService.checkGameOver(gameId);
      expect(result).not.toBeNull();
      expect(result?.reason).toBe('checkmate');
      expect(result?.winner).toBe('black');
    });

    it('should detect stalemate', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const chess = gameService.getChessInstance(gameId);
      // Set up a stalemate position
      chess?.load('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');

      const result = gameService.checkGameOver(gameId);
      expect(result).not.toBeNull();
      expect(result?.reason).toBe('stalemate');
      expect(result?.winner).toBe('draw');
    });

    it('should return null for non-existent game', () => {
      const result = gameService.checkGameOver('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('removeGame', () => {
    it('should remove game and chess instance', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      gameService.removeGame(gameId);

      expect(gameService.getGame(gameId)).toBeUndefined();
      expect(gameService.getChessInstance(gameId)).toBeUndefined();
    });

    it('should not throw error when removing non-existent game', () => {
      expect(() => gameService.removeGame('non-existent')).not.toThrow();
    });
  });

  describe('getAllGameIds', () => {
    it('should return empty array when no games exist', () => {
      const gameIds = gameService.getAllGameIds();
      expect(gameIds).toEqual([]);
    });

    it('should return all game IDs', () => {
      gameService.createGame('game-1');
      gameService.createGame('game-2');
      gameService.createGame('game-3');

      const gameIds = gameService.getAllGameIds();
      expect(gameIds).toHaveLength(3);
      expect(gameIds).toContain('game-1');
      expect(gameIds).toContain('game-2');
      expect(gameIds).toContain('game-3');
    });
  });

  describe('gameExists', () => {
    it('should return true for existing game', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      expect(gameService.gameExists(gameId)).toBe(true);
    });

    it('should return false for non-existent game', () => {
      expect(gameService.gameExists('non-existent')).toBe(false);
    });
  });
});
