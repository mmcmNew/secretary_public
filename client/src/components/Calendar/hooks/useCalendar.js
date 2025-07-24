import { useCallback, useMemo, useRef } from 'react';
import useTasks from '../../ToDo/hooks/useTasks';
import useContainer from '../../DraggableComponents/useContainer';

/**
 * Кастомный хук для управления календарной логикой
 * Инкапсулирует всю бизнес-логику календаря
 */
export const useCalendar = ({ onSuccess, onError }) => {
  const {
    tasks,
    lists,
    taskFields,
    calendarEvents,
    calendarUIState,
    calendarSettings,
    fetchTasks,
    fetchCalendarEvents,
    handleCreateTask,
    handleCalendarEventClick,
    handleCalendarDialogClose,
    handleCalendarOverrideChoice,
    handleCalendarSettingsSave,
    processEventChange,
    setOverrideSnackbar,
    changeInstanceStatus,
    handleTaskChange,
    handleInstanceChange,
    handleDeleteInstanceDate,
    handleDeleteTaskDate,
    addSubTask,
    changeTaskStatus,
    deleteTask,
    handleDelDateClick,
  } = useTasks();

  const { setUpdates } = useContainer();
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

      const originalCalendarEvent = calendarEvents?.data?.events?.find(
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

  // Обработка сохранения настроек
  const handleSaveSettings = useCallback(
    (settings, containerId, handleUpdateContent) => {
      handleCalendarSettingsSave(
        settings,
        containerId,
        handleUpdateContent,
        onSuccess,
        onError
      );
    },
    [handleCalendarSettingsSave, onSuccess, onError]
  );

  // Мемоизированные данные
  const calendarEventsData = useMemo(() => {
    return calendarEvents.data?.events || [];
  }, [calendarEvents.data]);

  const tasksData = useMemo(() => {
    return tasks.data || [];
  }, [tasks.data]);

  return {
    // Ref
    calendarRef,
    
    // Данные
    tasks: tasksData,
    lists,
    taskFields,
    calendarEvents: calendarEventsData,
    calendarUIState,
    calendarSettings,
    
    // Функции
    fetchTasks,
    fetchCalendarEvents,
    handleCreateTask: handleCreateTaskWithUpdates,
    handleEventClick: handleCalendarEventClick,
    handleEventChange,
    handleDelDateClick: handleDelDateClickWithUpdates,
    handleDialogClose,
    handleOverrideChoice,
    handleSaveSettings,
    setOverrideSnackbar,
    getCalendarRange,
    
    // Функции для TaskDialog
    changeInstanceStatus,
    handleTaskChange,
    handleInstanceChange,
    handleDeleteInstanceDate,
    handleDeleteTaskDate,
    addSubTask,
    changeTaskStatus,
    deleteTask,
  };
};

export default useCalendar;