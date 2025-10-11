import express, { Express, Request, Response } from 'express';
import { GameController } from '../controllers/GameController';
import http from 'http';

export class HttpServer {
  private app: Express;
  private gameController: GameController;
  private port: number;
  private server: http.Server | null = null;

  constructor(gameController: GameController, port: number = 3000) {
    this.app = express();
    this.gameController = gameController;
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
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
      const response = this.gameController.createGame(req.body);
      const statusCode = response.success ? 200 : 400;
      res.status(statusCode).json(response);
    });

    // Get game state
    this.app.get('/game/:gameId', (req: Request, res: Response) => {
      const result = this.gameController.getGameState(req.params.gameId);

      if ('error' in result) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    });

    // Report game result
    this.app.post('/game/:gameId/result', (req: Request, res: Response) => {
      const result = this.gameController.getGameResult(req.params.gameId);

      if ('error' in result) {
        const statusCode = result.error === 'Game not found' ? 404 : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.json(result);
    });

    // Delete a game
    this.app.delete('/game/:gameId', (req: Request, res: Response) => {
      const result = this.gameController.deleteGame(req.params.gameId);
      res.json(result);
    });

    // List all active games
    this.app.get('/games', (req: Request, res: Response) => {
      const result = this.gameController.listGames();
      res.json(result);
    });
  }

  start(): void {
    this.server = this.app.listen(this.port, () => {
      console.log(`HTTP API server listening on port ${this.port}`);
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.server = null;
          resolve();
        }
      });
    });
  }

  getApp(): Express {
    return this.app;
  }
}
