import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout, setCredentials } from '../authSlice';

// Use an absolute baseUrl when running in the test environment (Vitest/Node)
// because Node's fetch implementation requires absolute URLs. In browser
// runtime we keep the relative '/api' path.
//
// Determine test mode safely so this file can run in browser (Vite),
// in Node (Vitest/Node) and in environments where `process` may be
// undefined. We prefer `process.env.NODE_ENV === 'test'` when available,
// otherwise fall back to `import.meta.env.MODE === 'test'` used by Vite/Vitest.
const isTestEnv = (() => {
  // Check Node-style process on the global object first (works in Node and many test runners)
  if (typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env && globalThis.process.env.NODE_ENV === 'test') {
    return true;
  }

  // Fallback to Vite/Vitest import.meta.env when available
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test') {
      return true;
    }
  } catch {
    // import.meta may not be available in some runtimes; ignore errors
  }

  return false;
})();





const baseQuery = fetchBaseQuery({
  baseUrl: '/',
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

const baseQueryWithReauth = async (args, api, extraOptions) => {
  if (isTestEnv) {
    try {
      const url = typeof args === 'string' ? args : args?.url;
      const method = typeof args === 'object' && args.method ? args.method.toUpperCase() : 'GET';
      console.log('[TEST-LOG] Request:', method, url, args && args.body ? { body: args.body } : '');
    } catch {
      // ignore logging errors in tests
    }
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
  if (isTestEnv) {
    try {
      console.log('[TEST-LOG] baseQuery result:', result && (result.error ? { error: result.error } : { data: result.data }));
    } catch {
      // ignore
    }
  }
  if (result.error && result.error.status === 401) {
    // Пытаемся обновить токен только если есть refresh токен
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResult = await baseQuery({
        url: '/api/refresh',
        method: 'POST',
      }, api, extraOptions);

      if (isTestEnv) {
        try {
          console.log('[TEST-LOG] refresh result:', refreshResult && (refreshResult.error ? { error: refreshResult.error } : { data: refreshResult.data }));
        } catch {
          // ignore
        }
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
