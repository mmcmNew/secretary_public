function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export default async function api(url, method = 'GET', body = null) {
  const token = getCookie('access_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}, status ${response.status}`);
  }
  return response.json();
}

export const apiGet = (url) => api(url);
export const apiPost = (url, body) => api(url, 'POST', body);
export const apiPut = (url, body) => api(url, 'PUT', body);
export const apiDelete = (url, body) => api(url, 'DELETE', body);

export const fetchTaskFieldsConfig = () => api('/tasks/fields_config');
