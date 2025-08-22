import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout, setCredentials } from '../authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITEST ? 'http://localhost:5100' : '/',
  prepareHeaders: (headers, { getState, endpoint }) => {
    const accessToken = getState().auth.accessToken;
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    
    // Для запроса обновления токена используем refresh токен
    if (endpoint === 'refreshAccessToken') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        headers.set('Authorization', `Bearer ${refreshToken}`);
      }
    }
    
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    headers.set('Time-Zone', tz);
    return headers;
  },
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  try {
    const url = typeof args === 'string' ? args : args?.url;
    const method = typeof args === 'object' && args.method ? args.method.toUpperCase() : 'GET';
    console.log('[TEST-LOG] Request:', method, url, args && args.body ? { body: args.body } : '');
  } catch {
    // ignore logging errors in tests
  }
  // Сначала проверяем, нужно ли открыть модальное окно
  const { isAuthenticated } = api.getState().auth;
  if (!isAuthenticated && typeof args !== 'string' && args.method !== 'GET') {
    const excludedEndpoints = ['login', 'register', 'getDemoToken'];
    const endpointName = api.endpoint;
    
    // Разрешаем доступ к demo маршрутам без авторизации
    if (typeof args === 'object' && args.url && args.url.startsWith('/demo/')) {
      return baseQuery(args, api, extraOptions);
    }
    
    if (!excludedEndpoints.includes(endpointName)) {
      // Instead of showing modal, we'll let RequireAuth component handle the redirection
      return { error: { status: 401, data: 'Action requires authentication' } };
    }
  }

  let result = await baseQuery(args, api, extraOptions);
  try {
    console.log('[TEST-LOG] baseQuery result:', result && (result.error ? { error: result.error } : { data: result.data }));
  } catch {
    // ignore
  }
  if (result.error && result.error.status === 401) {
    // Пытаемся обновить токен только если есть refresh токен
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResult = await baseQuery({
        url: '/api/refresh',
        method: 'POST',
      }, api, extraOptions);

      try {
        console.log('[TEST-LOG] refresh result:', refreshResult && (refreshResult.error ? { error: refreshResult.error } : { data: refreshResult.data }));
      } catch {
        // ignore
        }

      if (refreshResult.data) {
        // Если токен успешно обновлен, сохраняем его
        const { access_token, user } = refreshResult.data;
        api.dispatch(setCredentials({ user, accessToken: access_token }));

        // Повторяем оригинальный запрос с новым токеном
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Если обновить токен не удалось, выходим из системы
        api.dispatch(logout());
      }
    } else {
      // Нет refresh токена, выходим из системы
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Task', 'List', 'CalendarEvent'],
  endpoints: () => ({}),
});
