import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserModels } from '../services/api';
import './ModelSelection.css';

function ModelSelection({ onModelSelected, onCreateModel }) {
  const { user, logout } = useAuth();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await getUserModels(user.id);
        if (response.success && response.models) {
          setModels(response.models);
          if (response.models.length > 0) {
            setSelectedModel(response.models[0].id);
          }
        } else {
          setError('No models found. Please create a model first.');
        }
      } catch (err) {
        setError('Failed to load models: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [user.id]);

  const handleContinue = () => {
    if (selectedModel) {
      onModelSelected(selectedModel);
    }
  };

  return (
    <div className="model-selection-container">
      <div className="model-selection-card">
        <div className="header">
          <h2>Select Your Chess AI Model</h2>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>

        {loading && <div className="loading">Loading your models...</div>}

        {error && <div className="error">{error}</div>}

        {!loading && !error && models.length === 0 && (
          <div className="no-models">
            <p>You haven't created any models yet.</p>
            <p>Create your first chess AI model to start playing!</p>
            <button className="create-model-btn" onClick={onCreateModel}>
              Create Your First Model
            </button>
          </div>
        )}

        {!loading && models.length > 0 && (
          <>
            <div className="models-list">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`model-item ${selectedModel === model.id ? 'selected' : ''}`}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <div className="model-info">
                    <h3>{model.name}</h3>
                    <p>Rating: {model.rating}</p>
                  </div>
                  {selectedModel === model.id && <span className="checkmark">✓</span>}
                </div>
              ))}
            </div>
            <button
              className="continue-btn"
              onClick={handleContinue}
              disabled={!selectedModel}
            >
              Continue to Matchmaking
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ModelSelection;
