import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedListId: null,
  selectedList: null,
  selectedTaskId: null,
  selectedTask: null,
  isEditingTitle: false,
  editingTitle: '',
  completedTasksOpen: true,
  expandedTasks: {},
  openGroups: {},
  // contextTarget хранит id и тип (menuType) для контекстного меню — anchorEl остаётся локальным
  contextTarget: { id: null, menuType: null },
};

export const todoLayoutSlice = createSlice({
  name: 'todoLayout',
  initialState,
  reducers: {
    setSelectedListId: (state, action) => {
      state.selectedListId = action.payload;
    },
    setSelectedList: (state, action) => {
      state.selectedList = action.payload;
    },
    setEditingTitle: (state, action) => {
      state.isEditingTitle = action.payload.isEditing;
      state.editingTitle = action.payload.title || '';
    },
    setCompletedTasksOpen: (state, action) => {
      state.completedTasksOpen = action.payload;
    },
    toggleTaskExpanded: (state, action) => {
      const taskId = action.payload;
      state.expandedTasks[taskId] = !state.expandedTasks[taskId];
    },
    // Явная установка раскрытия (полезно для селекторов / программного управления)
    setTaskExpanded: (state, action) => {
      const { taskId, expanded } = action.payload;
      state.expandedTasks[taskId] = !!expanded;
    },
    toggleGroup: (state, action) => {
      const groupId = action.payload;
      state.openGroups[groupId] = !state.openGroups[groupId];
    },
    setSelectedTaskId: (state, action) => {
      state.selectedTaskId = action.payload;
    },
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    // Контекстная цель: хранит id элемента и тип меню (например 'task' / 'list')
    setContextTarget: (state, action) => {
      const { id, menuType } = action.payload || {};
      state.contextTarget = { id: id ?? null, menuType: menuType ?? null };
    },
    clearContextTarget: (state) => {
      state.contextTarget = { id: null, menuType: null };
    },
    addToGeneralList: (state, action) => {
      // заглушка — логика добавления обрабатывается сервером / RTK Query
    },
  },
});

export const {
  setSelectedListId,
  setSelectedList,
  setEditingTitle,
  setCompletedTasksOpen,
  toggleTaskExpanded,
  setTaskExpanded,
  toggleGroup,
  setSelectedTaskId,
  setSelectedTask,
  setContextTarget,
  clearContextTarget,
  addToGeneralList,
} = todoLayoutSlice.actions;

export default todoLayoutSlice.reducer;