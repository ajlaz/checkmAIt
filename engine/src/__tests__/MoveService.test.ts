import { MoveService } from '../services/MoveService';
import { GameService } from '../services/GameService';
import { MoveRequest, Player } from '../types';
import { WebSocket } from 'ws';

describe('MoveService', () => {
  let gameService: GameService;
  let moveService: MoveService;

  beforeEach(() => {
    gameService = new GameService();
    moveService = new MoveService(gameService);
  });

  const createMockWebSocket = (): WebSocket => {
    return {
      readyState: WebSocket.OPEN,
      send: jest.fn(),
      close: jest.fn(),
    } as any;
  };

  const setupGameWithPlayers = (gameId: string) => {
    const gameState = gameService.createGame(gameId);
    gameState.players.white = {
      id: 'player-white',
      color: 'white',
      ws: createMockWebSocket(),
    };
    gameState.players.black = {
      id: 'player-black',
      color: 'black',
      ws: createMockWebSocket(),
    };
    return gameState;
  };

  describe('makeMove', () => {
    it('should successfully make a valid move', () => {
      const gameId = 'game-123';
      setupGameWithPlayers(gameId);

      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
      };

      const response = moveService.makeMove(gameId, 'player-white', moveRequest);

      expect(response.success).toBe(true);
      expect(response.move).toBeDefined();
      expect(response.move?.from).toBe('e2');
      expect(response.move?.to).toBe('e4');
      expect(response.move?.san).toBe('e4');
      expect(response.gameOver).toBe(false);
    });

    it('should reject move when it is not the player\'s turn', () => {
      const gameId = 'game-123';
      setupGameWithPlayers(gameId);

      const moveRequest: MoveRequest = {
        from: 'e7',
        to: 'e5',
      };

      const response = moveService.makeMove(gameId, 'player-black', moveRequest);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Not your turn');
    });

    it('should reject invalid move', () => {
      const gameId = 'game-123';
      setupGameWithPlayers(gameId);

      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e5', // Invalid - can't move pawn two squares forward to e5
      };

      const response = moveService.makeMove(gameId, 'player-white', moveRequest);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid move');
    });

    it('should return error for non-existent game', () => {
      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
      };

      const response = moveService.makeMove('non-existent', 'player-white', moveRequest);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Game not found');
      expect(response.boardState).toBe('');
    });

    it('should switch turns after successful move', () => {
      const gameId = 'game-123';
      setupGameWithPlayers(gameId);

      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
      };

      moveService.makeMove(gameId, 'player-white', moveRequest);

      const gameState = gameService.getGame(gameId);
      expect(gameState?.currentTurn).toBe('black');
    });

    it('should handle pawn promotion', () => {
      const gameId = 'game-123';
      const gameState = setupGameWithPlayers(gameId);

      const chess = gameService.getChessInstance(gameId);
      // Set up a position where white pawn can promote
      chess?.load('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
      gameService.updateBoardState(gameId, chess!.fen());
      // Reset turn to white after loading
      gameState.currentTurn = 'white';

      const moveRequest: MoveRequest = {
        from: 'a7',
        to: 'a8',
        promotion: 'q',
      };

      const response = moveService.makeMove(gameId, 'player-white', moveRequest);

      expect(response.success).toBe(true);
      expect(response.move?.promotion).toBe('q');
    });

    it('should detect checkmate and end game', () => {
      const gameId = 'game-123';
      const gameState = setupGameWithPlayers(gameId);

      // Perform Fool's mate - fastest checkmate
      moveService.makeMove(gameId, 'player-white', { from: 'f2', to: 'f3' });
      moveService.makeMove(gameId, 'player-black', { from: 'e7', to: 'e6' });
      moveService.makeMove(gameId, 'player-white', { from: 'g2', to: 'g4' });

      const response = moveService.makeMove(gameId, 'player-black', { from: 'd8', to: 'h4' }); // Checkmate

      expect(response.success).toBe(true);
      expect(response.gameOver).toBe(true);
      expect(response.result?.reason).toBe('checkmate');
      expect(response.result?.winner).toBe('black');
    });

    // Note: Stalemate detection is tested in GameService tests
    // The integration test here is skipped due to complexity of setting up valid stalemate positions
  });

  describe('validateMove', () => {
    it('should return true for valid move', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
      };

      const isValid = moveService.validateMove(gameId, moveRequest);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid move', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e5',
      };

      const isValid = moveService.validateMove(gameId, moveRequest);
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent game', () => {
      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
      };

      const isValid = moveService.validateMove('non-existent', moveRequest);
      expect(isValid).toBe(false);
    });

    it('should not modify game state', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const moveRequest: MoveRequest = {
        from: 'e2',
        to: 'e4',
      };

      const initialFen = gameService.getGame(gameId)?.boardState;
      moveService.validateMove(gameId, moveRequest);
      const afterFen = gameService.getGame(gameId)?.boardState;

      expect(initialFen).toBe(afterFen);
    });
  });

  describe('getLegalMoves', () => {
    it('should return all legal moves at start position', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const moves = moveService.getLegalMoves(gameId);

      expect(moves.length).toBe(20); // 20 possible moves at start
      expect(moves).toContain('e4');
      expect(moves).toContain('Nf3');
    });

    it('should return empty array for non-existent game', () => {
      const moves = moveService.getLegalMoves('non-existent');
      expect(moves).toEqual([]);
    });

    it('should return no moves when game is over', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const chess = gameService.getChessInstance(gameId);
      // Checkmate position
      chess?.load('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');

      const moves = moveService.getLegalMoves(gameId);
      expect(moves).toEqual([]);
    });
  });

  describe('getLegalMovesForSquare', () => {
    it('should return legal moves for a specific piece', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const moves = moveService.getLegalMovesForSquare(gameId, 'e2');

      expect(moves.length).toBe(2); // e3 and e4
      expect(moves).toContain('e3');
      expect(moves).toContain('e4');
    });

    it('should return empty array for square with no piece', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const moves = moveService.getLegalMovesForSquare(gameId, 'e4');
      expect(moves).toEqual([]);
    });

    it('should return empty array for non-existent game', () => {
      const moves = moveService.getLegalMovesForSquare('non-existent', 'e2');
      expect(moves).toEqual([]);
    });
  });

  describe('getMoveHistory', () => {
    it('should return empty array for new game', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const history = moveService.getMoveHistory(gameId);
      expect(history).toEqual([]);
    });

    it('should return move history after moves', () => {
      const gameId = 'game-123';
      setupGameWithPlayers(gameId);

      moveService.makeMove(gameId, 'player-white', { from: 'e2', to: 'e4' });
      moveService.makeMove(gameId, 'player-black', { from: 'e7', to: 'e5' });

      const history = moveService.getMoveHistory(gameId);
      expect(history.length).toBe(2);
      expect(history[0].from).toBe('e2');
      expect(history[0].to).toBe('e4');
      expect(history[1].from).toBe('e7');
      expect(history[1].to).toBe('e5');
    });

    it('should return empty array for non-existent game', () => {
      const history = moveService.getMoveHistory('non-existent');
      expect(history).toEqual([]);
    });
  });

  describe('isInCheck', () => {
    it('should return false at start position', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const inCheck = moveService.isInCheck(gameId);
      expect(inCheck).toBe(false);
    });

    it('should return true when king is in check', () => {
      const gameId = 'game-123';
      gameService.createGame(gameId);

      const chess = gameService.getChessInstance(gameId);
      // Simple position with black king in check from white queen on h5
      chess?.load('4k3/8/8/7Q/8/8/8/4K3 b - - 0 1');

      const inCheck = moveService.isInCheck(gameId);
      expect(inCheck).toBe(true);
    });

    it('should return false for non-existent game', () => {
      const inCheck = moveService.isInCheck('non-existent');
      expect(inCheck).toBe(false);
    });
  });
});
