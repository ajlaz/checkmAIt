import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import gameSocket from '../services/gameSocket';
import { getBotMove } from '../utils/botRunner';
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
  const [moveHistory, setMoveHistory] = useState([]);
  const lastMoveTimeRef = useRef(0);
  const autoPlayIntervalRef = useRef(null);
  const isMyTurnRef = useRef(false);

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
          console.log('My assigned color:', gameData.playerColor, 'Current turn:', data.currentTurn);
          chessGame.load(data.boardState);
          setChessPosition(data.boardState);
          setCurrentTurn(data.currentTurn);
          isMyTurnRef.current = data.currentTurn === gameData.playerColor;
          console.log('Is it my turn after connection?', isMyTurnRef.current);
        });

        gameSocket.on('board_state', (data) => {
          console.log('Board state update:', data);
          chessGame.load(data.boardState);
          setChessPosition(data.boardState);
          setCurrentTurn(data.currentTurn);
          isMyTurnRef.current = data.currentTurn === gameData.playerColor;
        });

        gameSocket.on('move', (data) => {
          console.log('Move response:', data);
          if (data.success && data.boardState) {
            console.log('Updating board position to:', data.boardState);
            chessGame.load(data.boardState);
            setChessPosition(data.boardState);

            // Derive current turn from the FEN string (chess.js turn() returns 'w' or 'b')
            const turn = chessGame.turn() === 'w' ? 'white' : 'black';
            setCurrentTurn(turn);
            isMyTurnRef.current = turn === gameData.playerColor;
            console.log('Is my turn now?', isMyTurnRef.current, 'Turn:', turn, 'My color:', gameData.playerColor);

            // Add move to history
            if (data.move) {
              setMoveHistory(prev => [...prev, data.move.san]);
            }

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
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
      gameSocket.disconnect();
    };
  }, [gameData, user.id]);

  // Auto-play loop - checks every 100ms if it's our turn and enough time has passed
  useEffect(() => {
    if (connectionStatus !== 'connected' || !botCode || gameOver) {
      return;
    }

    autoPlayIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastMove = now - lastMoveTimeRef.current;

      // Check if it's our turn, we're not already thinking, and cooldown has passed
      if (isMyTurnRef.current && !isBotThinking && timeSinceLastMove >= 1000) {
        makeAutomaticMove();
      }
    }, 100);

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [connectionStatus, botCode, gameOver, isBotThinking]);

  const handleGameOver = (result) => {
    setGameOver(true);
    setGameResult(result);
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
    }
    setTimeout(() => {
      onGameEnd();
    }, 5000);
  };

  const makeAutomaticMove = async () => {
    if (gameOver || !botCode || isBotThinking) {
      return;
    }

    try {
      setIsBotThinking(true);
      console.log(`[${gameData.playerColor}] Starting move calculation at`, new Date().toLocaleTimeString());

      // Add delay before calling Piston API to avoid overloading
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get move from bot
      const [sourceSquare, targetSquare] = await getBotMove(botCode, chessGame.fen());
      console.log(`[${gameData.playerColor}] Bot chose move:`, sourceSquare, '->', targetSquare);

      // Validate move locally first
      const testGame = new Chess(chessGame.fen());
      const move = testGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (!move) {
        throw new Error('Invalid move returned by bot');
      }

      // Send move to server
      gameSocket.sendMove(sourceSquare, targetSquare, 'q');

      // Mark that it's no longer our turn (optimistic update)
      isMyTurnRef.current = false;

      // Update last move time AFTER sending to ensure proper spacing
      lastMoveTimeRef.current = Date.now();

    } catch (error) {
      console.error('Bot move error:', error);
      setErrorMessage(`Bot error: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 3000);

      // On error, we still need to wait before trying again
      lastMoveTimeRef.current = Date.now();
    } finally {
      setIsBotThinking(false);
    }
  };

  const chessboardOptions = {
    position: chessPosition,
    boardOrientation: gameData.playerColor,
    id: 'online-game',
    draggable: false,
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
        <p>You are: <strong>{gameData.playerColor}</strong></p>
        <p>Current turn: <strong>{currentTurn}</strong></p>
        <p>Bot status: <strong>{isBotThinking ? '🤔 Thinking...' : (isMyTurnRef.current ? '⚡ Ready' : '⏳ Waiting')}</strong></p>
        {moveHistory.length > 0 && (
          <div className="move-history">
            <p>Last move: {moveHistory[moveHistory.length - 1]}</p>
            <p>Total moves: {moveHistory.length}</p>
          </div>
        )}
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {gameOver && gameResult && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Result: {gameResult.winner === 'draw' ? 'Draw' : `${gameResult.winner} wins`}</p>
          <p>Reason: {gameResult.reason}</p>
          <p>Returning to model selection...</p>
        </div>
      )}

      <div className="board-wrapper">
        <Chessboard {...chessboardOptions} key={chessPosition} />
      </div>
    </div>
  );
}

export default ChessBoard;
