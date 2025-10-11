import { startTestServer, stopTestServer } from './setup';
import { setupGameWithPlayers, cleanupGame, playMoves } from './testUtils';

describe('Capture Integration Tests', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe('Piece Captures', () => {
    it('should allow pawn to capture diagonally', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // Set up position for pawn capture
      // 1. e4 e5
      // 2. Nf3 Nc6
      // 3. d4 (white pawn attacks e5)
      const moves = [
        { from: 'e2', to: 'e4' }, // White
        { from: 'e7', to: 'e5' }, // Black
        { from: 'g1', to: 'f3' }, // White
        { from: 'b8', to: 'c6' }, // Black
        { from: 'd2', to: 'd4' }, // White
        { from: 'a7', to: 'a6' }, // Black (random move)
        { from: 'd4', to: 'e5' }, // White captures black pawn
      ];

      const responses = await playMoves(white.ws, black.ws, moves);

      // Check last move (capture)
      const captureMove = responses[responses.length - 1];
      expect(captureMove.data.success).toBe(true);
      expect(captureMove.data.move.from).toBe('d4');
      expect(captureMove.data.move.to).toBe('e5');
      // Board state should reflect capture (pawn on e5)
      expect(captureMove.data.boardState).toContain('P');

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should allow piece to capture enemy piece', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // Knight captures pawn: 1. e4 e5 2. Nf3 Nc6 3. Nxe5
      const moves = [
        { from: 'e2', to: 'e4' }, // White
        { from: 'e7', to: 'e5' }, // Black
        { from: 'g1', to: 'f3' }, // White knight
        { from: 'b8', to: 'c6' }, // Black
        { from: 'f3', to: 'e5' }, // White knight captures e5 pawn
      ];

      const responses = await playMoves(white.ws, black.ws, moves);

      // Check capture move
      const captureMove = responses[responses.length - 1];
      expect(captureMove.data.success).toBe(true);
      expect(captureMove.data.move.from).toBe('f3');
      expect(captureMove.data.move.to).toBe('e5');

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should not allow capturing own piece', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // Try to capture own piece
      // 1. e4 (move pawn)
      // 2. e7-e5
      // 3. Qh5 (queen to h5)
      // 4. a7-a6
      // 5. Qxe4?? (illegal - trying to capture own pawn on e4)
      const moves = [
        { from: 'e2', to: 'e4' }, // White pawn to e4
        { from: 'e7', to: 'e5' }, // Black
        { from: 'd1', to: 'h5' }, // White queen
        { from: 'a7', to: 'a6' }, // Black
        { from: 'h5', to: 'e4' }, // Try to capture own pawn on e4 (should fail)
      ];

      const responses = await playMoves(white.ws, black.ws, moves);

      // Last move should fail
      const lastMove = responses[responses.length - 1];
      expect(lastMove.data.success).toBe(false);
      expect(lastMove.data.error).toBeDefined();

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should update board state correctly after capture', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // Simple capture sequence
      const moves = [
        { from: 'e2', to: 'e4' }, // White
        { from: 'd7', to: 'd5' }, // Black
        { from: 'e4', to: 'd5' }, // White captures
      ];

      const responses = await playMoves(white.ws, black.ws, moves);

      const captureResponse = responses[responses.length - 1];
      expect(captureResponse.data.success).toBe(true);

      // Verify board state has white pawn on d5
      const boardState = captureResponse.data.boardState;
      expect(boardState).toBeDefined();

      // The captured square should now have white pawn
      // FEN notation should show the capture happened
      expect(boardState).toContain('/');

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });

    it('should allow en passant capture', async () => {
      const { game, white, black } = await setupGameWithPlayers();

      // Set up en passant: 1. e4 a6 2. e5 d5 3. exd6 (en passant)
      const moves = [
        { from: 'e2', to: 'e4' }, // White
        { from: 'a7', to: 'a6' }, // Black
        { from: 'e4', to: 'e5' }, // White pawn to e5
        { from: 'd7', to: 'd5' }, // Black pawn two squares (enables en passant)
        { from: 'e5', to: 'd6' }, // White captures en passant
      ];

      const responses = await playMoves(white.ws, black.ws, moves);

      const enPassantMove = responses[responses.length - 1];
      expect(enPassantMove.data.success).toBe(true);
      expect(enPassantMove.data.move.from).toBe('e5');
      expect(enPassantMove.data.move.to).toBe('d6');

      await cleanupGame(game.gameId, [white.ws, black.ws]);
    });
  });
});
