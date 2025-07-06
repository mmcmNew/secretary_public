import { PropTypes } from 'prop-types';
import { useEffect, useRef, useState, useCallback } from "react";
import useTasks from "../ToDo/hooks/useTasks";
import useContainer from "../DraggableComponents/useContainer";
import TaskDialog from "./TaskDialog";
import CalendarComponent from "./CalendarComponent";

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
    setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
  }, [setUpdates]);

  const handleEventClick = useCallback(
    async (event) => {
      setSelectedTaskId(event?.event?.id || null);
      try {
        handleDialogOpen("paper");
      } catch (error) {
        console.error("Error handling event click:", error);
      }
    },
    [handleDialogOpen]
  );

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

    if (originalCalendarEvent && originalCalendarEvent.rrule && eventDict.start) {
       if (typeof originalCalendarEvent.rrule === 'object' && originalCalendarEvent.rrule !== null) {
           eventDict.rrule = {
             ...originalCalendarEvent.rrule,
             dtstart: eventDict.start,
           };
       } else {
            console.warn(`[Layout] Event ${eventInfo.event.id} - Original rrule is not an object during update:`, originalCalendarEvent.rrule)
       }
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
    },
    [calendarSettings, calendarEvents, updateTask, setUpdates, fetchCalendarEvents, onSuccess, onError]
  );

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
        handleClose={handleDialogClose}
        handleDelDateClick={handleDelDateClick}
        scroll={dialogScroll}
        setSelectedTaskId={setSelectedTaskId}
        tasks={calendarEvents.data}
        selectedTaskId={selectedTaskId}
        taskFields={taskFields}
        addSubTask={addSubTask}
        updateTask={updateTask}
        changeTaskStatus={changeTaskStatus}
        deleteTask={deleteTask}
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
