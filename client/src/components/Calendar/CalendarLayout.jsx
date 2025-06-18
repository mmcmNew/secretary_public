import { PropTypes } from 'prop-types';
import { useEffect, useRef, useState, useMemo } from "react";
import { useToDo } from "../ToDo/hooks/useToDoContext";
import useContainer from "../DraggableComponents/useContainer";
import TaskDialog from "./TaskDialog";
import CalendarComponent from "./CalendarComponent";

export default function CalendarLayout({
  containerId = null,
  handleDatesSet = null
}) {
  const { updateTask, addTask, calendarEvents, fetchTasks } = useToDo();
  const { defaultLists, projects, updateAll, updateEvents } = useToDo();
  const { taskFields, addSubTask, changeTaskStatus, deleteTask, listsList } = useToDo();
  const { setUpdates } = useContainer();
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

  async function handleDelDateClick(taskId) {
    await updateTask(taskId, { start: null, end: null });
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
    console.log(`[Layout] handleEventChange for event ${eventInfo.event.id}. Received visual/offset start: ${eventInfo.event.start}, end: ${eventInfo.event.end}. Applying INVERSE offset: ${offsetHours}`);

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
      console.log(`[Layout] handleEventChange - Calculated originalStart for save: ${originalStart}`);
    }

    if (eventInfo.event.end) {
       const originalEnd = applyInverseOffset(eventInfo.event.end);
       if(originalEnd) eventDict.end = originalEnd;
       console.log(`[Layout] handleEventChange - Calculated originalEnd for save: ${originalEnd}`);
    } else if (eventInfo.event.start && !eventInfo.event.allDay) {
      const receivedStartDate = new Date(eventInfo.event.start);
      if (!isNaN(receivedStartDate.getTime())) {
        receivedStartDate.setHours(receivedStartDate.getHours() + 1);
        const originalEnd = applyInverseOffset(receivedStartDate);
        if(originalEnd) eventDict.end = originalEnd;
        console.log(`[Layout] handleEventChange - Calculated default originalEnd for save: ${originalEnd}`);
      }
    }

    const originalCalendarEvent = calendarEvents?.find(
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

    await updateTask(eventInfo.event.id, eventDict);
    if (setUpdates && typeof setUpdates === "function")
      setUpdates((prevUpdates) => [...prevUpdates, "todo"]);
  }

  return (
    <>
      <CalendarComponent
        calendarRef={calendarRef}
        newSettings={calendarSettings}
        setNewSettings={setCalendarSettings}
        calendarEvents={calendarEvents}
        handleEventClick={handleEventClick}
        handleEventChange={handleEventChange}
        eventReceive={handleEventChange}
        addTask={addTask}
        fetchTasks={fetchTasks}
        listsList={listsList}
        defaultLists={defaultLists}
        projects={projects}
        updateAll={updateAll}
        updateEvents={updateEvents}
        datesSet={handleDatesSet}
      />
      <TaskDialog
        open={taskDialogOpen}
        handleClose={handleDialogClose}
        handleDelDateClick={handleDelDateClick}
        scroll={dialogScroll}
        setSelectedTaskId={setSelectedTaskId}
        tasks={calendarEvents}
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
};
