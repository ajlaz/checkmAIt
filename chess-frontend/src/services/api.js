import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = async (username, email, password) => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Models APIs
export const getUserModels = async (userId) => {
  const response = await api.get(`/models/user/${userId}`);
  return response.data;
};

export const getModelById = async (modelId) => {
  const response = await api.get(`/models/${modelId}`);
  return response.data;
};

export const getModelCode = async (modelId) => {
  const response = await api.get(`/models/${modelId}`);
  return response.data.model; // Return just the model code
};

export const createModel = async (modelData) => {
  const response = await api.post('/models', modelData);
  return response.data;
};

export const updateModel = async (modelId, modelData) => {
  const response = await api.put(`/models/${modelId}`, modelData);
  return response.data;
};

// Matchmaking APIs
export const joinMatchmakingQueue = async (modelId) => {
  const response = await api.post('/matchmaking/join', { modelId });
  return response.data;
};

export const getMatchmakingStatus = async () => {
  const response = await api.get('/matchmaking/status');
  return response.data;
};

export const leaveMatchmakingQueue = async () => {
  const response = await api.post('/matchmaking/leave');
  return response.data;
};

// Piston API for code execution
const pistonAPI = axios.create({
  baseURL: 'https://emkc.org/api/v2/piston',
});

export const executeCode = async (language, sourceCode) => {
  const LANGUAGE_VERSIONS = {
    python: '3.10.0',
  };

  const response = await pistonAPI.post('/execute', {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [
      {
        content: sourceCode,
      },
    ],
  });
  return response.data;
};

export default api;
