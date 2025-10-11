import { startTestServer, stopTestServer } from './setup';
import { setupGameWithPlayers, cleanupGame, makeMove } from './testUtils';

describe('Illegal Moves Integration Tests', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe('Move Validation', () => {
    it('should reject move when player tries to move opponent piece', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // White tries to move black's piece
      const response = await makeMove(white.ws, 'e7', 'e5');

      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should reject move when it is not player turn', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // Black tries to move when it's white's turn
      const response = await makeMove(black.ws, 'e7', 'e5');

      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should reject invalid piece movement (bishop moving like knight)', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // White tries to move bishop like a knight (invalid)
      const response = await makeMove(white.ws, 'c1', 'e3');

      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should reject invalid pawn movement (moving 3 squares)', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // White tries to move pawn 3 squares (invalid)
      const response = await makeMove(white.ws, 'e2', 'e5');

      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should reject move to square occupied by own piece', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // White tries to move knight to square occupied by pawn
      const response = await makeMove(white.ws, 'g1', 'e2');

      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should reject move from empty square', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // White tries to move from empty square
      const response = await makeMove(white.ws, 'e4', 'e5');

      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should reject knight move that is not L-shaped', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // White tries to move knight in invalid pattern
      const response = await makeMove(white.ws, 'g1', 'g3');

      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should accept valid moves and reject subsequent invalid moves', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // White makes valid move
      const move1 = await makeMove(white.ws, 'e2', 'e4');
      expect(move1.data.success).toBe(true);

      // Wait for board state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Black makes valid move
      const move2 = await makeMove(black.ws, 'e7', 'e5');
      expect(move2.data.success).toBe(true);

      // Wait for board state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // White tries invalid move (pawn can't move backwards)
      const move3 = await makeMove(white.ws, 'e4', 'e3');
      expect(move3.data.success).toBe(false);
      expect(move3.data.error).toBeDefined();

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });
  });
});
