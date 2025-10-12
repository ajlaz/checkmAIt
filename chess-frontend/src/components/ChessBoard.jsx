import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import gameSocket from '../services/gameSocket';
import { getBotMove } from '../utils/botRunner';
import './ChessBoard.css';

function ChessBoard({ gameData, onGameEnd, botCode }) {
  const { user } = useAuth();

  // State
  const [position, setPosition] = useState('start');
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Refs
  const chessRef = useRef(new Chess());
  const lastMoveTimeRef = useRef(0);
  const processingMoveRef = useRef(false);

  // Connect to game WebSocket
  useEffect(() => {
    let mounted = true;

    const connectToGame = async () => {
      try {
        await gameSocket.connect(
          gameData.wsPort,
          gameData.gameId,
          user.id,
          gameData.playerColor
        );

        // Handle connection confirmation
        gameSocket.on('connection', (data) => {
          console.log(`[${gameData.playerColor}] Connected:`, data);
          setPosition(data.boardState);
          setCurrentTurn(data.currentTurn);
          chessRef.current.load(data.boardState);
        });

        // Handle board state updates (opponent moved)
        gameSocket.on('board_state', (data) => {
          console.log(`[${gameData.playerColor}] Board state:`, data);
          setPosition(data.boardState);
          setCurrentTurn(data.currentTurn);
          chessRef.current.load(data.boardState);
        });

        // Handle move response (our move was processed)
        gameSocket.on('move', (data) => {
          console.log(`[${gameData.playerColor}] Move response:`, data);

          if (data.success && data.boardState) {
            setPosition(data.boardState);
            chessRef.current.load(data.boardState);

            // Add to move history
            if (data.move?.san) {
              setMoveHistory(prev => [...prev, data.move.san]);
            }

            // Check for game over
            if (data.gameOver && data.result) {
              handleGameOver(data.result);
            }
          } else if (data.error) {
            console.error(`[${gameData.playerColor}] Move error:`, data.error);
            setErrorMessage(data.error);
            setTimeout(() => setErrorMessage(''), 3000);
          }
        });

        // Handle game over
        gameSocket.on('game_over', (data) => {
          console.log(`[${gameData.playerColor}] Game over:`, data);
          handleGameOver(data);
        });

        // Handle errors
        gameSocket.on('error', (data) => {
          console.error(`[${gameData.playerColor}] Error:`, data);
          setErrorMessage(data.message || 'An error occurred');
        });

        // Handle disconnect
        gameSocket.setDisconnectHandler((message) => {
          console.log(`[${gameData.playerColor}] Disconnected:`, message);
          setErrorMessage(message);
          setTimeout(() => {
            if (mounted) onGameEnd();
          }, 3000);
        });

      } catch (error) {
        console.error('Failed to connect:', error);
        setErrorMessage('Failed to connect to game server');
      }
    };

    connectToGame();

    return () => {
      mounted = false;
      gameSocket.disconnect();
    };
  }, [gameData.wsPort, gameData.gameId, user.id, gameData.playerColor, onGameEnd]);

  // Bot auto-play loop
  useEffect(() => {
    if (gameOver || !botCode || processingMoveRef.current) {
      return;
    }

    const checkAndMakeMove = async () => {
      // Check if it's our turn
      const chess = new Chess(position);
      const boardTurn = chess.turn() === 'w' ? 'white' : 'black';

      // If it's not our turn, don't do anything
      if (boardTurn !== gameData.playerColor) {
        return;
      }

      // Enforce minimum time between moves
      const now = Date.now();
      const timeSinceLastMove = now - lastMoveTimeRef.current;
      if (timeSinceLastMove < 2000) {
        return;
      }

      // Make a move
      processingMoveRef.current = true;
      setIsBotThinking(true);

      try {
        console.log(`[${gameData.playerColor}] Calculating move...`);

        // Get move from bot
        const [from, to] = await getBotMove(botCode, position);
        console.log(`[${gameData.playerColor}] Bot chose: ${from} -> ${to}`);

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
    const interval = setInterval(checkAndMakeMove, 500);

    return () => clearInterval(interval);
  }, [position, gameData.playerColor, botCode, gameOver]);

  const handleGameOver = (result) => {
    console.log(`[${gameData.playerColor}] Handling game over:`, result);
    setGameOver(true);
    setGameResult(result);
    setTimeout(() => onGameEnd(), 5000);
  };

  if (gameOver && gameResult) {
    return (
      <div className="game-container">
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Result: {gameResult.winner === 'draw' ? 'Draw' : `${gameResult.winner} wins`}</p>
          <p>Reason: {gameResult.reason}</p>
          <p>Returning to model selection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-info">
        <h2>Chess Game - AI vs AI</h2>
        <p>You are: <strong>{gameData.playerColor}</strong></p>
        <p>Current turn: <strong>{currentTurn}</strong></p>
        <p>Bot status: <strong>{isBotThinking ? '🤔 Thinking...' : '⏳ Waiting'}</strong></p>
        {moveHistory.length > 0 && (
          <div className="move-history">
            <p>Last move: {moveHistory[moveHistory.length - 1]}</p>
            <p>Total moves: {moveHistory.length}</p>
          </div>
        )}
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="board-wrapper">
        <Chessboard
          key={position}
          position={position}
          boardOrientation={gameData.playerColor}
          arePiecesDraggable={false}
        />
      </div>
    </div>
  );
}

export default ChessBoard;
