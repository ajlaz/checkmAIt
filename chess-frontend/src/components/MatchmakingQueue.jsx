import { useState, useEffect } from 'react';
import { joinMatchmakingQueue, getMatchmakingStatus, leaveMatchmakingQueue } from '../services/api';
import './MatchmakingQueue.css';

function MatchmakingQueue({ modelId, onMatchFound, onCancel }) {
  const [status, setStatus] = useState('joining'); // joining, queued, matched
  const [queuePosition, setQueuePosition] = useState(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(null);

  useEffect(() => {
    const joinQueue = async () => {
      try {
        const response = await joinMatchmakingQueue(modelId);
        if (response.status === 'matched') {
          handleMatchFound(response);
        } else {
          setStatus('queued');
          startPolling();
        }
      } catch (err) {
        setError('Failed to join queue: ' + (err.response?.data?.error || err.message));
        setStatus('error');
      }
    };

    joinQueue();

    return () => {
      if (polling) {
        clearInterval(polling);
      }
    };
  }, [modelId]);

  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await getMatchmakingStatus();

        if (response.status === 'matched') {
          clearInterval(interval);
          handleMatchFound(response);
        } else if (response.status === 'queued') {
          setQueuePosition(response.queuePosition);
        } else if (response.status === 'not_queued') {
          clearInterval(interval);
          setError('You are no longer in the queue');
          setStatus('error');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds

    setPolling(interval);
  };

  const handleMatchFound = (matchData) => {
    setStatus('matched');
    if (polling) {
      clearInterval(polling);
    }
    setTimeout(() => {
      onMatchFound({
        gameId: matchData.gameId,
        wsPort: matchData.wsPort,
        playerColor: matchData.playerColor,
        // Include the opponent model ID if it's provided by the server
        opponentModelId: matchData.opponentModelId || null
      });
    }, 1500);
  };

  const handleLeaveQueue = async () => {
    try {
      if (polling) {
        clearInterval(polling);
      }
      await leaveMatchmakingQueue();
      onCancel();
    } catch (err) {
      console.error('Error leaving queue:', err);
      onCancel();
    }
  };

  return (
    <div className="matchmaking-container">
      <div className="matchmaking-card">
        {status === 'joining' && (
          <>
            <div className="spinner"></div>
            <h2>Joining matchmaking queue...</h2>
          </>
        )}

        {status === 'queued' && (
          <>
            <div className="spinner"></div>
            <h2>Searching for opponent...</h2>
            <p className="queue-info">
              {queuePosition !== null && queuePosition >= 0
                ? `Queue position: ${queuePosition + 1}`
                : 'Waiting for match...'}
            </p>
            <button className="cancel-btn" onClick={handleLeaveQueue}>
              Cancel
            </button>
          </>
        )}

        {status === 'matched' && (
          <>
            <div className="success-icon">✓</div>
            <h2>Match Found!</h2>
            <p>Connecting to game...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h2>Error</h2>
            <p className="error">{error}</p>
            <button className="retry-btn" onClick={onCancel}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MatchmakingQueue;
