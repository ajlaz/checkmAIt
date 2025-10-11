import WebSocket, { WebSocketServer as WSServer } from 'ws';
import { WebSocketController } from '../controllers/WebSocketController';

export class WebSocketServerManager {
  private wss: WSServer;
  private wsController: WebSocketController;
  private port: number;

  constructor(wsController: WebSocketController, port: number) {
    this.wsController = wsController;
    this.port = port;
    this.wss = new WSServer({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);

      // Extract parameters from query string
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const gameId = url.searchParams.get('gameId');
      const playerId = url.searchParams.get('playerId');
      const color = url.searchParams.get('color') as 'white' | 'black' | null;

      // Validate parameters
      if (!gameId || !playerId || !color) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Missing gameId, playerId, or color in query parameters' }
        }));
        ws.close();
        return;
      }

      // Handle connection via controller
      const connectionResult = this.wsController.handleConnection(ws, gameId, playerId, color);

      if (!connectionResult.success) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: connectionResult.error }
        }));
        ws.close();
        return;
      }

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.wsController.handleMessage(gameId, playerId, message);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }));
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log(`Player ${playerId} disconnected from game ${gameId}`);
        this.wsController.handleDisconnect(gameId, playerId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);
      });
    });

    console.log(`WebSocket server listening on port ${this.port}`);
  }

  getPort(): number {
    return this.port;
  }

  close(): void {
    this.wss.close();
  }
}
