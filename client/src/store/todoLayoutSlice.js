import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedListId: null,
  selectedTaskId: null,
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
      const newListId = action.payload;
      const oldListId = state.selectedListId;
      state.selectedListId = newListId;
      
      // Сбрасываем selectedTaskId при смене списка (включая установку null)
      if (state.selectedTaskId !== null) {
        console.log(`List changed from ${oldListId} to ${newListId}, clearing selectedTaskId: ${state.selectedTaskId}`);
        state.selectedTaskId = null;
        // Также сбрасываем expandedTasks для нового списка
        state.expandedTasks = {};
      }
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
  setEditingTitle,
  setCompletedTasksOpen,
  toggleTaskExpanded,
  setTaskExpanded,
  toggleGroup,
  setSelectedTaskId,
  setContextTarget,
  clearContextTarget,
  addToGeneralList,
} = todoLayoutSlice.actions;

export default todoLayoutSlice.reducer;