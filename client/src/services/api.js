import axios from 'axios';

export const TOKEN_KEY = 'mdp_token';

// Without REACT_APP_API_URL set, default to the deployed API in a production
// build (e.g. a static host that didn't inject it) but to the local dev
// server otherwise — so a contributor who forgets to create .env.local gets
// a clearly-broken localhost call instead of silently hitting production.
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production'
    ? 'https://micro-donation-platform.onrender.com/api'
    : 'http://localhost:5050/api'
);

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
