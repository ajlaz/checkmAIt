import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import ModelSelection from './components/ModelSelection';
import ModelEditor from './components/ModelEditor';
import MatchmakingQueue from './components/MatchmakingQueue';
import ChessBoard from './components/ChessBoard';
import { getModelCode } from './services/api';
import './App.css';

function App() {
  const { isAuthenticated } = useAuth();
  const [appState, setAppState] = useState('auth'); // auth, model-selection, editor, matchmaking, game
  const [selectedModel, setSelectedModel] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [modelCode, setModelCode] = useState(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  const handleModelSelected = (modelId) => {
    setSelectedModel(modelId);
    setAppState('matchmaking');
  };

  const handleMatchFound = async (matchData) => {
    setGameData(matchData);
    setIsLoadingModel(true);

    try {
      // Fetch the model code for the selected model
      const code = await getModelCode(selectedModel);
      setModelCode(code);
      setAppState('game');
    } catch (error) {
      console.error('Failed to fetch model code:', error);
      alert('Failed to load your AI model. Returning to model selection.');
      handleGameEnd();
    } finally {
      setIsLoadingModel(false);
    }
  };

  const handleGameEnd = () => {
    setGameData(null);
    setSelectedModel(null);
    setModelCode(null);
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
        isLoadingModel ? (
          <div className="loading-container">
            <p>Loading your AI model...</p>
          </div>
        ) : (
          <ChessBoard
            gameData={gameData}
            onGameEnd={handleGameEnd}
            botCode={modelCode}
          />
        )
      )}
    </div>
  );
}

export default App;
