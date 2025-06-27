import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import ruLocale from "@fullcalendar/core/locales/ru";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import listPlugin from "@fullcalendar/list";
import {
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Box,
  useTheme,
  ToggleButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EditOffIcon from "@mui/icons-material/EditOff";
import ListsList from "../ToDo/ListsList";
import NewTaskDialog from "./NewTaskDialog";
import SettingsDialog from "./SettingsDialog";
import PropTypes from "prop-types";
import useTasks from "../ToDo/hooks/useTasks";
import useLists from "../ToDo/hooks/useLists";
import useCalendar from "../ToDo/hooks/useCalendar";

function CalendarComponent({
  calendarRef,
  newSettings,
  setNewSettings,
  handleEventClick,
  handleEventChange,
  eventReceive,
  datesSet = null
}) {
  const {
    fetchTasks,
    addTask,
    tasks,
  } = useTasks();
  const { lists } = useLists();
  const {
    calendarEvents,
    fetchCalendarEvents,
  } = useCalendar();
  const draggableEl = useRef(null);
  const draggableInstance = useRef(null);
  const [selectedListId, setSelectedListId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [dialogScroll, setDialogScroll] = useState("paper");
  const [selectedDate, setSelectedDate] = useState(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const currentTheme = useTheme();

  const handleNewTaskDialogOpen = useCallback((scrollType) => {
    setNewTaskDialogOpen(true);
    setDialogScroll(scrollType);
  }, []);

  const timeOffset = newSettings?.timeOffset || 0;
  const isToggledBGTasksEdit = newSettings?.isToggledBGTasksEdit || false;
  const currentView = newSettings?.currentView || "timeGridMonth";
  const slotDuration = newSettings?.slotDuration || 30;
  const timeRange = newSettings?.timeRange || [8, 24];

  const processedEvents = useMemo(() => {
    const offsetHours = Number(timeOffset) || 0;

    const applyOffset = (dateInput) => {
      if (!dateInput) return null;
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return null;
      if (offsetHours !== 0) {
         date.setHours(date.getHours() - offsetHours);
         if (isNaN(date.getTime())) return null;
      }
      return date;
    };

    let eventsToProcess = Array.isArray(calendarEvents?.data) ? calendarEvents.data : [];

    let calculatedEvents = eventsToProcess.map((event) => {
      if (!event) {
        return null;
      }
      const updatedEvent = { ...event };

      const processedStartDate = applyOffset(event.start);
      updatedEvent.start = processedStartDate ? processedStartDate.toISOString() : null;

      let processedEndDate = null;
      if (event.end) {
           processedEndDate = applyOffset(event.end);
      } else if (processedStartDate && !event.allDay) {
           const defaultEndDate = new Date(processedStartDate);
           defaultEndDate.setHours(defaultEndDate.getHours() + 1);
           processedEndDate = defaultEndDate;
      }
      
      updatedEvent.end = processedEndDate ? processedEndDate.toISOString() : null;

      if (event.rrule && updatedEvent.start) {
        if (typeof updatedEvent.rrule === 'object' && updatedEvent.rrule !== null) {
             updatedEvent.rrule = { ...updatedEvent.rrule, dtstart: updatedEvent.start };
        } else {
            console.error(`[Component] Event ${event.id} - rrule is not an object during processing:`, event.rrule);
        }
      }

      const color =
        event?.status_id == 2 ? "#008000" : event?.priority_id == 3 ? "#A52A2A" : event?.color ? event.color : "#3788D8";
      updatedEvent.color = color;
      updatedEvent.backgroundColor = color;
      updatedEvent.borderColor = color;

      updatedEvent.display = event.is_background ? "background" : "block";

      return updatedEvent;

    }).filter(event => event !== null);

    if (newSettings && newSettings.isToggledBGTasksEdit) {
        calculatedEvents = calculatedEvents?.filter((event) => event?.display == "background");
        calculatedEvents?.forEach((event) => {
            if(event) event.display = "block";
        });
    }

    return calculatedEvents;

  }, [calendarEvents, timeOffset, newSettings?.isToggledBGTasksEdit]);

  useEffect(() => {
    if (selectedListId !== null) {
      fetchTasks(selectedListId);
    }
  }, [selectedListId, fetchTasks]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && calendarEvents) {
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(calendarEvents);
    }
  }, [calendarEvents, calendarRef]);

  useEffect(() => {
    if (draggableEl.current && tasks.data?.length > 0) {
      if (draggableInstance.current) {
        draggableInstance.current.destroy();
      }
      draggableInstance.current = new Draggable(draggableEl.current, {
        itemSelector: ".draggable-task",
        eventData: (eventEl) => {
          const id = eventEl.getAttribute("data-id");
          const task = tasks.data.find((task) => String(task?.id) === id);

          if (!task) return null;

          setIsCollapsed(true);

          return {
            title: task.title,
            id: task.id,
            start: task.start,
            end: task.end_date,
            allDay: !task.start,
          };
        },
      });
    }
    return () => {
        if (draggableInstance.current) {
            draggableInstance.current.destroy();
            draggableInstance.current = null;
        }
    }
  }, [tasks.data]);

  function handleEventReceive(eventInfo) {
    if (eventReceive && typeof eventReceive === "function")
      eventReceive(eventInfo);
    eventInfo.event.remove();
  }

  function handleDateSelect(selectInfo) {
    const offsetHours = Number(timeOffset) || 0;

    const applyInverseOffset = (dateInput) => {
      if (!dateInput) return null;
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return null;
      if (offsetHours !== 0) {
        date.setHours(date.getHours() + offsetHours);
        if (isNaN(date.getTime())) return null;
      }
      return date.toISOString();
    };

    const originalStart = applyInverseOffset(selectInfo.startStr);
    const originalEnd = applyInverseOffset(selectInfo.endStr);

    setSelectedDate({
      start: originalStart,
      end: originalEnd,
      allDay: selectInfo.allDay,
    });
    handleNewTaskDialogOpen("paper");
  }

  const handleSettingsDialogOpen = () => setSettingsDialogOpen(true);
  const handleSettingsDialogClose = () => setSettingsDialogOpen(false);

  function handleApplySettings(
    tempSlotDuration,
    tempTimeRange,
    tempTimeOffset
  ) {
    setNewSettings(prevSettings => ({
        ...prevSettings,
        slotDuration: tempSlotDuration,
        timeRange: tempTimeRange,
        timeOffset: tempTimeOffset,
    }));
    handleSettingsDialogClose();
  }

  const slotLabelContent = useCallback(
    (args) => {
      const date = new Date(args.date);
      date.setHours(date.getHours() + (Number(timeOffset) || 0));
      const label = date.toLocaleTimeString(navigator.language, {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      });
      return { html: label };
    },
    [timeOffset]
  );


  function renderEventMonthContent(eventInfo) {

    const formatTime = (date) => {
      if (!date) return "";
      try {
          const dateObj = (date instanceof Date) ? date : new Date(date);
          if (isNaN(dateObj.getTime())) return "";
          return dateObj.toLocaleTimeString(navigator.language, { hour: 'numeric', minute: '2-digit', hour12: false });
      } catch (e) {
          console.error("Error formatting date:", date, e);
          return "";
      }
    };
    const startTime = formatTime(eventInfo.event.start);
    const dotColor = eventInfo.event.backgroundColor || eventInfo.event.borderColor || "#3788D8";

    return {
      html: `<div class="fc-daygrid-event-dot" style="border-color: ${dotColor};"></div>
            <div class="fc-event-time">${startTime}</div>
            <div class="fc-event-title">${eventInfo.event.title}</div>`,
    };
  }

  function renderEventContent(eventInfo) {

    if (eventInfo.event.display === 'background' && !isToggledBGTasksEdit) {
        return { html: `<div class="fc-event-title fc-sticky">${eventInfo.event.title}</div>` };
    }

    const formatTime = (date) => {
      if (!date) return "";
      try {
          const dateObj = (date instanceof Date) ? date : new Date(date);
          if (isNaN(dateObj.getTime())) return "";
          return dateObj.toLocaleTimeString(navigator.language, { hour: 'numeric', minute: '2-digit', hour12: false });
      } catch (e) {
          console.error("Error formatting date:", date, e);
          return "";
      }
    };

    const startTime = formatTime(eventInfo.event.start);
    const endTime = formatTime(eventInfo.event.end);


    return {
      html: `<div class="fc-event-time">${startTime}${endTime ? " - " + endTime : ""}</div>
             <div class="fc-event-title">${eventInfo.event.title}</div>`,
    };
  }

  function handleCancelSettings() {
    handleSettingsDialogClose();
  }

  const handleDatesSet = () => {
    const calendarApi = calendarRef?.current?.getApi();
    if (!calendarApi) return;
    const currentView = calendarApi.view.type;
    const currentDate = calendarApi.getDate();
    if (newSettings.currentView !== currentView) {
      setNewSettings(prev => ({ ...prev, currentView }));
    }
    if (datesSet && typeof datesSet === "function")
      datesSet(currentView, currentDate);
  };

  const calendarProps = {
    locale: ruLocale,
    slotDuration: `00:${String(slotDuration).padStart(2, "0")}:00`,
    slotLabelInterval: `00:${String(slotDuration).padStart(2, "0")}:00`,
    slotMinTime: `${String(timeRange[0]).padStart(2, "0")}:00:00`,
    slotMaxTime: `${String(timeRange[1]).padStart(2, "0")}:00:00`,
    initialView: currentView,
    height: "100%",
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      interactionPlugin,
      listPlugin,
      rrulePlugin,
    ],
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right:
        newSettings?.views || "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
    },
    droppable: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    events: processedEvents,
    slotLabelFormat: {
      hour: "numeric",
      minute: "2-digit",
      omitZeroMinute: false,
      meridiem: "short",
    },
    slotLabelContent,
    select: handleDateSelect,
    datesSet: handleDatesSet,
    eventClick: handleEventClick,
    eventChange: handleEventChange,
    eventReceive: handleEventReceive,
    eventDragStart: () => setIsCollapsed(true),
    eventContent: (arg) => {
        if (arg.view.type === 'dayGridMonth') {
            return renderEventMonthContent(arg);
        } else if (arg.view.type.startsWith('timeGrid') || arg.view.type === 'dayGridDay') {
            return renderEventContent(arg);
        }
        return null;
    },
    nowIndicator: true,
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 1,
          paddingX: 1,
        }}
      >
        <Box>
          <Button onClick={handleSettingsDialogOpen}>Настройки</Button>
          <ToggleButton
            onClick={() => {
              setNewSettings(prevSettings => ({
                ...prevSettings,
                isToggledBGTasksEdit: !prevSettings.isToggledBGTasksEdit,
              }));
            }}
            selected={isToggledBGTasksEdit}
            value="backgroundsEdit"
          >
            {!isToggledBGTasksEdit ? <EditIcon /> : <EditOffIcon />} Фоновые
            задачи
          </ToggleButton>
        </Box>
        <Button
          onClick={() => {
            setSelectedListId(null);
            setIsCollapsed(!isCollapsed);
          }}
        >
          {isCollapsed ? "Показать задачи" : "Скрыть задачи"}
        </Button>
      </Box>
      <Grid
        container
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          height: "100%",
          position: "relative",
        }}
      >
        <Grid width={"100%"}>
          <Paper sx={{ p: 3, flexGrow: 1, overflowY: "auto", height: "100%" }}>
            <FullCalendar ref={calendarRef} {...calendarProps} />
            <NewTaskDialog
              open={newTaskDialogOpen}
              handleClose={() => setNewTaskDialogOpen(false)}
              scroll={dialogScroll}
              selectedDate={selectedDate}
              addTask={addTask}
            />
            {/* Диалоговое окно для настроек */}
            <SettingsDialog
              open={settingsDialogOpen}
              onClose={handleCancelSettings}
              onApply={handleApplySettings}
              slotDuration={slotDuration}
              timeRange={timeRange}
              timeOffset={timeOffset}
            />
          </Paper>
        </Grid>
          <Grid
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: "500px",
              maxWidth: "100%",
              transform: isCollapsed ? "translateX(100%)" : "translateX(0)",
              transition: "transform 0.3s ease",
              zIndex: 10,
              backgroundColor: currentTheme.palette.background.paper,
            }}
          >
            <Paper
              sx={{
                p: 3,
                display: selectedListId ? "none" : "block",
                flexGrow: 1,
                overflowY: "auto",
                height: "100%",
              }}
            >
              <ListsList
                key={selectedListId}
                selectedListId={selectedListId}
                listsList={lists.lists}
                defaultLists={lists.default_lists}
                projects={lists.projects}
                isNeedContextMenu={false}
                setSelectedListId={setSelectedListId}
              />
            </Paper>
            {selectedListId && (
              <Paper
                sx={{ p: 3, flexGrow: 1, overflowY: "auto", height: "100%" }}
              >
                <Button onClick={() => setSelectedListId(null)}>Back</Button>
                <List ref={draggableEl}>
                  {/* Список невыполненных задач */}
                  {tasks.data && tasks.data.length > 0 ? (
                    <>
                      {tasks.data
                        .filter((task) => task.status_id !== 2)
                        .map((task) => (
                          <ListItem
                            key={task.id}
                            className="draggable-task"
                            data-id={task.id}
                            sx={{ cursor: "pointer" }}
                          >
                            <ListItemText primary={task.title} />
                          </ListItem>
                        ))}

                      {/* Список выполненных задач */}
                      {tasks.data.filter((task) => task.status_id === 2).length >
                        0 && (
                        <>
                          <ListItem>
                            <ListItemText
                              primary="Выполненные задачи:"
                              sx={{ fontWeight: "bold", marginTop: 2 }}
                            />
                          </ListItem>
                          {tasks.data
                            .filter((task) => task.status_id === 2)
                            .map((task) => (
                              <ListItem
                                key={task.id}
                                className="draggable-task"
                                data-id={task.id}
                                sx={{
                                  cursor: "pointer",
                                  textDecoration: "line-through",
                                  color: "gray",
                                }}
                              >
                                <ListItemText primary={task.title} />
                              </ListItem>
                            ))}
                        </>
                      )}
                    </>
                  ) : (
                    <ListItem>
                      <ListItemText primary="No tasks available" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            )}
          </Grid>
      </Grid>
    </Box>
  );
}

CalendarComponent.propTypes = {
  calendarRef: PropTypes.object,
  newSettings: PropTypes.object.isRequired,
  setNewSettings: PropTypes.func.isRequired,
  handleEventClick: PropTypes.func,
  handleEventChange: PropTypes.func,
  eventReceive: PropTypes.func,
  datesSet: PropTypes.func,
};

export default React.memo(CalendarComponent);
