import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../../store/api/apiSlice';
import { authSlice, setCredentials } from '../../store/authSlice';
import { listsSlice } from '../../store/listsSlice';
import { tasksSlice } from '../../store/tasksSlice';
import { authApiSlice } from '../../store/api/authApi';
import { listsApi } from '../../store/listsSlice'; // Assuming this exports the API slice
import { tasksApi } from '../../store/tasksSlice'; // Assuming this exports the API slice
import { calendarApi } from '../../store/api/calendarApi'; // Assuming this exports the API slice
import dashboardReducer from '../../store/dashboardSlice';

// Создание тестового стора
export const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      lists: listsSlice.reducer,
      tasks: tasksSlice.reducer,
      dashboard: dashboardReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
      [authApiSlice.reducerPath]: authApiSlice.reducer,
      [listsApi.reducerPath]: listsApi.reducer,
      [tasksApi.reducerPath]: tasksApi.reducer,
      [calendarApi.reducerPath]: calendarApi.reducer, // Add calendarApi reducer
    },
    // Add the api middleware only once. All injected API slices share the same
    // base `apiSlice.middleware`, so including other injected slices' middleware
    // will produce duplicate references and cause configureStore to throw.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: {
      auth: {
        user: null,
        accessToken: null,
        isAuthenticated: false,
      },
      lists: {
        lists: [],
        selectedListId: null,
        loading: false,
        error: null,
      },
      tasks: {
        tasks: [],
        selectedTaskId: null,
        loading: false,
        error: null,
        version: 0,
        isFetching: false,
      },
    },
  });
};

// Создание авторизованного стора
export const createAuthorizedStore = async () => {
  const store = createTestStore();
  // Always get a real demo token from the backend, even in test mode
  await getDemoToken(store);
  return store;
};

// Получение демо токена
export const getDemoToken = async (store) => {
  // В тестовой среде делаем POST на /api/login с тестовыми кредами
  const isTestEnv = (() => {
    if (typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env && globalThis.process.env.NODE_ENV === 'test') return true;
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test') return true;
    } catch {/* ignore */}
    return false;
  })();

  if (isTestEnv) {
    const url = 'https://localhost:5100/api/login';
    // Замените на реальные креды тестового пользователя из seed
  const credentials = { email: 'testuser@example.com', password: 'password123' };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error('Failed to login: ' + res.status);
    const data = await res.json();
    if (!data?.user || !data?.access_token) throw new Error('Invalid login response');
    store.dispatch(setCredentials({ user: data.user, accessToken: data.access_token }));
    return { status: 'fulfilled', data };
  } else {
    store.dispatch(authApiSlice.endpoints.getDemoToken.initiate());
    const result = await waitForQuery(store, 'getDemoToken');
    if (result.status !== 'fulfilled') {
      throw new Error('Failed to get demo token');
    }
    return result;
  }
};

// Ожидание выполнения RTK запроса
export const waitForQuery = (store, endpointName, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkQuery = () => {
        const queries = store.getState()[apiSlice.reducerPath]?.queries || {};
        const mutations = store.getState()[apiSlice.reducerPath]?.mutations || {};

        // Проверяем queries и mutations из всех API slices
        const allQueries = {
          ...queries,
          ...mutations,
          ...((store.getState()[authApiSlice.reducerPath]?.queries) || {}),
          ...((store.getState()[authApiSlice.reducerPath]?.mutations) || {}),
    ...((store.getState()[listsApi.reducerPath]?.queries) || {}),
    ...((store.getState()[listsApi.reducerPath]?.mutations) || {}),
    ...((store.getState()[tasksApi.reducerPath]?.queries) || {}),
    ...((store.getState()[tasksApi.reducerPath]?.mutations) || {}),
    ...((store.getState()[calendarApi.reducerPath]?.queries) || {}),
    ...((store.getState()[calendarApi.reducerPath]?.mutations) || {}),
        };
      
      // Ищем запрос по имени эндпоинта
      const queryEntries = Object.entries(allQueries);
      const matchingQuery = queryEntries.find(([key, value]) => {
        if (!key.includes(endpointName)) return false;
        // Resolve when status indicates completion
        if (value?.status === 'fulfilled' || value?.status === 'rejected') return true;
        // Or when RTK Query stored data or an error directly
        if (value?.data || value?.error) return true;
        return false;
      });
      
      if (matchingQuery) {
        resolve(matchingQuery[1]);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Query ${endpointName} timed out`));
      } else {
        setTimeout(checkQuery, 100);
      }
    };
    
    checkQuery();
  });
};

// Вспомогательная функция для ожидания выполнения мутации
export const waitForMutation = (store, endpointName, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const allMutations = {
        ...(store.getState()[apiSlice.reducerPath]?.mutations || {}),
        ...(store.getState()[authApiSlice.reducerPath]?.mutations || {}),
        ...(store.getState()[listsApi.reducerPath]?.mutations || {}),
        ...(store.getState()[tasksApi.reducerPath]?.mutations || {}),
        ...(store.getState()[calendarApi.reducerPath]?.mutations || {}),
      };

      const entries = Object.entries(allMutations);
      // Find any completed mutation (data or error) that matches endpointName if provided
      const matching = entries.find(([key, value]) => {
        if (!value) return false;
        if (endpointName && !key.includes(endpointName)) return false;
        if (value.status === 'fulfilled' || value.status === 'rejected') return true;
        if (value.data || value.error) return true;
        return false;
      });

      if (matching) return resolve(matching[1]);
      if (Date.now() - startTime > timeout) return reject(new Error(`Mutation ${endpointName} timed out`));
      setTimeout(check, 50);
    };

    check();
  });
};