import { startTestServer, stopTestServer, waitForMessage } from './setup';
import {
  setupGameWithPlayers,
  cleanupGame,
  createGame,
  connectPlayer,
} from './testUtils';

describe('Game Connection Integration Tests', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe('Game Creation and Player Connection', () => {
    it('should successfully create a game and return WebSocket port', async () => {
      const game = await createGame();

      expect(game.gameId).toBeDefined();
      expect(game.wsPort).toBeGreaterThan(0);
      expect(game.whitePlayerId).toBeDefined();
      expect(game.blackPlayerId).toBeDefined();

      await cleanupGame(game.gameId, []);
    });

    it('should allow white player to connect and receive initial board state', async () => {
      const game = await createGame();
      const white = await connectPlayer(
        game.wsPort,
        game.gameId,
        game.whitePlayerId,
        'white'
      );

      // Wait for connection message
      const connectionMsg = await waitForMessage(white.ws, 'connection');
      expect(connectionMsg.type).toBe('connection');
      expect(connectionMsg.data.gameId).toBe(game.gameId);
      expect(connectionMsg.data.color).toBe('white');
      expect(connectionMsg.data.boardState).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
      expect(connectionMsg.data.currentTurn).toBe('white');

      await cleanupGame(game.gameId, [white.ws]);
    });

    it('should allow black player to connect and receive initial board state', async () => {
      const game = await createGame();
      const black = await connectPlayer(
        game.wsPort,
        game.gameId,
        game.blackPlayerId,
        'black'
      );

      // Wait for connection message
      const connectionMsg = await waitForMessage(black.ws, 'connection');
      expect(connectionMsg.type).toBe('connection');
      expect(connectionMsg.data.gameId).toBe(game.gameId);
      expect(connectionMsg.data.color).toBe('black');
      expect(connectionMsg.data.boardState).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
      expect(connectionMsg.data.currentTurn).toBe('white');

      await cleanupGame(game.gameId, [black.ws]);
    });

    it('should allow both players to connect simultaneously', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // Wait for connection messages
      const [whiteConnection, blackConnection] = await Promise.all([
        waitForMessage(white.ws, 'connection'),
        waitForMessage(black.ws, 'connection'),
      ]);

      expect(whiteConnection.data.color).toBe('white');
      expect(blackConnection.data.color).toBe('black');
      expect(whiteConnection.data.gameId).toBe(game.gameId);
      expect(blackConnection.data.gameId).toBe(game.gameId);

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should send board_state message to white player indicating their turn', async () => {
      const game = await createGame();
      const white = await connectPlayer(
        game.wsPort,
        game.gameId,
        game.whitePlayerId,
        'white'
      );

      // Wait for connection first
      await waitForMessage(white.ws, 'connection');

      // Wait for board_state message
      const boardStateMsg = await waitForMessage(white.ws, 'board_state');
      expect(boardStateMsg.type).toBe('board_state');
      expect(boardStateMsg.data.currentTurn).toBe('white');
      expect(boardStateMsg.data.message).toContain('Your turn');

      await cleanupGame(game.gameId, [white.ws]);
    });

    it('should not send board_state to black player initially (not their turn)', async () => {
      const game = await createGame();
      const black = await connectPlayer(
        game.wsPort,
        game.gameId,
        game.blackPlayerId,
        'black'
      );

      // Wait for connection
      await waitForMessage(black.ws, 'connection');

      // Black should not receive board_state since it's not their turn
      await expect(
        waitForMessage(black.ws, 'board_state', 1000)
      ).rejects.toThrow('Timeout');

      await cleanupGame(game.gameId, [black.ws]);
    });
  });
});
