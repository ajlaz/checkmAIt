import { ChessEngineServer } from './cmd/server';

// Configuration from environment variables
const HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3000;
const WS_BASE_PORT = process.env.WS_BASE_PORT ? parseInt(process.env.WS_BASE_PORT) : 8080;

// Create and start the server
const server = new ChessEngineServer({
  httpPort: HTTP_PORT,
  wsBasePort: WS_BASE_PORT,
});

server.start();

// Graceful shutdown
const shutdown = () => {
  server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
