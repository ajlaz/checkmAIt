import { Chess } from 'chess.js';
import { GameState, MoveRequest, MoveResponse, GameResult, Player } from './types';

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private chessInstances: Map<string, Chess> = new Map();

  createGame(gameId: string): GameState {
    const chess = new Chess();
    const gameState: GameState = {
      gameId,
      players: {},
      boardState: chess.fen(),
      currentTurn: 'white',
      isGameOver: false,
    };

    this.games.set(gameId, gameState);
    this.chessInstances.set(gameId, chess);

    return gameState;
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  addPlayer(gameId: string, player: Player): boolean {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      return false;
    }

    if (player.color === 'white') {
      gameState.players.white = player;
    } else {
      gameState.players.black = player;
    }

    return true;
  }

  makeMove(gameId: string, playerId: string, moveRequest: MoveRequest): MoveResponse {
    const gameState = this.games.get(gameId);
    const chess = this.chessInstances.get(gameId);

    if (!gameState || !chess) {
      return {
        success: false,
        boardState: '',
        error: 'Game not found',
      };
    }

    // Verify it's the player's turn
    const currentPlayer = gameState.players[gameState.currentTurn];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return {
        success: false,
        boardState: chess.fen(),
        error: 'Not your turn',
      };
    }

    // Attempt the move
    try {
      const move = chess.move({
        from: moveRequest.from,
        to: moveRequest.to,
        promotion: moveRequest.promotion,
      });

      if (!move) {
        return {
          success: false,
          boardState: chess.fen(),
          error: 'Invalid move',
        };
      }

      // Update game state
      gameState.boardState = chess.fen();
      gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';

      // Check for game over conditions
      const gameResult = this.checkGameOver(gameId);
      if (gameResult) {
        gameState.isGameOver = true;
        gameState.result = gameResult;
      }

      return {
        success: true,
        move: {
          from: move.from,
          to: move.to,
          san: move.san,
          promotion: move.promotion,
        },
        boardState: chess.fen(),
        gameOver: gameState.isGameOver,
        result: gameState.result,
      };
    } catch (error) {
      return {
        success: false,
        boardState: chess.fen(),
        error: error instanceof Error ? error.message : 'Invalid move',
      };
    }
  }

  checkGameOver(gameId: string): GameResult | null {
    const chess = this.chessInstances.get(gameId);
    if (!chess) {
      return null;
    }

    if (chess.isCheckmate()) {
      // The player whose turn it is has been checkmated
      const winner = chess.turn() === 'w' ? 'black' : 'white';
      return {
        winner,
        reason: 'checkmate',
        timestamp: Date.now(),
      };
    }

    if (chess.isStalemate()) {
      return {
        winner: 'draw',
        reason: 'stalemate',
        timestamp: Date.now(),
      };
    }

    if (chess.isDraw()) {
      return {
        winner: 'draw',
        reason: 'draw',
        timestamp: Date.now(),
      };
    }

    return null;
  }

  removeGame(gameId: string): void {
    this.games.delete(gameId);
    this.chessInstances.delete(gameId);
  }

  getAllGames(): string[] {
    return Array.from(this.games.keys());
  }
}
