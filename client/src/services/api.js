import axios from 'axios';

export const TOKEN_KEY = 'mdp_token';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://micro-donation-platform.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
