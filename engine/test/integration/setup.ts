import { ChessEngineServer } from '../../src/cmd/server';
import http from 'http';
import WebSocket from 'ws';

/**
 * Global test server instance shared across all tests
 */
let server: ChessEngineServer | null = null;
const HTTP_PORT = 4000; // Use different port for tests
const WS_BASE_PORT = 9000;

export interface TestConfig {
  httpPort: number;
  wsBasePort: number;
  baseUrl: string;
}

export const testConfig: TestConfig = {
  httpPort: HTTP_PORT,
  wsBasePort: WS_BASE_PORT,
  baseUrl: `http://localhost:${HTTP_PORT}`,
};

/**
 * Start the chess engine server for integration tests
 */
export async function startTestServer(): Promise<void> {
  if (server) {
    return; // Server already running
  }

  server = new ChessEngineServer({
    httpPort: HTTP_PORT,
    wsBasePort: WS_BASE_PORT,
  });

  server.start();

  // Wait for server to be ready
  await waitForServer(testConfig.baseUrl);
}

/**
 * Stop the chess engine server
 */
export async function stopTestServer(): Promise<void> {
  if (server) {
    await server.stop();
    server = null;
    // Give it time to clean up
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Wait for server to be ready by polling the health endpoint
 */
async function waitForServer(baseUrl: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeHttpRequest('GET', `${baseUrl}/health`);
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error('Server failed to start within timeout');
}

/**
 * Make HTTP request helper
 */
export function makeHttpRequest(
  method: string,
  url: string,
  data?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options: http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Create a WebSocket connection and wait for it to open
 */
export function connectWebSocket(
  port: number,
  gameId: string,
  playerId: string,
  color: 'white' | 'black'
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(
      `ws://localhost:${port}?gameId=${gameId}&playerId=${playerId}&color=${color}`
    );

    // Buffer to store messages that arrive before listeners are attached
    const messageBuffer: WebSocket.Data[] = [];

    // Immediately attach a message listener to buffer messages
    const bufferHandler = (data: WebSocket.Data) => {
      messageBuffer.push(data);
    };
    ws.on('message', bufferHandler);

    // Store the buffer on the WebSocket object so waitForMessage can access it
    (ws as any).__messageBuffer = messageBuffer;
    (ws as any).__bufferHandler = bufferHandler;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * Wait for a specific message type from WebSocket
 */
export function waitForMessage(
  ws: WebSocket,
  messageType: string,
  timeout = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check if there's a buffer of messages that arrived before this listener
    const messageBuffer = (ws as any).__messageBuffer as WebSocket.Data[] | undefined;
    const bufferHandler = (ws as any).__bufferHandler;

    // First, check buffered messages
    if (messageBuffer) {
      for (let i = 0; i < messageBuffer.length; i++) {
        try {
          const message = JSON.parse(messageBuffer[i].toString());
          if (message.type === messageType) {
            // Found the message in buffer! Remove it and resolve
            messageBuffer.splice(i, 1);

            // If buffer is now empty, remove the buffer handler and clean up
            if (messageBuffer.length === 0 && bufferHandler) {
              ws.off('message', bufferHandler);
              delete (ws as any).__messageBuffer;
              delete (ws as any).__bufferHandler;
            }

            resolve(message);
            return;
          }
        } catch (error) {
          // Ignore parse errors
        }
      }

      // Message not in buffer, remove buffer handler and start listening normally
      if (bufferHandler) {
        ws.off('message', bufferHandler);
        delete (ws as any).__bufferHandler;
      }
    }

    const messageHandler = (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === messageType) {
          clearTimeout(timeoutId);
          ws.off('message', messageHandler);
          resolve(message);
        }
      } catch (error) {
        // Ignore parse errors, wait for next message
      }
    };

    const timeoutId = setTimeout(() => {
      ws.off('message', messageHandler);
      reject(new Error(`Timeout waiting for message type: ${messageType}`));
    }, timeout);

    ws.on('message', messageHandler);
  });
}

/**
 * Send a move and wait for the response
 */
export function sendMove(
  ws: WebSocket,
  from: string,
  to: string,
  promotion?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageHandler = (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'move') {
          clearTimeout(timeout);
          ws.off('message', messageHandler);
          resolve(message);
        }
      } catch (error) {
        // Ignore parse errors
      }
    };

    const timeout = setTimeout(() => {
      ws.off('message', messageHandler);
      reject(new Error('Move response timeout'));
    }, 5000);

    ws.on('message', messageHandler);

    ws.send(
      JSON.stringify({
        type: 'move',
        data: { from, to, promotion },
      })
    );
  });
}

/**
 * Close WebSocket connection gracefully
 */
export function closeWebSocket(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }

    ws.on('close', () => resolve());
    ws.close();

    // Force close after timeout
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.terminate();
      }
      resolve();
    }, 1000);
  });
}
