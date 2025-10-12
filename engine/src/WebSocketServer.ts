import WebSocket, { WebSocketServer as WSServer } from 'ws';
import { GameManager } from './GameManager';
import { WebSocketMessage, MoveRequest, Player } from './types';
import { MatchmakingClient } from './MatchmakingClient';

export class WebSocketServer {
  private wss: WSServer;
  private gameManager: GameManager;
  private port: number;
  private matchmakingClient: MatchmakingClient | null = null;
  private gameIdToMatchId: Map<string, string> = new Map();

  constructor(gameManager: GameManager, port: number, matchmakingURL?: string) {
    this.gameManager = gameManager;
    this.port = port;
    this.wss = new WSServer({ port });

    // Initialize matchmaking client if URL is provided
    if (matchmakingURL) {
      this.matchmakingClient = new MatchmakingClient(matchmakingURL);
    }

    this.setupWebSocketServer();
  }

  setMatchId(gameId: string, matchId: string): void {
    this.gameIdToMatchId.set(gameId, matchId);
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);

      // Extract game ID and player ID from query parameters
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const gameId = url.searchParams.get('gameId');
      const playerId = url.searchParams.get('playerId');
      const color = url.searchParams.get('color') as 'white' | 'black' | null;

      if (!gameId || !playerId || !color) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Missing gameId, playerId, or color in query parameters' }
        }));
        ws.close();
        return;
      }

      // Register player
      const player: Player = {
        id: playerId,
        ws,
        color,
      };

      const added = this.gameManager.addPlayer(gameId, player);
      if (!added) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Game not found or unable to add player' }
        }));
        ws.close();
        return;
      }

      // Send connection confirmation
      const gameState = this.gameManager.getGame(gameId);
      if (gameState) {
        ws.send(JSON.stringify({
          type: 'connection',
          data: {
            gameId,
            playerId,
            color,
            boardState: gameState.boardState,
            currentTurn: gameState.currentTurn,
          }
        }));

        // If it's this player's turn, send board state
        if (gameState.currentTurn === color) {
          this.sendBoardState(ws, gameState.boardState, gameState.currentTurn);
        }
      }

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(gameId, playerId, message, ws);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }));
        }
      });

      ws.on('close', async () => {
        console.log(`Player ${playerId} disconnected from game ${gameId}`);

        // Cleanup player from matchmaking on disconnect
        if (this.matchmakingClient) {
          await this.matchmakingClient.cleanupPlayer(playerId);
        }
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);
      });
    });

    console.log(`WebSocket server listening on port ${this.port}`);
  }

  private handleMessage(gameId: string, playerId: string, message: WebSocketMessage, ws: WebSocket): void {
    switch (message.type) {
      case 'move':
        this.handleMove(gameId, playerId, message.data as MoveRequest);
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Unknown message type' }
        }));
    }
  }

  private handleMove(gameId: string, playerId: string, moveRequest: MoveRequest): void {
    const moveResponse = this.gameManager.makeMove(gameId, playerId, moveRequest);
    const gameState = this.gameManager.getGame(gameId);

    if (!gameState) {
      return;
    }

    // Send move response to the player who made the move
    const currentPlayer = gameState.players.white?.id === playerId
      ? gameState.players.white
      : gameState.players.black;

    if (currentPlayer?.ws) {
      currentPlayer.ws.send(JSON.stringify({
        type: 'move',
        data: moveResponse,
      }));
    }

    if (moveResponse.success) {
      // If game is over, notify both players
      if (moveResponse.gameOver && moveResponse.result) {
        this.broadcastGameOver(gameState, moveResponse.result);
        return;
      }

      // Send board state to the next player
      const nextPlayer = gameState.currentTurn === 'white'
        ? gameState.players.white
        : gameState.players.black;

      if (nextPlayer?.ws) {
        this.sendBoardState(nextPlayer.ws, moveResponse.boardState, gameState.currentTurn);
      }
    }
  }

  private sendBoardState(ws: WebSocket, boardState: string, currentTurn: 'white' | 'black'): void {
    ws.send(JSON.stringify({
      type: 'board_state',
      data: {
        boardState,
        currentTurn,
        message: 'Your turn to move',
      }
    }));
  }

  private async broadcastGameOver(gameState: any, result: any): Promise<void> {
    const message = JSON.stringify({
      type: 'game_over',
      data: result,
    });

    gameState.players.white?.ws?.send(message);
    gameState.players.black?.ws?.send(message);

    // Cleanup match from matchmaking on game end
    if (this.matchmakingClient) {
      const matchId = this.gameIdToMatchId.get(gameState.gameId);
      if (matchId) {
        await this.matchmakingClient.cleanupMatch(matchId);
        this.gameIdToMatchId.delete(gameState.gameId);
      }
    }
  }

  getPort(): number {
    return this.port;
  }

  close(): void {
    this.wss.close();
  }
}
