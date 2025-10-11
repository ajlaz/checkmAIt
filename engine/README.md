# CheckmAIt Chess Engine

A Node.js/TypeScript chess engine with WebSocket support for real-time multiplayer games.

## Features

- **Real-time gameplay** via WebSocket connections
- **Move validation** using chess.js library
- **REST API** for game management
- **Dynamic WebSocket pools** - each game gets its own WebSocket server
- **Game state management** with automatic checkmate/stalemate detection
- **TypeScript** for type safety

## Architecture

The engine consists of several key components:

- **GameManager**: Manages game state and chess logic using chess.js
- **WebSocketServer**: Handles real-time communication with players
- **RestApiServer**: REST API for web server communication
- **Types**: TypeScript interfaces for type safety

## Installation

```bash
npm install
```

## Running the Engine

### Development mode (with hot reload):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

## Configuration

Set environment variables:
- `REST_API_PORT` (default: 3000) - Port for REST API server

## API Endpoints

### REST API (default: port 3000)

#### Health Check
```
GET /health
```

#### Create a Game
```
POST /game/create
Content-Type: application/json

{
  "gameId": "unique-game-id",
  "whitePlayerId": "player1-id",
  "blackPlayerId": "player2-id"
}

Response:
{
  "success": true,
  "gameId": "unique-game-id",
  "wsPort": 8080
}
```

#### Get Game State
```
GET /game/:gameId

Response:
{
  "gameId": "unique-game-id",
  "boardState": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "currentTurn": "white",
  "isGameOver": false,
  "result": null
}
```

#### Report Game Result
```
POST /game/:gameId/result

Response:
{
  "success": true,
  "result": {
    "winner": "white",
    "reason": "checkmate",
    "timestamp": 1234567890
  }
}
```

#### Delete Game
```
DELETE /game/:gameId
```

#### List All Games
```
GET /games

Response:
{
  "games": ["game-id-1", "game-id-2"]
}
```

### WebSocket API (dynamic ports starting at 8080)

#### Connect to a Game
```
ws://localhost:{wsPort}?gameId={gameId}&playerId={playerId}&color={white|black}
```

#### Message Types

**Connection Confirmation:**
```json
{
  "type": "connection",
  "data": {
    "gameId": "game-id",
    "playerId": "player-id",
    "color": "white",
    "boardState": "rnbqkbnr/...",
    "currentTurn": "white"
  }
}
```

**Board State (when it's your turn):**
```json
{
  "type": "board_state",
  "data": {
    "boardState": "rnbqkbnr/...",
    "currentTurn": "white",
    "message": "Your turn to move"
  }
}
```

**Make a Move (send to server):**
```json
{
  "type": "move",
  "data": {
    "from": "e2",
    "to": "e4",
    "promotion": "q"
  }
}
```

**Move Response:**
```json
{
  "type": "move",
  "data": {
    "success": true,
    "move": {
      "from": "e2",
      "to": "e4",
      "san": "e4"
    },
    "boardState": "rnbqkbnr/...",
    "gameOver": false
  }
}
```

**Game Over:**
```json
{
  "type": "game_over",
  "data": {
    "winner": "white",
    "reason": "checkmate",
    "timestamp": 1234567890
  }
}
```

**Error:**
```json
{
  "type": "error",
  "data": {
    "message": "Error description"
  }
}
```

## Move Format

Moves use standard chess notation:
- **from**: Starting square (e.g., "e2")
- **to**: Destination square (e.g., "e4")
- **promotion**: Optional piece to promote to ("q", "r", "b", "n")

## Game Flow

1. Web server calls `POST /game/create` to create a new game
2. Engine responds with WebSocket port for that game
3. Players connect to WebSocket server with their credentials
4. Engine sends board state to the player whose turn it is
5. Player sends move via WebSocket
6. Engine validates move, updates game state
7. Engine sends board state to next player
8. When game ends (checkmate/stalemate), engine notifies both players
9. Web server can call `POST /game/:gameId/result` to acknowledge result

## Example Usage

### Creating a Game

```bash
curl -X POST http://localhost:3000/game/create \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "game-123",
    "whitePlayerId": "player1",
    "blackPlayerId": "player2"
  }'
```

### Connecting with WebSocket (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:8080?gameId=game-123&playerId=player1&color=white');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);

  if (message.type === 'board_state') {
    // Your turn - make a move
    ws.send(JSON.stringify({
      type: 'move',
      data: {
        from: 'e2',
        to: 'e4'
      }
    }));
  }
};
```

## Technologies Used

- **Node.js** - Runtime environment
- **TypeScript** - Type-safe development
- **Express** - REST API framework
- **ws** - WebSocket library
- **chess.js** - Chess logic and validation

## License

MIT
