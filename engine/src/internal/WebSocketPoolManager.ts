import { WebSocketServerManager } from './WebSocketServerManager';
import { WebSocketController } from '../controllers/WebSocketController';

export class WebSocketPoolManager {
  private servers: Map<string, WebSocketServerManager> = new Map();
  private wsController: WebSocketController;
  private basePort: number = 8080;
  private currentPort: number = 8080;

  constructor(wsController: WebSocketController, basePort: number = 8080) {
    this.wsController = wsController;
    this.basePort = basePort;
    this.currentPort = basePort;
  }

  /**
   * Creates a new WebSocket server for a game
   */
  createServerForGame(gameId: string): number {
    // Check if server already exists for this game
    if (this.servers.has(gameId)) {
      return this.servers.get(gameId)!.getPort();
    }

    // Create new WebSocket server
    const port = this.currentPort++;
    const server = new WebSocketServerManager(this.wsController, port);
    this.servers.set(gameId, server);

    return port;
  }

  /**
   * Removes WebSocket server for a game
   */
  removeServerForGame(gameId: string): void {
    const server = this.servers.get(gameId);
    if (server) {
      server.close();
      this.servers.delete(gameId);
    }
  }

  /**
   * Gets port for a game's WebSocket server
   */
  getPortForGame(gameId: string): number | undefined {
    const server = this.servers.get(gameId);
    return server?.getPort();
  }

  /**
   * Closes all WebSocket servers
   */
  closeAll(): void {
    for (const [gameId, server] of this.servers) {
      server.close();
    }
    this.servers.clear();
  }

  /**
   * Gets count of active servers
   */
  getActiveServerCount(): number {
    return this.servers.size;
  }
}
