import { PropTypes } from 'prop-types';
import { useEffect, useRef, useState, useMemo } from "react";
import useTasks from "../ToDo/hooks/useTasks";
import useLists from "../ToDo/hooks/useLists";
import useCalendar from "../ToDo/hooks/useCalendar";
import useContainer from "../DraggableComponents/useContainer";
import TaskDialog from "./TaskDialog";
import CalendarComponent from "./CalendarComponent";

export default function CalendarLayout({
  containerId = null,
  handleDatesSet = null,
  calendarSettingsProp = null,
}) {
  const { updateTask, addTask, fetchTasks, taskFields, addSubTask, changeTaskStatus, deleteTask } = useTasks();
  const { lists, selectedListId, selectedList } = useLists();
  const { calendarEvents } = useCalendar();
  const { setUpdates, handleUpdateContent } = useContainer();
  const calendarRef = useRef(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [dialogScroll, setDialogScroll] = useState("paper");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [calendarSettings, setCalendarSettings] = useState({
    slotDuration: 30,
    timeRange: [8, 24],
    timeOffset: 0,
    currentView: "timeGridWeek",
    views: "timeGridWeek,timeGridDay,dayGridMonth,listWeek",
    isToggledBGTasksEdit: false,
  });

  // инициализация настроек из пропсов
  useEffect(() => {
    if (calendarSettingsProp) {
      setCalendarSettings(calendarSettingsProp);
    }
  }, [calendarSettingsProp]);

  // сохранение настроек в контейнере
  useEffect(() => {
    if (handleUpdateContent && containerId) {
      handleUpdateContent(containerId, { calendarSettingsProp: calendarSettings });
    }
  }, [calendarSettings, handleUpdateContent, containerId]);

  async function handleDelDateClick(taskId) {
    await updateTask({ taskId, start: null, end: null });
    setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
  }

  const handleDialogOpen = (scrollType) => {
    setTaskDialogOpen(true);
    setDialogScroll(scrollType);
  };

  const handleDialogClose = () => {
    setTaskDialogOpen(false);
    setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
  };

  async function handleEventClick(event) {
    setSelectedTaskId(event?.event?.id || null);
    try {
      handleDialogOpen("paper");
    } catch (error) {
      console.error("Error handling event click:", error);
    }
  }

  async function handleEventChange(eventInfo) {
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

    await updateTask({ taskId: eventInfo.event.id, ...eventDict });
    if (setUpdates && typeof setUpdates === "function")
      setUpdates((prevUpdates) => [...prevUpdates, "todo"]);
  }

  return (
    <>
      <CalendarComponent
        calendarRef={calendarRef}
        newSettings={calendarSettings}
        setNewSettings={setCalendarSettings}
        calendarEvents={calendarEvents.data}
        handleEventClick={handleEventClick}
        handleEventChange={handleEventChange}
        eventReceive={handleEventChange}
        addTask={addTask}
        fetchTasks={fetchTasks}
        listsList={lists.lists}
        defaultLists={lists.default_lists}
        projects={lists.projects}
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
};
