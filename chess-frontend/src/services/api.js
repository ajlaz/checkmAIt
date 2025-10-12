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

// Rating APIs
export const updateRatings = async (winnerId, loserId, isDraw = false) => {
  const response = await api.put('/models/rating', {
    winner_id: winnerId,
    loser_id: loserId,
    is_draw: isDraw
  });
  return response.data;
};

// Local Python execution using Pyodide
import { executePythonCode } from './pyodideService';

export const executeCode = async (language, sourceCode) => {
  if (language !== 'python') {
    throw new Error(`Unsupported language: ${language}. Only Python is supported.`);
  }

  // Execute Python code locally using Pyodide
  return await executePythonCode(sourceCode);
};

export default api;
