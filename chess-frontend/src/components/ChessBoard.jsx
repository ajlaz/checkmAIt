import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import gameSocket from '../services/gameSocket';
import { getBotMove } from '../utils/botRunner';
import { updateRatings } from '../services/api';
import './ChessBoard.css';

function ChessBoard({ gameData, onGameEnd, botCode }) {
  const { user } = useAuth();
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const lastMoveTimeRef = useRef(0);
  const processingMoveRef = useRef(false);

  useEffect(() => {
    const connectToGame = async () => {
      try {
        await gameSocket.connect(
          gameData.wsPort,
          gameData.gameId,
          user.id,
          gameData.playerColor
        );
        setConnectionStatus('connected');

        // Set up message handlers
        gameSocket.on('connection', (data) => {
          console.log('Connected to game:', data);
          chessGame.load(data.boardState);
          setChessPosition(data.boardState);
          setCurrentTurn(data.currentTurn);
        });

        gameSocket.on('board_state', (data) => {
          console.log('Board state update:', data);
          chessGame.load(data.boardState);
          setChessPosition(data.boardState);
          setCurrentTurn(data.currentTurn);
        });

        gameSocket.on('move', (data) => {
          console.log('Move response:', data);
          if (data.success && data.boardState) {
            chessGame.load(data.boardState);
            setChessPosition(data.boardState);

            if (data.gameOver && data.result) {
              handleGameOver(data.result);
            }
          } else if (data.error) {
            setErrorMessage(data.error);
            setTimeout(() => setErrorMessage(''), 3000);
          }
        });

        gameSocket.on('game_over', (data) => {
          console.log('Game over:', data);
          handleGameOver(data);
        });

        gameSocket.on('error', (data) => {
          console.error('Game error:', data);
          setErrorMessage(data.message || 'An error occurred');
        });

        gameSocket.setDisconnectHandler((message) => {
          setConnectionStatus('disconnected');
          setErrorMessage(message);
          setTimeout(() => {
            onGameEnd();
          }, 3000);
        });
      } catch (error) {
        console.error('Failed to connect to game:', error);
        setConnectionStatus('error');
        setErrorMessage('Failed to connect to game server');
      }
    };

    connectToGame();

    return () => {
      gameSocket.disconnect();
    };
  }, [gameData, user.id]);

  // Bot automation: automatically make moves when it's our turn
  useEffect(() => {
    if (!botCode || gameOver || processingMoveRef.current) {
      return;
    }

    const makeAutomatedMove = async () => {
      // Check if it's our turn
      if (currentTurn !== gameData.playerColor) {
        return;
      }

      // Enforce 1-second delay between moves
      const now = Date.now();
      const timeSinceLastMove = now - lastMoveTimeRef.current;
      if (timeSinceLastMove < 1000) {
        return;
      }

      processingMoveRef.current = true;
      setIsBotThinking(true);

      try {
        console.log(`[${gameData.playerColor}] Bot calculating move...`);

        // Get move from bot using current position
        const [from, to] = await getBotMove(botCode, chessPosition);
        console.log(`[${gameData.playerColor}] Bot move: ${from} -> ${to}`);

        // Send move to server
        gameSocket.sendMove(from, to, 'q');
        lastMoveTimeRef.current = Date.now();

      } catch (error) {
        console.error(`[${gameData.playerColor}] Bot error:`, error);
        setErrorMessage(`Bot error: ${error.message}`);
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        processingMoveRef.current = false;
        setIsBotThinking(false);
      }
    };

    // Check every 500ms if we should make a move
    const interval = setInterval(makeAutomatedMove, 500);

    return () => clearInterval(interval);
  }, [chessPosition, currentTurn, gameData.playerColor, botCode, gameOver]);

  const handleGameOver = async (result) => {
    setGameOver(true);
    setGameResult(result);

    // Only update ratings if we have valid game data with model IDs
    console.log('Game over with result:', result);
    console.log('Game data:', gameData);

    if (gameData.modelId && gameData.opponentModelId) {
      try {
        // Determine winner and loser based on game result
        let winnerId, loserId, isDraw = false;

        if (result.winner === 'draw') {
          // For draws, order doesn't matter, but we still need both IDs
          isDraw = true;
          winnerId = gameData.modelId;
          loserId = gameData.opponentModelId;
        } else if (result.winner === gameData.playerColor) {
          // Our model won
          winnerId = gameData.modelId;
          loserId = gameData.opponentModelId;
        } else {
          // Opponent model won
          winnerId = gameData.opponentModelId;
          loserId = gameData.modelId;
        }

        console.log(`Updating ratings: ${winnerId} vs ${loserId}, isDraw: ${isDraw}`);
        await updateRatings(winnerId, loserId, isDraw);
        console.log('Ratings updated successfully');
      } catch (error) {
        console.error('Failed to update ratings:', error);
      }
    }

    setTimeout(() => {
      onGameEnd();
    }, 5000);
  };

  // Disable manual piece dragging since bots play automatically
  const chessboardOptions = {
    position: chessPosition,
    boardOrientation: gameData.playerColor,
    arePiecesDraggable: false,
    id: 'online-game',
  };

  if (connectionStatus === 'connecting') {
    return (
      <div className="game-container">
        <div className="game-status">Connecting to game server...</div>
      </div>
    );
  }

  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    return (
      <div className="game-container">
        <div className="game-error">
          <h2>Connection Error</h2>
          <p>{errorMessage}</p>
          <p>Returning to matchmaking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-info">
        <h2>Chess Game - AI vs AI</h2>
        <p>You are playing as: <strong>{gameData.playerColor}</strong></p>
        <p>Current turn: <strong>{currentTurn}</strong></p>
        {currentTurn === gameData.playerColor && !gameOver && (
          <p className="your-turn">
            {isBotThinking ? 'Your bot is thinking...' : 'Your bot\'s turn'}
          </p>
        )}
        {currentTurn !== gameData.playerColor && !gameOver && (
          <p>Opponent's bot is playing...</p>
        )}
      </div>

      {gameOver && gameResult && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Result: {gameResult.winner === 'draw' ? 'Draw' : `${gameResult.winner} wins`}</p>
          <p>Reason: {gameResult.reason}</p>
        </div>
      )}

      <div className="board-wrapper">
        <Chessboard options={chessboardOptions} />
      </div>
    </div>
  );
}

export default ChessBoard;