import { PropTypes } from 'prop-types';
import { useEffect, useRef, useState, useCallback } from "react";
import useTasks from "../ToDo/hooks/useTasks";
import useContainer from "../DraggableComponents/useContainer";
import TaskDialog from "./TaskDialog";
import CalendarComponent from "./CalendarComponent";
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Box from '@mui/material/Box';

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
    lists, calendarEvents, fetchCalendarEvents, processEventChange: processEventChangeCtx, handleCreateTask: handleCreateTaskCtx,
    handleDelDateClick: handleDelDateClickCtx, handleOverrideChoice: handleOverrideChoiceCtx, getSubtasksByParentId,
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


  const handleDelDateClick = useCallback(
    async (taskId) => {
      try {
        await handleDelDateClickCtx(taskId, getCalendarRange());
        setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
        if (onSuccess) onSuccess('Дата удалена');
      } catch (err) {
        console.error('Error deleting date:', err);
        if (onError) onError(err);
      }
    },
    [handleDelDateClickCtx, setUpdates, onSuccess, onError]
  );

  const handleCreateTask = useCallback(
    async (taskData) => {
      try {
        await handleCreateTaskCtx(taskData, getCalendarRange());
        setUpdates((prevUpdates) => [...prevUpdates, 'todo', 'calendar']);
        if (onSuccess) onSuccess('Событие добавлено');
      } catch (err) {
        console.error('Error creating task:', err);
        if (onError) onError(err);
      }
    },
    [handleCreateTaskCtx, setUpdates, onSuccess, onError]
  );

  const handleEventClick = useCallback(
    async (eventInfo) => {
      await handleDialogOpen('paper', eventInfo.event);
    },
    [handleDialogOpen]
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
          subtasks = await getSubtasksByParentId(eventObj.id);
        } else {
          subtasks = await getSubtasksByParentId(_parentTask.id);
        }
        setSelectedSubtasks(subtasks);
        
      }
      setTaskDialogOpen(true);
      setDialogScroll(scrollType);
    }, [calendarEvents, getSubtasksByParentId]
  );

  const handleDialogClose = useCallback(() => {
    setTaskDialogOpen(false);
    setSelectedEvent(null);
    setSelectedSubtasks([]);
    setParentTask(null);
    setOverrides([]);
    setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
  }, [setUpdates]);

  
  // Обработка выбора в Snackbar
  const handleOverrideChoice = async (mode) => {
    if (!overrideSnackbar.eventInfo) return;
    const eventInfo = overrideSnackbar.eventInfo;
    try {
      await handleOverrideChoiceCtx(mode, eventInfo, getCalendarRange());
      if (setUpdates && typeof setUpdates === 'function') {
        setUpdates((prevUpdates) => [...prevUpdates, 'todo', 'calendar']);
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
        await processEventChangeCtx(eventInfo, getCalendarRange());
        if (setUpdates && typeof setUpdates === "function")
          setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
        if (onSuccess) onSuccess('Событие обновлено');
      } catch (err) {
        console.error('Error updating event:', err);
        if (onError) onError(err);
      }
    },
    [calendarSettings, calendarEvents, processEventChangeCtx, setUpdates, onSuccess, onError]
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
        taskFields={taskFields}
        addSubTask={addSubTask}
        changeTaskStatus={changeTaskStatus}
        changeInstanceStatus={changeInstanceStatus}
        deleteTask={deleteTask}
        onChangeTask={handleTaskChange}
        onChangeInstance={handleInstanceChange}
        onDeleteInctanceDate={handleDeleteInctanceDate}
        onDeleteTaskDate={handleDeleteTaskDate}
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
