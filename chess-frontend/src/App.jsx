import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import ModelSelection from './components/ModelSelection';
import ModelEditor from './components/ModelEditor';
import MatchmakingQueue from './components/MatchmakingQueue';
import ChessBoard from './components/ChessBoard';
import './App.css';

function App() {
  const { isAuthenticated } = useAuth();
  const [appState, setAppState] = useState('auth'); // auth, model-selection, editor, matchmaking, game
  const [selectedModel, setSelectedModel] = useState(null);
  const [gameData, setGameData] = useState(null);

  const handleModelSelected = (modelId) => {
    setSelectedModel(modelId);
    setAppState('matchmaking');
  };

  const handleMatchFound = (matchData) => {
    setGameData(matchData);
    setAppState('game');
  };

  const handleGameEnd = () => {
    setGameData(null);
    setSelectedModel(null);
    setAppState('model-selection');
  };

  const handleCancelMatchmaking = () => {
    setSelectedModel(null);
    setAppState('model-selection');
  };

  const handleCreateModel = () => {
    setAppState('editor');
  };

  const handleModelSaved = () => {
    setAppState('model-selection');
  };

  const handleCancelEditor = () => {
    setAppState('model-selection');
  };

  // Update app state when authentication changes
  if (!isAuthenticated && appState !== 'auth') {
    setAppState('auth');
    setSelectedModel(null);
    setGameData(null);
  } else if (isAuthenticated && appState === 'auth') {
    setAppState('model-selection');
  }

  return (
    <div className="App">
      {appState === 'auth' && <Auth />}
      {appState === 'model-selection' && (
        <ModelSelection
          onModelSelected={handleModelSelected}
          onCreateModel={handleCreateModel}
        />
      )}
      {appState === 'editor' && (
        <ModelEditor
          onModelSaved={handleModelSaved}
          onCancel={handleCancelEditor}
        />
      )}
      {appState === 'matchmaking' && (
        <MatchmakingQueue
          modelId={selectedModel}
          onMatchFound={handleMatchFound}
          onCancel={handleCancelMatchmaking}
        />
      )}
      {appState === 'game' && gameData && (
        <ChessBoard gameData={gameData} onGameEnd={handleGameEnd} />
      )}
    </div>
  );
}

export default App;
