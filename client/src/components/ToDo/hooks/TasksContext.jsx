// TasksProvider.js
import { createContext, useMemo, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTasks } from './useTasks';
import { useLists } from './useLists';
import { useMyDay } from './useMyDay';
import { useCalendar } from './useCalendar';
import { useTaskTypes } from './useTaskTypes';
import api from '../../../utils/api';

export const TasksContext = createContext();

export const TasksProvider = ({ children, onError, setLoading }) => {
  const queryClient = useQueryClient();
  const { tasks, fetchTasks, addTask, updateTask, deleteTask, changeTaskStatus, selectedTaskId, setSelectedTaskId, getSubtasksByParentId, taskFields } = useTasks({ onError, setLoading });
  const { lists, fetchLists, addList, updateList, deleteList } = useLists();
  const { myDayTasks, myDayList, fetchMyDayTasks, findMyDayList } = useMyDay();
  const { calendarEvents, calendarRange, setCalendarRange, calendarSettings, fetchCalendarEvents, handleCalendarSettingsSave } = useCalendar();
  const { getTaskTypes, addTaskType, getTaskTypeGroups } = useTaskTypes();
  
  const [selectedListId, setSelectedListId] = useState(null);

  // Derive selectedList from lists and selectedListId
  const selectedList = useMemo(() => {
    if (!lists || !selectedListId) return null;
    
    // Search in all list types
    const allLists = [...(lists.lists || []), ...(lists.projects || []), ...(lists.default_lists || [])];
    return allLists.find(list => list.id === selectedListId) || null;
  }, [lists, selectedListId]);

  // Добавляем мутации для работы со списками
  const linkListGroupMutation = useMutation({
    mutationFn: (params) => api.post('/tasks/link_list_group', params),
  });
  
  const deleteFromChildesMutation = useMutation({
    mutationFn: (params) => api.post('/tasks/delete_from_childes', params),
  });
  
  const linkTaskListMutation = useMutation({
    mutationFn: (params) => api.post('/tasks/link_task_list', params),
  });

  // Мутации для работы с экземплярами задач
  const patchInstanceMutation = useMutation({
    mutationFn: (params) => api.patch('/tasks/instance', params),
  });

  // Состояние UI календаря
  const [calendarUIState, setCalendarUIState] = useState({
    taskDialogOpen: false,
    dialogScroll: "paper",
    selectedEvent: null,
    selectedSubtasks: [],
    parentTask: null,
    overrides: [],
    overrideSnackbar: { open: false, eventInfo: null }
  });

  // Обновление myDayList при обновлении списков
  useEffect(() => {
    if (lists && lists.lists && lists.projects && lists.default_lists) {
      findMyDayList([...lists.lists, ...lists.projects, ...lists.default_lists]);
    }
  }, [lists, findMyDayList]);

  // Функции для работы с UI состоянием календаря
  const handleCalendarEventClick = useCallback((eventInfo) => {
    setCalendarUIState(prev => ({
      ...prev,
      taskDialogOpen: true,
      dialogScroll: "paper",
      selectedEvent: eventInfo.event.extendedProps?.is_instance ? eventInfo.event : null,
      parentTask: eventInfo.event.extendedProps?.is_instance ? null : eventInfo.event,
    }));
  }, []);

  const handleCalendarDialogClose = useCallback(() => {
    setCalendarUIState(prev => ({
      ...prev,
      taskDialogOpen: false,
      selectedEvent: null,
      parentTask: null,
    }));
  }, []);

  const setOverrideSnackbar = useCallback((snackbarState) => {
    setCalendarUIState(prev => ({
      ...prev,
      overrideSnackbar: snackbarState,
    }));
  }, []);

  // Функции для работы с экземплярами задач
  const changeInstanceStatus = useCallback(async (params) => {
    try {
      // Для экземпляров повторяющихся задач используем instance API
      if (params.isInstance && params.originalStart) {
        const patchData = {
          parent_task_id: params.taskId,
          date: params.originalStart,
          data: { status_id: params.status_id }
        };
        const result = await patchInstanceMutation.mutateAsync(patchData);
        await fetchCalendarEvents();
        return result;
      } else {
        // Обычная задача
        return await changeTaskStatus(params);
      }
    } catch (error) {
      console.error('Error changing instance status:', error);
      throw error;
    }
  }, [changeTaskStatus, patchInstanceMutation, fetchCalendarEvents]);

  const handleTaskChange = useCallback(async (taskData) => {
    try {
      // Изменение основной задачи (серии)
      const result = await updateTask(taskData);
      await fetchCalendarEvents();
      return result;
    } catch (error) {
      console.error('Error changing task:', error);
      throw error;
    }
  }, [updateTask, fetchCalendarEvents]);

  const handleInstanceChange = useCallback(async (instanceData) => {
    try {
      // Изменение конкретного экземпляра задачи
      if (instanceData.isInstance && instanceData.originalStart) {
        const patchData = {
          parent_task_id: instanceData.parent_task_id || instanceData.taskId,
          date: instanceData.originalStart,
          data: instanceData
        };
        const result = await patchInstanceMutation.mutateAsync(patchData);
        await fetchCalendarEvents();
        return result;
      } else {
        // Обычная задача
        return await updateTask(instanceData);
      }
    } catch (error) {
      console.error('Error changing instance:', error);
      throw error;
    }
  }, [updateTask, patchInstanceMutation, fetchCalendarEvents]);

  const handleDeleteTaskDate = useCallback(async (taskId, range) => {
    try {
      // Удаляем дату у основной задачи (серии)
      await updateTask({ taskId, start: null, end: null });
      if (range) {
        await fetchCalendarEvents(range);
      }
    } catch (error) {
      console.error('Error deleting task date:', error);
      throw error;
    }
  }, [updateTask, fetchCalendarEvents]);

  const handleDeleteInstanceDate = useCallback(async (instanceData, range) => {
    try {
      // Удаляем дату у экземпляра задачи
      if (instanceData.isInstance && instanceData.originalStart) {
        const patchData = {
          parent_task_id: instanceData.parent_task_id || instanceData.taskId,
          date: instanceData.originalStart,
          data: { type: 'skip' }
        };
        const result = await patchInstanceMutation.mutateAsync(patchData);
        if (range) {
          await fetchCalendarEvents(range);
        }
        return result;
      } else {
        // Обычная задача
        return await handleDeleteTaskDate(instanceData.taskId, range);
      }
    } catch (error) {
      console.error('Error deleting instance date:', error);
      throw error;
    }
  }, [handleDeleteTaskDate, patchInstanceMutation, fetchCalendarEvents]);

  const handleCalendarOverrideChoice = useCallback(async (mode, onSuccess, onError) => {
    const { eventInfo } = calendarUIState.overrideSnackbar;
    if (!eventInfo) return;

    setOverrideSnackbar({ open: false, eventInfo: null });

    try {
      if (mode === 'single') {
        // Обновляем только экземпляр
        const patchData = {
          parent_task_id: eventInfo.event.extendedProps.parent_task_id,
          date: eventInfo.event.extendedProps.originalStart,
          data: {
            start: eventInfo.event.start,
            end: eventInfo.event.end,
          }
        };
        await patchInstanceMutation.mutateAsync(patchData);
      } else {
        // Обновляем всю серию
        const taskData = {
          taskId: eventInfo.event.extendedProps.parent_task_id || eventInfo.event.id,
          start: eventInfo.event.start,
          end: eventInfo.event.end,
        };
        await updateTask(taskData);
      }
      
      await fetchCalendarEvents();
      if (onSuccess) onSuccess(mode === 'single' ? 'Экземпляр обновлен' : 'Серия обновлена');
    } catch (error) {
      console.error('Error handling override choice:', error);
      if (onError) onError(error);
    }
  }, [calendarUIState.overrideSnackbar, setOverrideSnackbar, patchInstanceMutation, updateTask, fetchCalendarEvents]);

  const processEventChange = useCallback(async (eventInfo, range) => {
    const eventDict = {
      taskId: eventInfo.event.id,
      title: eventInfo.event.title,
      allDay: eventInfo.event.allDay,
    };

    if (eventInfo.event.start) {
      eventDict.start = eventInfo.event.start;
    }

    if (eventInfo.event.end) {
      eventDict.end = eventInfo.event.end;
    } else if (eventInfo.event.start) {
      // Время start + 1 час
      const endDate = new Date(eventInfo.event.start);
      endDate.setHours(endDate.getHours() + 1);
      eventDict.end = endDate.toISOString();
    }

    // Если это экземпляр повторяющейся задачи
    if (eventInfo.event.extendedProps?.is_instance) {
      const patchData = {
        parent_task_id: eventInfo.event.extendedProps.parent_task_id,
        date: eventInfo.event.extendedProps.originalStart,
        data: eventDict
      };
      await patchInstanceMutation.mutateAsync(patchData);
    } else {
      // Обычная задача или серия
      await updateTask(eventDict);
    }

    if (range) {
      await fetchCalendarEvents(range);
    }
  }, [patchInstanceMutation, updateTask, fetchCalendarEvents]);

  const handleCreateTask = useCallback(async (taskData, range) => {
    const result = await addTask(taskData);
    if (range) {
      await fetchCalendarEvents(range);
    }
    return result;
  }, [addTask, fetchCalendarEvents]);

  const handleDelDateClick = useCallback(async (taskId, range) => {
    await updateTask({ taskId, start: null, end: null });
    if (range) {
      await fetchCalendarEvents(range);
    }
  }, [updateTask, fetchCalendarEvents]);

  const value = useMemo(() => ({
    // Объединяем всё
    tasks, myDayTasks, myDayList, lists, calendarEvents, calendarRange,
    calendarSettings, selectedTaskId, taskFields, calendarUIState, selectedList, selectedListId,
    fetchTasks, fetchLists, fetchMyDayTasks, fetchCalendarEvents,
    addTask, updateTask, deleteTask, changeTaskStatus,
    addList, updateList, deleteList,
    getTaskTypes, addTaskType, getTaskTypeGroups,
    setSelectedTaskId, setSelectedListId,
    setCalendarRange,
    handleCalendarSettingsSave,
    
    // Новые функции для работы со списками
    linkListGroup: linkListGroupMutation.mutateAsync,
    deleteFromChildes: deleteFromChildesMutation.mutateAsync,
    linkTaskList: linkTaskListMutation.mutateAsync,
    
    // Функции для работы с календарем
    handleCalendarEventClick,
    handleCalendarDialogClose,
    handleCalendarOverrideChoice,
    setOverrideSnackbar,
    changeInstanceStatus,
    handleTaskChange,
    handleInstanceChange,
    handleDeleteTaskDate,
    handleDeleteInstanceDate,
    processEventChange,
    handleCreateTask,
    handleDelDateClick,
    
    // Дополнительные функции
    getSubtasksByParentId,
  }), [
    tasks, myDayTasks, myDayList, lists, calendarEvents, calendarRange,
    calendarSettings, selectedTaskId, taskFields, calendarUIState, selectedList, selectedListId,
    fetchTasks, fetchLists, fetchMyDayTasks, fetchCalendarEvents,
    addTask, updateTask, deleteTask, changeTaskStatus,
    addList, updateList, deleteList,
    getTaskTypes, addTaskType, getTaskTypeGroups,
    setSelectedTaskId, setSelectedListId, setCalendarRange, handleCalendarSettingsSave,
    linkListGroupMutation.mutateAsync,
    deleteFromChildesMutation.mutateAsync,
    linkTaskListMutation.mutateAsync,
    handleCalendarEventClick,
    handleCalendarDialogClose,
    handleCalendarOverrideChoice,
    setOverrideSnackbar,
    changeInstanceStatus,
    handleTaskChange,
    handleInstanceChange,
    handleDeleteTaskDate,
    handleDeleteInstanceDate,
    processEventChange,
    handleCreateTask,
    handleDelDateClick,
    getSubtasksByParentId
  ]);

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};

TasksProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
  setLoading: PropTypes.func,
};