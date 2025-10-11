import { WebSocket } from 'ws';

export interface Player {
  id: string;
  ws: WebSocket;
  color: 'white' | 'black';
}

export interface GameState {
  gameId: string;
  players: {
    white?: Player;
    black?: Player;
  };
  boardState: string; // FEN notation
  currentTurn: 'white' | 'black';
  isGameOver: boolean;
  result?: GameResult;
}

export interface GameResult {
  winner?: 'white' | 'black' | 'draw';
  reason: 'checkmate' | 'stalemate' | 'draw' | 'resignation';
  timestamp: number;
}

export interface MoveRequest {
  from: string; // e.g., "e2"
  to: string;   // e.g., "e4"
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface MoveResponse {
  success: boolean;
  move?: {
    from: string;
    to: string;
    san: string; // Standard Algebraic Notation
    promotion?: string;
  };
  boardState: string; // FEN notation
  error?: string;
  gameOver?: boolean;
  result?: GameResult;
}

export interface WebSocketMessage {
  type: 'move' | 'board_state' | 'game_over' | 'error' | 'connection';
  data: any;
}

export interface CreateGameRequest {
  gameId: string;
  whitePlayerId: string;
  blackPlayerId: string;
}

export interface CreateGameResponse {
  success: boolean;
  gameId: string;
  wsPort: number;
  error?: string;
}
