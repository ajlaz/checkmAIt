import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import gameSocket from '../services/gameSocket';
import './ChessBoard.css';

function ChessBoard({ gameData, onGameEnd }) {
  const { user } = useAuth();
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleGameOver = (result) => {
    setGameOver(true);
    setGameResult(result);
    setTimeout(() => {
      onGameEnd();
    }, 5000);
  };

  const onPieceDrop = ({ sourceSquare, targetSquare }) => {
    if (!targetSquare || gameOver) {
      return false;
    }

    // Check if it's the player's turn
    if (currentTurn !== gameData.playerColor) {
      setErrorMessage("It's not your turn!");
      setTimeout(() => setErrorMessage(''), 2000);
      return false;
    }

    // Validate move locally first
    try {
      const testGame = new Chess(chessGame.fen());
      const move = testGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (!move) {
        return false;
      }

      // Send move to server
      gameSocket.sendMove(sourceSquare, targetSquare, 'q');

      // The board will update when we receive the response from the server
      return true;
    } catch {
      return false;
    }
  };

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    boardOrientation: gameData.playerColor,
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
        <h2>Chess Game</h2>
        <p>You are playing as: <strong>{gameData.playerColor}</strong></p>
        <p>Current turn: <strong>{currentTurn}</strong></p>
        {currentTurn === gameData.playerColor && !gameOver && (
          <p className="your-turn">It's your turn!</p>
        )}
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

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