import { useCallback, useMemo, useRef, useContext, useState } from 'react';
import { useUI } from '../../../store/useUI';
import { useTasks } from '../../../store/useTasks';
import { useLists } from '../../../store/useLists';
import { useSelector, useDispatch } from 'react-redux';
import { setCalendarRange, useGetCalendarEventsQuery, useAddCalendarEventMutation, useUpdateCalendarEventMutation, useDeleteCalendarEventMutation, usePatchCalendarInstanceMutation } from '../../../store/calendarSlice';

/**
 * Кастомный хук для управления календарной логикой
 * Инкапсулирует всю бизнес-логику календаря
 */
export const useCalendar = ({ onSuccess, onError }) => {
  const dispatch = useDispatch();
  const { events: calendarEvents, loading: calendarLoading, error: calendarError, range: calendarReduxRange } = useSelector((state) => state.calendar);

  const {
    tasks,
    fetchTasks,
    handleCreateTask,
    changeTaskStatus,
    deleteTask,
    handleDelDateClick,
  } = useTasks();
  
  const {
    lists,
    fetchLists,
  } = useLists();
  
  const {
    handleUpdateContent,
    setUpdates,
  } = useUI();
  
  // TODO: реализовать остальные функции
  const taskFields = {};
  const calendarUIState = {};
  const handleCalendarEventClick = () => {};
  const handleCalendarDialogClose = () => {};
  const handleCalendarOverrideChoice = () => {};
  const processEventChange = () => {};
  const setOverrideSnackbar = () => {};
  const changeInstanceStatus = () => {};
  const handleTaskChange = () => {};
  const handleInstanceChange = () => {};
  const handleDeleteTaskDate = () => {};
  const handleDeleteInstanceDate = () => {};
  const addSubTask = () => {};

  const [calendarSettings, setCalendarSettings] = useState({
    slotDuration: 30,
    timeRange: [8, 24],
    currentView: "timeGridWeek",
  });

  const calendarRef = useRef(null);

  // Получение диапазона календаря
  const getCalendarRange = useCallback(() => {
    const api = calendarRef.current?.getApi?.();
    if (api && api.view) {
      return {
        start: api.view.activeStart.toISOString(),
        end: api.view.activeEnd.toISOString(),
      };
    }
    return undefined;
  }, []);

  // Обработка создания задачи
  const handleCreateTaskWithUpdates = useCallback(
    async (taskData) => {
      try {
        await handleCreateTask(taskData, getCalendarRange());
        setUpdates((prevUpdates) => [...prevUpdates, 'todo', 'calendar']);
        if (onSuccess) onSuccess('Событие добавлено');
      } catch (err) {
        console.error('Error creating task:', err);
        if (onError) onError(err);
      }
    },
    [handleCreateTask, getCalendarRange, setUpdates, onSuccess, onError]
  );

  // Обработка удаления даты
  const handleDelDateClickWithUpdates = useCallback(
    async (taskId) => {
      try {
        await handleDelDateClick(taskId, getCalendarRange());
        setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
        if (onSuccess) onSuccess('Дата удалена');
      } catch (err) {
        console.error('Error deleting date:', err);
        if (onError) onError(err);
      }
    },
    [handleDelDateClick, getCalendarRange, setUpdates, onSuccess, onError]
  );

  // Обработка изменения событий
  const handleEventChange = useCallback(
    async (eventInfo) => {
      const eventDict = {
        title: eventInfo.event.title,
        allDay: eventInfo.event.allDay,
      };

      if (eventInfo.event.start) {
        eventDict.start = eventInfo.event.start;
      }

      if (eventInfo.event.end) {
        eventDict.end = eventInfo.event.end;
      }

      const originalCalendarEvent = calendarEvents?.find(
        (event) => event && event.id == eventInfo.event.id
      );

      // Если это экземпляр повторяющейся задачи — показать диалог выбора
      if (
        originalCalendarEvent &&
        originalCalendarEvent.status_id &&
        eventDict.start &&
        eventInfo.event.extendedProps?.originalStart
      ) {
        setOverrideSnackbar({ open: true, eventInfo });
        return;
      }

      // Обычная задача или серия — сразу обновляем
      try {
        await processEventChange(eventInfo, getCalendarRange());
        setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
        if (onSuccess) onSuccess('Событие обновлено');
      } catch (err) {
        console.error('Error updating event:', err);
        if (onError) onError(err);
      }
    },
    [calendarEvents, processEventChange, getCalendarRange, setUpdates, onSuccess, onError, setOverrideSnackbar]
  );

  // Обработка выбора override
  const handleOverrideChoice = useCallback(
    async (mode) => {
      await handleCalendarOverrideChoice(mode, onSuccess, onError);
    },
    [handleCalendarOverrideChoice, onSuccess, onError]
  );

  // Обработка закрытия диалога
  const handleDialogClose = useCallback(() => {
    handleCalendarDialogClose();
    setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
  }, [handleCalendarDialogClose, setUpdates]);

  // Мемоизированные данные
  const calendarEventsData = useMemo(() => {
    return calendarEvents || [];
  }, [calendarEvents]);

  const tasksData = useMemo(() => {
    return tasks.data || [];
  }, [tasks.data]);

  const [addCalendarEvent] = useAddCalendarEventMutation();
  const [updateCalendarEvent] = useUpdateCalendarEventMutation();
  const [deleteCalendarEvent] = useDeleteCalendarEventMutation();
  const [patchCalendarInstance] = usePatchCalendarInstanceMutation();
  const { data: calendarEventsDataQuery, isLoading: calendarEventsLoading, error: calendarEventsError, refetch: refetchCalendarEvents } = useGetCalendarEventsQuery(calendarReduxRange, { skip: !calendarReduxRange });

  const handleAddEvent = useCallback(async (params) => {
    try {
      const result = await addCalendarEvent(params).unwrap();
      return result;
    } catch (err) {
      onError?.(err);
      throw err;
    }
  }, [addCalendarEvent, onError]);

  const handleUpdateEvent = useCallback(async (params) => {
    try {
      const result = await updateCalendarEvent(params).unwrap();
      return result;
    } catch (err) {
      onError?.(err);
      throw err;
    }
  }, [updateCalendarEvent, onError]);

  const handleDeleteEvent = useCallback(async (params) => {
    try {
      const result = await deleteCalendarEvent(params.taskId).unwrap();
      return result;
    } catch (err) {
      onError?.(err);
      throw err;
    }
  }, [deleteCalendarEvent, onError]);

  const handlePatchInstance = useCallback(async (params) => {
    try {
      const result = await patchCalendarInstance(params).unwrap();
      return result;
    } catch (err) {
      onError?.(err);
      throw err;
    }
  }, [patchCalendarInstance, onError]);

  const handleFetchCalendarEvents = useCallback((range) => {
    dispatch(setCalendarRange(range)); // Сохраняем диапазон в Redux
    refetchCalendarEvents();
  }, [dispatch, refetchCalendarEvents]);

  const handleCalendarSettingsSave = useCallback((settings, containerId, handleUpdateContent) => {
    setCalendarSettings(settings);
    handleUpdateContent?.(containerId, { calendarSettingsProp: settings });
  }, []);

  return {
    // Ref
    calendarRef,
    
    // Данные
    tasks: tasksData,
    lists,
    taskFields,
    calendarEvents: { data: { events: calendarEventsData }, loading: calendarLoading, error: calendarError },
    calendarUIState,
    calendarSettings,
    
    // Функции
    fetchTasks,
    fetchCalendarEvents: handleFetchCalendarEvents,
    handleCreateTask: handleCreateTaskWithUpdates,
    handleEventClick: handleCalendarEventClick,
    handleEventChange,
    handleDelDateClick: handleDelDateClickWithUpdates,
    handleDialogClose,
    handleOverrideChoice,
    // handleSaveSettings, // Removed as per request
    setOverrideSnackbar,
    getCalendarRange,
    
    // Функции для TaskDialog
    changeInstanceStatus,
    handleTaskChange,
    handleInstanceChange,
    handleDeleteTaskDate,
    handleDeleteInstanceDate,
    addSubTask,
    changeTaskStatus,
    deleteTask,
    
    // Новые функции для синхронизации
    addEvent: handleAddEvent,
    updateEvent: handleUpdateEvent,
    deleteEvent: handleDeleteEvent,
    patchInstance: handlePatchInstance,
    handleWebSocketUpdate: useCallback(() => {}, []), // Simplified
  };
};

export default useCalendar;