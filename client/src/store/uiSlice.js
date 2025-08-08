import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    themeMode: 'light',
    activeId: null,
    windowOrder: [],
    isSecretarySpeak: false,
    draggingContainer: null,
    loading: {}, // Добавляем состояние загрузки
    error: null, // Добавляем состояние ошибки
  },
  reducers: {
    setThemeMode: (state, action) => {
      state.themeMode = action.payload;
    },
    setActiveId: (state, action) => {
      state.activeId = action.payload;
    },
    setWindowOrder: (state, action) => {
      state.windowOrder = action.payload;
    },
    setIsSecretarySpeak: (state, action) => {
      state.isSecretarySpeak = action.payload;
    },
    setDraggingContainer: (state, action) => {
      state.draggingContainer = action.payload;
    },
    setLoading: (state, action) => { // Редьюсер для установки состояния загрузки
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setError: (state, action) => { // Редьюсер для установки ошибки
      state.error = action.payload;
    },
    clearError: (state) => { // Редьюсер для очистки ошибки
      state.error = null;
    },
  },
});

export const { setThemeMode, setActiveId, setWindowOrder, setIsSecretarySpeak, setDraggingContainer, setLoading, setError, clearError } = uiSlice.actions;

export default uiSlice.reducer;
