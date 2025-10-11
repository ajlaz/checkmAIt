import WebSocket from 'ws';
import {
  testConfig,
  makeHttpRequest,
  connectWebSocket,
  closeWebSocket,
} from './setup';

export interface GameSetup {
  gameId: string;
  wsPort: number;
  whitePlayerId: string;
  blackPlayerId: string;
}

export interface PlayerConnection {
  ws: WebSocket;
  playerId: string;
  color: 'white' | 'black';
}

let gameCounter = 0;

/**
 * Create a unique game ID for testing
 */
export function generateGameId(): string {
  return `test-game-${Date.now()}-${gameCounter++}`;
}

/**
 * Create a new game via HTTP API
 */
export async function createGame(
  gameId?: string,
  whitePlayerId?: string,
  blackPlayerId?: string
): Promise<GameSetup> {
  const id = gameId || generateGameId();
  const whiteId = whitePlayerId || 'white-player';
  const blackId = blackPlayerId || 'black-player';

  const response = await makeHttpRequest(
    'POST',
    `${testConfig.baseUrl}/game/create`,
    {
      gameId: id,
      whitePlayerId: whiteId,
      blackPlayerId: blackId,
    }
  );

  if (!response.success) {
    throw new Error(`Failed to create game: ${response.error}`);
  }

  return {
    gameId: id,
    wsPort: response.wsPort,
    whitePlayerId: whiteId,
    blackPlayerId: blackId,
  };
}

/**
 * Delete a game via HTTP API
 */
export async function deleteGame(gameId: string): Promise<void> {
  await makeHttpRequest('DELETE', `${testConfig.baseUrl}/game/${gameId}`);
}

/**
 * Connect a player to a game
 */
export async function connectPlayer(
  wsPort: number,
  gameId: string,
  playerId: string,
  color: 'white' | 'black'
): Promise<PlayerConnection> {
  const ws = await connectWebSocket(wsPort, gameId, playerId, color);

  return {
    ws,
    playerId,
    color,
  };
}

/**
 * Setup a complete game with both players connected
 */
export async function setupGameWithPlayers(): Promise<{
  game: GameSetup;
  white: PlayerConnection;
  black: PlayerConnection;
}> {
  const game = await createGame();
  const white = await connectPlayer(
    game.wsPort,
    game.gameId,
    game.whitePlayerId,
    'white'
  );
  const black = await connectPlayer(
    game.wsPort,
    game.gameId,
    game.blackPlayerId,
    'black'
  );

  return { game, white, black };
}

/**
 * Cleanup game and connections
 */
export async function cleanupGame(
  gameId: string,
  connections: WebSocket[]
): Promise<void> {
  // Close all WebSocket connections
  await Promise.all(connections.map((ws) => closeWebSocket(ws)));

  // Delete the game
  await deleteGame(gameId);
}

/**
 * Make a move and return the response
 */
export function makeMove(
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
 * Wait for board state update
 */
export function waitForBoardState(
  ws: WebSocket,
  timeout = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageHandler = (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'board_state') {
          clearTimeout(timeoutId);
          ws.off('message', messageHandler);
          resolve(message);
        }
      } catch (error) {
        // Ignore parse errors
      }
    };

    const timeoutId = setTimeout(() => {
      ws.off('message', messageHandler);
      reject(new Error('Timeout waiting for board state'));
    }, timeout);

    ws.on('message', messageHandler);
  });
}

/**
 * Play a sequence of moves
 */
export async function playMoves(
  whiteWs: WebSocket,
  blackWs: WebSocket,
  moves: Array<{ from: string; to: string; promotion?: string }>
): Promise<any[]> {
  const responses: any[] = [];

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const ws = i % 2 === 0 ? whiteWs : blackWs;

    // Make the move
    const response = await makeMove(ws, move.from, move.to, move.promotion);
    responses.push(response);

    // If move failed or game is over, stop
    if (!response.data.success || response.data.gameOver) {
      break;
    }

    // Wait a bit for board state to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return responses;
}
