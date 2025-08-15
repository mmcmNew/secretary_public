import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedListId: null,
  selectedList: null,
  selectedTaskId: null,
  selectedTask: null,
  isEditingTitle: false,
  editingTitle: '',
  newTask: '',
  completedTasksOpen: true,
  expandedTasks: {},
  openGroups: {},
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
    setNewTask: (state, action) => {
      state.newTask = action.payload;
    },
    setCompletedTasksOpen: (state, action) => {
      state.completedTasksOpen = action.payload;
    },
    toggleTaskExpanded: (state, action) => {
      const taskId = action.payload;
      state.expandedTasks[taskId] = !state.expandedTasks[taskId];
    },
    resetNewTask: (state) => {
      state.newTask = '';
    },
    toggleGroup: (state, action) => {
      const groupId = action.payload;
      state.openGroups[groupId] = !state.openGroups[groupId];
    },
    setSelectedTaskId: (state, action) => {
      console.log(action.payload, "setSelectedTaskId payload in todoLayoutSlice");
      state.selectedTaskId = action.payload;
    },
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    addToGeneralList: (state, action) => {
      // Логика добавления в общий список будет обрабатываться на сервере
      console.log('Adding to general list:', action.payload);
    },
  },
});

export const { 
  setSelectedListId, 
  setSelectedList,
  setEditingTitle, 
  setNewTask, 
  setCompletedTasksOpen, 
  toggleTaskExpanded,
  resetNewTask,
  toggleGroup, 
  setSelectedTaskId, 
  setSelectedTask,
  addToGeneralList
} = todoLayoutSlice.actions;

export default todoLayoutSlice.reducer;