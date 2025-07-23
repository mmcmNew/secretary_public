import { PropTypes } from 'prop-types';
import { useEffect, useRef, useState, useCallback } from "react";
import useTasks from "../ToDo/hooks/useTasks";
import useContainer from "../DraggableComponents/useContainer";
import TaskDialog from "./TaskDialog";
import CalendarComponent from "./CalendarComponent";
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Box from '@mui/material/Box';
import applyTimeOffset from "../../utils/applyTimeOffset";

const defaultCalendarSettings = {
  slotDuration: 30,
  timeRange: [8, 24],
  timeOffset: 0,
  currentView: "timeGridWeek",
  views: "timeGridWeek,timeGridDay,dayGridMonth,listWeek",
  isToggledBGTasksEdit: false,
};

export default function CalendarLayout({
  containerId = null,
  handleDatesSet = null,
  calendarSettingsProp = null,
  onSuccess = null,
  onError = null,
}) {
  const { updateTask, addTask, fetchTasks, tasks, taskFields, addSubTask, changeTaskStatus, deleteTask, 
    lists, calendarEvents, fetchCalendarEvents, processEventChange, getSubtasksByParentId,
    createTaskOverride, updateTaskOverride, deleteTaskOverride } = useTasks();
  const { setUpdates, handleUpdateContent } = useContainer();
  const calendarRef = useRef(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [dialogScroll, setDialogScroll] = useState("paper");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSubtasks, setSelectedSubtasks] = useState([]);
  const [overrideSnackbar, setOverrideSnackbar] = useState({ open: false, eventInfo: null });
  const [parentTask, setParentTask] = useState(null);
  const [overrides, setOverrides] = useState([]);

  const [calendarSettings, setCalendarSettings] = useState(
    () => calendarSettingsProp || defaultCalendarSettings
  );

  useEffect(() => {
    if (calendarSettingsProp) {
      setCalendarSettings(calendarSettingsProp);
    }
  }, [calendarSettingsProp]);

  useEffect(() => {
    if (tasks.error && onError) onError(tasks.error);
  }, [tasks.error, onError]);

  useEffect(() => {
    if (calendarEvents.error && onError) onError(calendarEvents.error);
  }, [calendarEvents.error, onError]);

  const handleSaveCalendarSettings = useCallback(
    (settings) => {
      try {
        setCalendarSettings(settings);
        if (handleUpdateContent && containerId) {
          handleUpdateContent(containerId, { calendarSettingsProp: settings });
        }
        if (onSuccess) onSuccess('Настройки сохранены');
      } catch (err) {
        if (onError) onError(err);
      }
    },
    [handleUpdateContent, containerId, onSuccess, onError]
  );

      // Функция загрузки подзадач
  const loadSubtasks = useCallback(async (parentTaskId) => {
    if (!parentTaskId) return [];
    const subtasks = await getSubtasksByParentId(parentTaskId);
    setSelectedSubtasks(subtasks);
    return subtasks;
  }, [getSubtasksByParentId]);

  const handleDelDateClick = useCallback(
    async (taskId) => {
      try {
        await updateTask({ taskId, start: null, end: null });
        if (fetchCalendarEvents && typeof fetchCalendarEvents === "function")
          await fetchCalendarEvents(getCalendarRange());
        setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
        if (onSuccess) onSuccess('Дата удалена');
      } catch (err) {
        console.error('Error deleting date:', err);
        if (onError) onError(err);
      }
    },
    [updateTask, setUpdates, onSuccess, onError]
  );

  const handleCreateTask = useCallback(
    async (taskData) => {
      try {
        await addTask(taskData);
        if (fetchCalendarEvents && typeof fetchCalendarEvents === 'function') {
          await fetchCalendarEvents(getCalendarRange());
        }
        setUpdates((prevUpdates) => [...prevUpdates, 'todo', 'calendar']);
        if (onSuccess) onSuccess('Событие добавлено');
      } catch (err) {
        console.error('Error creating task:', err);
        if (onError) onError(err);
      }
    },
    [addTask, fetchCalendarEvents, setUpdates, onSuccess, onError]
  );

  const handleDialogOpen = useCallback(
    async (scrollType, eventObj) => {
      let _parentTask = null;
      let _overrides = [];
      let _parentSubtasks = [];
      if (eventObj && eventObj.id) {
        setSelectedEvent(eventObj);
        // Найти parentTask для повторяющейся задачи
        if (eventObj.parent_task_id) {
          _parentTask = (calendarEvents.data?.parent_tasks || []).find(pt => pt.id === eventObj.parent_task_id);
        } 
        setParentTask(_parentTask || null);
        // Найти все overrides для этой серии
        if (_parentTask) {
          _overrides = (calendarEvents.data?.events || []).filter(ev => ev.parent_task_id === _parentTask.id && ev.is_override);
        }
        setOverrides(_overrides);
        // Загрузить подзадачи для экземпляра и для серии
        // Для экземпляра: если есть parent_task_id, то подзадачи по нему, иначе по id
        let subtasks;
        if (!eventObj.parent_task_id) {
          subtasks = await loadSubtasks(eventObj.id);
        } else {
          subtasks = await loadSubtasks(_parentTask.id);
        }
        setSelectedSubtasks(subtasks);
        
      }
      setTaskDialogOpen(true);
      setDialogScroll(scrollType);
    }, [calendarEvents, loadSubtasks]
  );

  const handleDialogClose = useCallback(() => {
    setTaskDialogOpen(false);
    setSelectedEvent(null);
    setSelectedSubtasks([]);
    setParentTask(null);
    setOverrides([]);
    setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
  }, [setUpdates]);

  // onChange для TaskDialog
  const handleTaskDialogChange = useCallback(async (updatedTask) => {
    if (!updatedTask || !updatedTask.id) return;
    if (updatedTask.is_override && updatedTask.override_id) {
      // PATCH override
      await updateTaskOverride(updatedTask.override_id, { data: updatedTask });
    } else {
      // PATCH обычная задача/серия
      await updateTask({ taskId: updatedTask.id, ...updatedTask });
    }
    await fetchCalendarEvents(getCalendarRange());
    setUpdates((prev) => [...prev, "todo", "calendar"]);
  }, [updateTask, updateTaskOverride, fetchCalendarEvents, setUpdates]);

  const handleEventClick = useCallback(
    async (event) => {
      const calendarEvent = calendarEvents?.data?.events?.find(e => e.id == event?.event?.id);
      console.log(calendarEvent, calendarEvents)
      if (calendarEvent) {
        await handleDialogOpen("paper", calendarEvent);
      } else {
        onError('Event not found in calendarEvents')
      }
    },
    [calendarEvents, handleDialogOpen]
  );

  // Обработка выбора в Snackbar
  const handleOverrideChoice = async (mode) => {
    if (!overrideSnackbar.eventInfo) return;
    const eventInfo = overrideSnackbar.eventInfo;
    const offsetHours = Number(calendarSettings?.timeOffset) || 0;
    const eventDict = {
      title: eventInfo.event.title,
      allDay: eventInfo.event.allDay,
    };
    if (eventInfo.event.start) {
      const originalStart = applyTimeOffset(eventInfo.event.start, offsetHours);
      if (originalStart) eventDict.start = originalStart;
    }
    if (eventInfo.event.end) {
      const originalEnd = applyTimeOffset(eventInfo.event.end, offsetHours);
      if (originalEnd) eventDict.end = originalEnd;
    } else if (eventInfo.event.start && !eventInfo.event.allDay) {
      const receivedStartDate = new Date(eventInfo.event.start);
      if (!isNaN(receivedStartDate.getTime())) {
        receivedStartDate.setHours(receivedStartDate.getHours() + 1);
        const originalEnd = applyTimeOffset(receivedStartDate, offsetHours);
        if (originalEnd) eventDict.end = originalEnd;
      }
    }
    if (mode === 'single' && eventInfo.event.extendedProps?.originalStart) {
      eventDict.current_start = eventInfo.event.extendedProps.originalStart;
    }
    try {
      if (
        eventInfo.event.extendedProps?.is_override &&
        eventInfo.event.id.startsWith('override_')
      ) {
        const overrideId = parseInt(eventInfo.event.id.replace('override_', ''));
        await updateTaskOverride(overrideId, { data: eventDict });
      } else {
        await updateTask({ taskId: eventInfo.event.id, ...eventDict });
      }
      if (setUpdates && typeof setUpdates === 'function') {
        setUpdates((prevUpdates) => [...prevUpdates, 'todo', 'calendar']);
      }
      if (fetchCalendarEvents && typeof fetchCalendarEvents === 'function') {
        await fetchCalendarEvents(getCalendarRange());
      }
      if (onSuccess) onSuccess('Событие обновлено');
    } catch (err) {
      console.error('Error updating event:', err);
      if (onError) onError(err);
    }
    setOverrideSnackbar({ open: false, eventInfo: null });
  };

  const handleEventChange = useCallback(
    async (eventInfo) => {
      const offsetHours = Number(calendarSettings?.timeOffset) || 0;


      const eventDict = {
        title: eventInfo.event.title,
        allDay: eventInfo.event.allDay,
      };

      if (eventInfo.event.start) {
        const originalStart = applyTimeOffset(eventInfo.event.start, offsetHours);
        if (originalStart) eventDict.start = originalStart;
      }

      if (eventInfo.event.end) {
         const originalEnd = applyTimeOffset(eventInfo.event.end, offsetHours);
         if(originalEnd) eventDict.end = originalEnd;
      } else if (eventInfo.event.start && !eventInfo.event.allDay) {
        const receivedStartDate = new Date(eventInfo.event.start);
        if (!isNaN(receivedStartDate.getTime())) {
          receivedStartDate.setHours(receivedStartDate.getHours() + 1);
          const originalEnd = applyTimeOffset(receivedStartDate, offsetHours);
          if(originalEnd) eventDict.end = originalEnd;
        }
      }

      const originalCalendarEvent = calendarEvents?.events?.find(
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
        await updateTask({ taskId: eventInfo.event.id, ...eventDict });
        if (setUpdates && typeof setUpdates === "function")
          setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
        if (fetchCalendarEvents && typeof fetchCalendarEvents === "function")
          await fetchCalendarEvents(getCalendarRange());
        if (onSuccess) onSuccess('Событие обновлено');
      } catch (err) {
        console.error('Error updating event:', err);
        if (onError) onError(err);
      }
    },
    [calendarSettings, calendarEvents, updateTask, setUpdates, fetchCalendarEvents, onSuccess, onError]
  );


  // Вспомогательная функция для получения диапазона календаря
  const getCalendarRange = () => {
    const api = calendarRef.current?.getApi?.();
    if (api && api.view) {
      return {
        start: api.view.activeStart.toISOString(),
        end: api.view.activeEnd.toISOString(),
      };
    }
    return undefined;
  };

  return (
    <>
      <CalendarComponent
        calendarRef={calendarRef}
        newSettings={calendarSettings}
        saveSettings={handleSaveCalendarSettings}
        events={calendarEvents.data.events}
        tasks={tasks.data}
        lists={lists}
        handleEventClick={handleEventClick}
        handleEventChange={handleEventChange}
        eventReceive={handleEventChange}
        onCreateTask={handleCreateTask}
        fetchTasks={fetchTasks}
        fetchEvents={fetchCalendarEvents}
        datesSet={handleDatesSet}
      />
      <TaskDialog
        open={taskDialogOpen}
        handleClose={handleDialogClose}
        handleDelDateClick={handleDelDateClick}
        scroll={dialogScroll}
        instance={selectedEvent}
        subtasks={selectedSubtasks}
        task={parentTask}
        overrides={overrides}
        loadSubtasks={loadSubtasks}
        taskFields={taskFields}
        addSubTask={addSubTask}
        changeTaskStatus={changeTaskStatus}
        changeInstanceStatus={changeInstanceStatus}
        deleteTask={deleteTask}
        onChange={handleTaskDialogChange}
      />
      {/* Snackbar для выбора режима теперь только для drag&drop */}
      <Snackbar
        open={overrideSnackbar.open}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span>Что изменить?</span>
            <Button variant="contained" color="primary" onClick={() => handleOverrideChoice('single')}>
              Только этот экземпляр (только {overrideSnackbar.eventInfo?.event?.extendedProps?.originalStart ? new Date(overrideSnackbar.eventInfo.event.extendedProps.originalStart).toLocaleDateString() : 'этот день'})
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => handleOverrideChoice('series')}>
              Всю серию
            </Button>
          </Box>
        }
        onClose={() => setOverrideSnackbar({ open: false, eventInfo: null })}
      />
    </>
  );
}

CalendarLayout.propTypes = {
  containerId: PropTypes.string,
  handleDatesSet: PropTypes.func,
  calendarSettingsProp: PropTypes.object,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};
