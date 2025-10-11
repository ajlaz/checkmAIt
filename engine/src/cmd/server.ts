import { GameService } from '../services/GameService';
import { MoveService } from '../services/MoveService';
import { ConnectionService } from '../services/ConnectionService';
import { GameController } from '../controllers/GameController';
import { WebSocketController } from '../controllers/WebSocketController';
import { HttpServer } from '../internal/HttpServer';
import { WebSocketPoolManager } from '../internal/WebSocketPoolManager';

/**
 * Server configuration
 */
interface ServerConfig {
  httpPort: number;
  wsBasePort: number;
}

/**
 * Main server class that bootstraps the entire application
 */
export class ChessEngineServer {
  // Services
  private gameService: GameService;
  private moveService: MoveService;
  private connectionService: ConnectionService;

  // Controllers
  private gameController: GameController;
  private wsController: WebSocketController;

  // Infrastructure
  private httpServer: HttpServer;
  private wsPoolManager: WebSocketPoolManager;

  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;

    // Initialize services
    this.gameService = new GameService();
    this.moveService = new MoveService(this.gameService);
    this.connectionService = new ConnectionService(this.gameService);

    // Initialize controllers
    this.wsController = new WebSocketController(
      this.gameService,
      this.moveService,
      this.connectionService
    );

    // WebSocket pool manager
    this.wsPoolManager = new WebSocketPoolManager(this.wsController, config.wsBasePort);

    // Game controller with port generator
    this.gameController = new GameController(
      this.gameService,
      (gameId: string) => this.wsPoolManager.createServerForGame(gameId)
    );

    // HTTP server
    this.httpServer = new HttpServer(this.gameController, config.httpPort);
  }

  /**
   * Starts the server
   */
  start(): void {
    console.log('Starting CheckmAIt Chess Engine...');

    this.httpServer.start();
    console.log('===========================================');
    console.log('Server started successfully!');
    console.log(`HTTP API: http://localhost:${this.config.httpPort}`);
    console.log(`WebSocket base port: ${this.config.wsBasePort}`);
    console.log('WebSocket servers will be created dynamically per game');
    console.log('===========================================');
  }

  /**
   * Stops the server gracefully
   */
  async stop(): Promise<void> {
    console.log('\nShutting down gracefully...');
    this.wsPoolManager.closeAll();
    await this.httpServer.close();
    console.log('Server stopped.');
  }

  /**
   * Gets the WebSocket pool manager
   */
  getWebSocketPoolManager(): WebSocketPoolManager {
    return this.wsPoolManager;
  }

  /**
   * Gets the game service (for testing or advanced usage)
   */
  getGameService(): GameService {
    return this.gameService;
  }
}
