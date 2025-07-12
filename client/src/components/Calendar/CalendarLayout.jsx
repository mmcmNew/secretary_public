import { PropTypes } from 'prop-types';
import { useEffect, useRef, useState, useCallback } from "react";
import useTasks from "../ToDo/hooks/useTasks";
import useContainer from "../DraggableComponents/useContainer";
import TaskDialog from "./TaskDialog";
import CalendarComponent from "./CalendarComponent";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
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
  const { updateTask, addTask, fetchTasks, tasks, taskFields, addSubTask, changeTaskStatus, deleteTask, lists, calendarEvents, fetchCalendarEvents } = useTasks();
  const { setUpdates, handleUpdateContent } = useContainer();
  const calendarRef = useRef(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [dialogScroll, setDialogScroll] = useState("paper");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTaskStart, setSelectedTaskStart] = useState(null);
  const [overrideDialog, setOverrideDialog] = useState({ open: false, eventInfo: null, mode: null });
  const [overrideSnackbar, setOverrideSnackbar] = useState({ open: false, event: null });
  const [overrideMode, setOverrideMode] = useState(null); // null | 'single' | 'series'

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
        await updateTask({ taskId, start: null, end: null });
        if (fetchCalendarEvents && typeof fetchCalendarEvents === "function")
          await fetchCalendarEvents();
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
          await fetchCalendarEvents();
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
    (scrollType) => {
      setTaskDialogOpen(true);
      setDialogScroll(scrollType);
    },
    []
  );

  const handleDialogClose = useCallback(() => {
    setTaskDialogOpen(false);
    setSelectedTaskStart(null);
    setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
  }, [setUpdates]);

  const handleEventClick = useCallback(
    async (event) => {
      const calendarEvent = calendarEvents.data?.find(e => e.id == event?.event?.id);
      // Если это override-экземпляр — открываем TaskDialog сразу для этого экземпляра
      if (calendarEvent && calendarEvent.is_override) {
        setOverrideMode('single');
        setSelectedTaskId(event?.event?.id || null);
        setSelectedTaskStart(event?.event?.start ? event.event.start.toISOString() : null);
        handleDialogOpen("paper");
        return;
      }
      // Если это экземпляр повторяющейся задачи — показываем Snackbar
      if (calendarEvent && calendarEvent.rrule && event?.event?.extendedProps?.originalStart) {
        setOverrideSnackbar({ open: true, event });
        return;
      }
      // Обычная задача — открываем TaskDialog сразу
      setSelectedTaskId(event?.event?.id || null);
      setSelectedTaskStart(event?.event?.start ? event.event.start.toISOString() : null);
      handleDialogOpen("paper");
    },
    [calendarEvents, handleDialogOpen]
  );

  // Обработка выбора в Snackbar
  const handleOverrideSnackbarChoice = (mode) => {
    if (!overrideSnackbar.event) return;
    setOverrideMode(mode);
    setSelectedTaskId(overrideSnackbar.event.event.id);
    setSelectedTaskStart(overrideSnackbar.event.event.start ? overrideSnackbar.event.event.start.toISOString() : null);
    setOverrideSnackbar({ open: false, event: null });
    handleDialogOpen("paper");
  };

  // Сброс overrideMode при закрытии TaskDialog
  const handleDialogCloseWithReset = useCallback(() => {
    setTaskDialogOpen(false);
    setSelectedTaskStart(null);
    setOverrideMode(null);
    setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
  }, [setUpdates]);

  const handleEventChange = useCallback(
    async (eventInfo) => {
      const offsetHours = Number(calendarSettings?.timeOffset) || 0;
      const applyInverseOffset = (dateInput) => {
        if (!dateInput) return null;
        const date = new Date(dateInput);
        if (!(date instanceof Date) || isNaN(date.getTime())) {
          console.error('[Layout] Invalid date value received in handleEventChange inverse:', dateInput);
          return null;
        }
        if (offsetHours !== 0) {
          date.setHours(date.getHours() + offsetHours);
           if (isNaN(date.getTime())) {
             console.error('[Layout] Invalid date after applying inverse offset:', dateInput, offsetHours);
             return null;
           }
        }
        return date.toISOString();
      };

      const eventDict = {
        title: eventInfo.event.title,
        allDay: eventInfo.event.allDay,
      };

      if (eventInfo.event.start) {
        const originalStart = applyInverseOffset(eventInfo.event.start);
        if (originalStart) eventDict.start = originalStart;
      }

      if (eventInfo.event.end) {
         const originalEnd = applyInverseOffset(eventInfo.event.end);
         if(originalEnd) eventDict.end = originalEnd;
      } else if (eventInfo.event.start && !eventInfo.event.allDay) {
        const receivedStartDate = new Date(eventInfo.event.start);
        if (!isNaN(receivedStartDate.getTime())) {
          receivedStartDate.setHours(receivedStartDate.getHours() + 1);
          const originalEnd = applyInverseOffset(receivedStartDate);
          if(originalEnd) eventDict.end = originalEnd;
        }
      }

      const originalCalendarEvent = calendarEvents?.data?.find(
        (event) => event && event.id == eventInfo.event.id
      );

      // Если это экземпляр повторяющейся задачи — показать диалог выбора
      if (originalCalendarEvent && originalCalendarEvent.rrule && eventDict.start && eventInfo.event.extendedProps?.originalStart) {
        setOverrideDialog({ open: true, eventInfo, mode: null });
        return;
      }

      // Обычная задача или серия — сразу обновляем
      try {
        await updateTask({ taskId: eventInfo.event.id, ...eventDict });
        if (setUpdates && typeof setUpdates === "function")
          setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
        if (fetchCalendarEvents && typeof fetchCalendarEvents === "function")
          await fetchCalendarEvents();
        if (onSuccess) onSuccess('Событие обновлено');
      } catch (err) {
        console.error('Error updating event:', err);
        if (onError) onError(err);
      }
    },
    [calendarSettings, calendarEvents, updateTask, setUpdates, fetchCalendarEvents, onSuccess, onError]
  );

  // Обработка выбора в диалоге override для drag&drop
  const handleOverrideDialogChoice = async (mode) => {
    if (!overrideDialog.eventInfo) return;
    const eventInfo = overrideDialog.eventInfo;
    const offsetHours = Number(calendarSettings?.timeOffset) || 0;
    const applyInverseOffset = (dateInput) => {
      if (!dateInput) return null;
      const date = new Date(dateInput);
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return null;
      }
      if (offsetHours !== 0) {
        date.setHours(date.getHours() + offsetHours);
        if (isNaN(date.getTime())) {
          return null;
        }
      }
      return date.toISOString();
    };
    const eventDict = {
      title: eventInfo.event.title,
      allDay: eventInfo.event.allDay,
    };
    if (eventInfo.event.start) {
      const originalStart = applyInverseOffset(eventInfo.event.start);
      if (originalStart) eventDict.start = originalStart;
    }
    if (eventInfo.event.end) {
      const originalEnd = applyInverseOffset(eventInfo.event.end);
      if(originalEnd) eventDict.end = originalEnd;
    } else if (eventInfo.event.start && !eventInfo.event.allDay) {
      const receivedStartDate = new Date(eventInfo.event.start);
      if (!isNaN(receivedStartDate.getTime())) {
        receivedStartDate.setHours(receivedStartDate.getHours() + 1);
        const originalEnd = applyInverseOffset(receivedStartDate);
        if(originalEnd) eventDict.end = originalEnd;
      }
    }
    if (mode === 'single' && eventInfo.event.extendedProps?.originalStart) {
      eventDict.current_start = eventInfo.event.extendedProps.originalStart;
    }
    try {
      await updateTask({ taskId: eventInfo.event.id, ...eventDict });
      if (setUpdates && typeof setUpdates === "function")
        setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
      if (fetchCalendarEvents && typeof fetchCalendarEvents === "function")
        await fetchCalendarEvents();
      if (onSuccess) onSuccess('Событие обновлено');
    } catch (err) {
      console.error('Error updating event:', err);
      if (onError) onError(err);
    }
    setOverrideDialog({ open: false, eventInfo: null, mode: null });
  };

  return (
    <>
      <CalendarComponent
        calendarRef={calendarRef}
        newSettings={calendarSettings}
        saveSettings={handleSaveCalendarSettings}
        events={calendarEvents.data}
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
        handleClose={handleDialogCloseWithReset}
        handleDelDateClick={handleDelDateClick}
        scroll={dialogScroll}
        setSelectedTaskId={setSelectedTaskId}
        tasks={calendarEvents.data}
        selectedTaskId={selectedTaskId}
        clickedStart={overrideMode === 'single' ? selectedTaskStart : null}
        taskFields={taskFields}
        addSubTask={addSubTask}
        updateTask={updateTask}
        changeTaskStatus={changeTaskStatus}
        deleteTask={deleteTask}
      />
      {/* Snackbar для выбора режима при открытии TaskDialog для экземпляра повторяющейся задачи */}
      <Snackbar
        open={overrideSnackbar.open}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span>Что изменить?</span>
            <Button variant="contained" color="primary" onClick={() => handleOverrideSnackbarChoice('single')}>
              Только этот экземпляр (только {overrideSnackbar.event?.event?.extendedProps?.originalStart ? new Date(overrideSnackbar.event.event.extendedProps.originalStart).toLocaleDateString() : 'этот день'})
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => handleOverrideSnackbarChoice('series')}>
              Всю серию
            </Button>
          </Box>
        }
        ContentProps={{ sx: { minWidth: 320 } }}
        onClose={() => setOverrideSnackbar({ open: false, event: null })}
      />
      {/* Диалог выбора режима для drag&drop повторяющихся задач */}
      <Dialog open={overrideDialog.open} onClose={() => setOverrideDialog({ open: false, eventInfo: null, mode: null })}>
        <DialogTitle>Что изменить?</DialogTitle>
        <DialogContent>
          <Button variant="contained" color="primary" sx={{ my: 1 }} onClick={() => handleOverrideDialogChoice('single')}>
            Только этот экземпляр (только {overrideDialog.eventInfo?.event?.extendedProps?.originalStart ? new Date(overrideDialog.eventInfo.event.extendedProps.originalStart).toLocaleDateString() : 'этот день'})
          </Button>
          <Button variant="outlined" color="secondary" sx={{ my: 1 }} onClick={() => handleOverrideDialogChoice('series')}>
            Всю серию
          </Button>
        </DialogContent>
      </Dialog>
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
