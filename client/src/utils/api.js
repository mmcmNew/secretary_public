import axios from 'axios';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';

// Создаём экземпляр axios
const instance = axios.create();

// Интерцептор для автоматического добавления Authorization
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('_auth');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default async function api(url, method = 'GET', data = null) {
  const config = { url, method };
  if (data !== null) {
    config.headers = { 'Content-Type': 'application/json' };
    config.data = data;
  }
  const res = await instance(config);
  return res.data;
}

export const apiGet = (url) => api(url);
export const apiPost = (url, body) => api(url, 'POST', body);
export const apiPut = (url, body) => api(url, 'PUT', body);
export const apiDelete = (url, body) => api(url, 'DELETE', body);

export async function clearAllCache() {
  // no-op placeholder for previous cache clearing
}
