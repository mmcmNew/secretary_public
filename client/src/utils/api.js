import axios from 'axios';

function getUserTimeZone() {
  let tz = localStorage.getItem('user_time_zone');
  if (!tz) {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    localStorage.setItem('user_time_zone', tz);
  }
  return tz;
}

const api = axios.create({
  baseURL: '/',
});

// Добавляем интерцептор для Authorization
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('_auth');
  const type = localStorage.getItem('_auth_type') || 'Bearer';
  if (token) {
    config.headers['Authorization'] = `${type} ${token}`;
  }
  return config;
});

// Добавляем интерцептор для таймзоны
api.interceptors.request.use(config => {
  const tz = getUserTimeZone();
  if (config.method === 'get') {
    config.params = config.params || {};
    config.params.time_zone = tz;
  } else if (config.method === 'post' || config.method === 'put' || config.method === 'delete') {
    if (config.data && typeof config.data === 'object') {
      config.data.time_zone = tz;
    }
  }
  return config;
});

export default api;

export const apiGet = (url, config) => api.get(url, config);
export const apiPost = (url, body) => api.post(url, body);
export const apiPut = (url, body) => api.put(url, body);
export const apiDelete = (url, body) => api.delete(url, { data: body });

export async function clearAllCache() {
  // no-op placeholder for previous cache clearing
}
