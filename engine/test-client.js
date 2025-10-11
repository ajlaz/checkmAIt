const WebSocket = require('ws');
const { Chess } = require('chess.js');
const http = require('http');

// Test WebSocket client
const gameId = 'demo-game-1';
const whitePlayerId = 'alice';
const blackPlayerId = 'bob';

// Create a chess instance to track and display the board
const chess = new Chess();

// Track move count
let moveCount = 0;
const MAX_MOVES = 10;

// Helper function to display the board
function displayBoard(fen, lastMove) {
  chess.load(fen);
  console.log('\n' + '='.repeat(50));
  console.log(chess.ascii());
  console.log('='.repeat(50));
  if (lastMove) {
    console.log(`Last move: ${lastMove.from} -> ${lastMove.to} (${lastMove.san || ''})`);
  }
  console.log(`Turn: ${chess.turn() === 'w' ? 'White' : 'Black'}`);
  console.log(`Move count: ${moveCount}/${MAX_MOVES}`);
  console.log('='.repeat(50) + '\n');
}

// Helper function to get a random valid move
function getRandomMove(fen) {
  chess.load(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return null;
  }
  const randomMove = moves[Math.floor(Math.random() * moves.length)];
  return {
    from: randomMove.from,
    to: randomMove.to,
    promotion: randomMove.promotion
  };
}

// Helper function to make HTTP requests
function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Setup: Delete old game and create new one
async function setupGame() {
  console.log('=== WebSocket Test Client ===\n');
  console.log('Setting up fresh game...');

  // Delete old game if it exists
  await makeRequest('DELETE', `/game/${gameId}`);

  // Create new game
  const response = await makeRequest('POST', '/game/create', {
    gameId,
    whitePlayerId,
    blackPlayerId
  });

  console.log('Game created:', response);
  console.log('');

  // Start the test
  startTest();
}

function startTest() {
  // Connect white player
  const whiteWs = new WebSocket(`ws://localhost:8080?gameId=${gameId}&playerId=${whitePlayerId}&color=white`);

whiteWs.on('open', () => {
  console.log('✓ White player connected');
});

whiteWs.on('message', (data) => {
  const message = JSON.parse(data.toString());

  // Only display board when a move is successfully made (not on board_state updates)
  if (message.type === 'connection') {
    console.log('\n[White Player] Connected');
    displayBoard(message.data.boardState, null);
  } else if (message.type === 'move' && message.data.success) {
    moveCount++;
    console.log(`\n[Move ${moveCount}] White played: ${message.data.move.from} -> ${message.data.move.to} (${message.data.move.san})`);
    displayBoard(message.data.boardState, message.data.move);
  }

  // Check if game is over
  if (message.type === 'move' && message.data.gameOver) {
    console.log('\n🎉 Game Over!');
    console.log('Result:', message.data.result);
    setTimeout(() => {
      whiteWs.close();
      process.exit(0);
    }, 1000);
    return;
  }

  // Make a random move if it's white's turn and we haven't reached max moves
  if (message.type === 'board_state' && message.data.currentTurn === 'white' && moveCount < MAX_MOVES) {
    const randomMove = getRandomMove(message.data.boardState);

    if (randomMove) {
      whiteWs.send(JSON.stringify({
        type: 'move',
        data: randomMove
      }));
    } else {
      console.log('[White Player] No valid moves available');
    }
  } else if (moveCount >= MAX_MOVES && message.data.currentTurn === 'white') {
    console.log('\n✓ Reached maximum move count. Test complete!');
    setTimeout(() => {
      whiteWs.close();
      process.exit(0);
    }, 1000);
  }
});

whiteWs.on('error', (error) => {
  console.error('White player error:', error.message);
});

// Connect black player after a short delay
setTimeout(() => {
  const blackWs = new WebSocket(`ws://localhost:8080?gameId=${gameId}&playerId=${blackPlayerId}&color=black`);

  blackWs.on('open', () => {
    console.log('✓ Black player connected');
  });

  blackWs.on('message', (data) => {
    const message = JSON.parse(data.toString());

    // Only display board when a move is successfully made (not on board_state updates)
    if (message.type === 'connection') {
      console.log('\n[Black Player] Connected');
      displayBoard(message.data.boardState, null);
    } else if (message.type === 'move' && message.data.success) {
      moveCount++;
      console.log(`\n[Move ${moveCount}] Black played: ${message.data.move.from} -> ${message.data.move.to} (${message.data.move.san})`);
      displayBoard(message.data.boardState, message.data.move);
    }

    // Check if game is over
    if (message.type === 'move' && message.data.gameOver) {
      console.log('\n🎉 Game Over!');
      console.log('Result:', message.data.result);
      setTimeout(() => {
        whiteWs.close();
        blackWs.close();
        process.exit(0);
      }, 1000);
      return;
    }

    // Make a random move if it's black's turn and we haven't reached max moves
    if (message.type === 'board_state' && message.data.currentTurn === 'black' && moveCount < MAX_MOVES) {
      const randomMove = getRandomMove(message.data.boardState);

      if (randomMove) {
        blackWs.send(JSON.stringify({
          type: 'move',
          data: randomMove
        }));
      } else {
        console.log('[Black Player] No valid moves available');
      }
    } else if (moveCount >= MAX_MOVES && message.data.currentTurn === 'black') {
      console.log('\n✓ Reached maximum move count. Test complete!');
      setTimeout(() => {
        whiteWs.close();
        blackWs.close();
        process.exit(0);
      }, 1000);
    }
  });

  blackWs.on('error', (error) => {
    console.error('Black player error:', error.message);
  });
}, 1000);
}

// Start the application
setupGame();
