import axios from 'axios';

function getApiBaseUrl(): string {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  if (!url.includes('/api/v1')) {
    url = url.replace(/\/+$/, '') + '/api/v1';
  }
  return url;
}

const API_BASE = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('umis_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('umis_token');
      localStorage.removeItem('umis_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
