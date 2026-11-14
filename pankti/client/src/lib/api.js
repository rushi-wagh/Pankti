import axios from 'axios';

export const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const api = axios.create({ baseURL: `${API}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qf-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
