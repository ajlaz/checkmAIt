import express, { Express, Request, Response } from 'express';
import { GameManager } from './GameManager';
import { WebSocketServer } from './WebSocketServer';
import { CreateGameRequest, CreateGameResponse } from './types';

export class RestApiServer {
  private app: Express;
  private gameManager: GameManager;
  private wsServers: Map<string, WebSocketServer> = new Map();
  private baseWsPort: number = 8080;
  private currentWsPort: number = 8080;

  constructor(gameManager: GameManager, port: number = 3000) {
    this.app = express();
    this.gameManager = gameManager;
    this.setupMiddleware();
    this.setupRoutes();
    this.start(port);
  }

  private setupMiddleware(): void {
    this.app.use(express.json());

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Create a new game
    this.app.post('/game/create', (req: Request, res: Response) => {
      try {
        const { gameId, whitePlayerId, blackPlayerId }: CreateGameRequest = req.body;

        if (!gameId || !whitePlayerId || !blackPlayerId) {
          res.status(400).json({
            success: false,
            error: 'Missing required fields: gameId, whitePlayerId, blackPlayerId',
          } as CreateGameResponse);
          return;
        }

        // Create the game
        this.gameManager.createGame(gameId);

        // Create a dedicated WebSocket server for this game
        const wsPort = this.currentWsPort++;
        const wsServer = new WebSocketServer(this.gameManager, wsPort);
        this.wsServers.set(gameId, wsServer);

        res.json({
          success: true,
          gameId,
          wsPort,
        } as CreateGameResponse);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        } as CreateGameResponse);
      }
    });

    // Get game state
    this.app.get('/game/:gameId', (req: Request, res: Response) => {
      const { gameId } = req.params;
      const gameState = this.gameManager.getGame(gameId);

      if (!gameState) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      res.json({
        gameId: gameState.gameId,
        boardState: gameState.boardState,
        currentTurn: gameState.currentTurn,
        isGameOver: gameState.isGameOver,
        result: gameState.result,
      });
    });

    // Report game result (called when game ends)
    this.app.post('/game/:gameId/result', (req: Request, res: Response) => {
      const { gameId } = req.params;
      const gameState = this.gameManager.getGame(gameId);

      if (!gameState) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      if (!gameState.isGameOver || !gameState.result) {
        res.status(400).json({ error: 'Game is not over' });
        return;
      }

      // This endpoint is for the web server to acknowledge the game result
      // You can add additional logic here (e.g., cleanup, logging)
      res.json({
        success: true,
        result: gameState.result,
      });

      // Clean up after a delay
      setTimeout(() => {
        this.cleanupGame(gameId);
      }, 5000);
    });

    // Delete a game
    this.app.delete('/game/:gameId', (req: Request, res: Response) => {
      const { gameId } = req.params;
      this.cleanupGame(gameId);
      res.json({ success: true });
    });

    // List all active games
    this.app.get('/games', (req: Request, res: Response) => {
      const games = this.gameManager.getAllGames();
      res.json({ games });
    });
  }

  private cleanupGame(gameId: string): void {
    // Close WebSocket server for this game
    const wsServer = this.wsServers.get(gameId);
    if (wsServer) {
      wsServer.close();
      this.wsServers.delete(gameId);
    }

    // Remove game from manager
    this.gameManager.removeGame(gameId);
  }

  private start(port: number): void {
    this.app.listen(port, () => {
      console.log(`REST API server listening on port ${port}`);
    });
  }
}
