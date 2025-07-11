import axios from 'axios';
import { setupCache, buildWebStorage } from 'axios-cache-interceptor';

const cachedAxios = setupCache(axios.create(), {
  storage: buildWebStorage(window.localStorage),
  interpretHeader: true,
});

cachedAxios.interceptors.response.use(response => {
  if (response.cached) {
    console.log('CLIENT: Ответ из КЭША для', response.config.url);
  } else {
    console.log('CLIENT: Ответ с сервера для', response.config.url);
  }
  return response;
});

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export default async function api(url, method = 'GET', body = null) {
  const token = getCookie('access_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const config = { url, method, headers };
  if (body) config.data = body;
  const { data } = await cachedAxios(config);
  return data;
}

export const apiGet = (url) => api(url);
export const apiPost = (url, body) => api(url, 'POST', body);
export const apiPut = (url, body) => api(url, 'PUT', body);
export const apiDelete = (url, body) => api(url, 'DELETE', body);
