import axios from 'axios';
import { setupCache, buildWebStorage } from 'axios-cache-interceptor';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const cachedAxios = setupCache(axios.create(), {
  storage: buildWebStorage(window.localStorage),
  interpretHeader: true,
  ttl: 0, // отключено TTL, ты сам управляешь кешем
});

// Уведомления о кэше
cachedAxios.interceptors.response.use((response) => {
  if (response.cached) {
    console.log('CLIENT: Ответ из КЭША для', response.config.url);
  } else {
    console.log('CLIENT: Ответ с сервера для', response.config.url);
  }
  return response;
});

// Обработка 401 и обновление токена
cachedAxios.interceptors.response.use(null, async (error) => {
  const originalRequest = error.config;

  if (
    error.response?.status === 401 &&
    !originalRequest._retry &&
    localStorage.getItem('refresh_token')
  ) {
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return cachedAxios(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const { data } = await axios.post('/api/refresh', {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });

      localStorage.setItem('access_token', data.access_token);
      processQueue(null, data.access_token);
      originalRequest.headers['Authorization'] = 'Bearer ' + data.access_token;
      return cachedAxios(originalRequest);
    } catch (err) {
      processQueue(err, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
});
