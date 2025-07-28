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
import Snackbar from '@mui/material/Snackbar';
import EditIcon from "@mui/icons-material/Edit";
import applyTimeOffset from "../../utils/applyTimeOffset"
import EditOffIcon from "@mui/icons-material/EditOff";
import ListsList from "../ToDo/ListsList";
import NewTaskDialog from "./NewTaskDialog";
import SettingsDialog from "./SettingsDialog";
import TaskDialog from "./TaskDialog";
import PropTypes from "prop-types";

function CalendarComponent({
  calendarRef,
  events = [],
  tasks = [],
  lists = {},
  fetchTasks = () => {},
  fetchEvents = () => {},
  onCreateTask = () => {},
  newSettings,
  saveSettings,
  handleEventClick,
  handleEventChange,
  eventReceive,
  datesSet = null,
  // Props for TaskDialog and Snackbar
  calendarUIState,
  taskFields,
  handleDialogClose,
  handleOverrideChoice,
  setOverrideSnackbar,
  changeInstanceStatus,
  handleTaskChange,
  handleInstanceChange,
  handleDeleteTaskDate,
  addSubTask,
  changeTaskStatus,
  deleteTask,
}) {
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

  const handleTaskCreate = useCallback(
    (taskData) => {
      if (onCreateTask && typeof onCreateTask === 'function') {
        onCreateTask(taskData);
      }
    },
    [onCreateTask]
  );


  const timeOffset = newSettings?.timeOffset || 0;
  const isToggledBGTasksEdit = newSettings?.isToggledBGTasksEdit || false;
  const currentView = newSettings?.currentView || "timeGridMonth";
  const slotDuration = newSettings?.slotDuration || 30;
  const timeRange = newSettings?.timeRange || [8, 24];

  const convertToServerTime = useCallback(
    (data) => {
      const offsetHours = Number(timeOffset) || 0;
      const result = { ...data };

      if (data.start) {
        const converted = applyTimeOffset(data.start, offsetHours);
        if (converted) result.start = converted;
      }

      if (data.end) {
        const convertedEnd = applyTimeOffset(data.end, offsetHours);
        if (convertedEnd) result.end = convertedEnd;
      } else if (data.start && !data.allDay) {
        const tempEnd = new Date(data.start);
        if (!isNaN(tempEnd.getTime())) {
          tempEnd.setHours(tempEnd.getHours() + 1);
          const convertedEnd = applyTimeOffset(tempEnd, offsetHours);
          if (convertedEnd) result.end = convertedEnd;
        }
      }

      return result;
    },
    [timeOffset]
  );

  const processedEvents = useMemo(() => {
    const offsetHours = Number(timeOffset) || 0;

    const applyOffset = (dateInput) => {
      const shifted = applyTimeOffset(dateInput, -offsetHours);
      return shifted ? new Date(shifted) : null;
    };

    let eventsToProcess = Array.isArray(events) ? events : [];

    let calculatedEvents = eventsToProcess.map((event) => {
      if (!event) {
        return null;
      }
      const updatedEvent = { ...event };
      updatedEvent.extendedProps = {
        ...(event.extendedProps || {}),
        originalStart: event.start,
        originalEnd: event.end,
      };

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

      // updatedEvent.display = event.is_background ? "background" : "block";
      // if (newSettings?.currentView === "dayGridMonth" && updatedEvent.display === "background") {
        // updatedEvent.display = "block";
      // }

      return updatedEvent;

    }).filter(event => event !== null);

    if (newSettings && newSettings.isToggledBGTasksEdit) {
        calculatedEvents = calculatedEvents?.filter((event) => event?.display == "background");
        calculatedEvents?.forEach((event) => {
            if(event) event.display = "block";
        });
    }

    return calculatedEvents;

  }, [events, timeOffset, newSettings?.isToggledBGTasksEdit, newSettings?.currentView]);

  useEffect(() => {
    if (selectedListId !== null) {
      fetchTasks(selectedListId);
    }
  }, [selectedListId, fetchTasks]);

  useEffect(() => {
    if (!isCollapsed) {
      fetchEvents();
    }
  }, [isCollapsed, fetchEvents]);

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(processedEvents);
    }
  }, [processedEvents, calendarRef]);

  useEffect(() => {
    if (draggableEl.current && tasks?.length > 0) {
      if (draggableInstance.current) {
        draggableInstance.current.destroy();
      }
      draggableInstance.current = new Draggable(draggableEl.current, {
        itemSelector: ".draggable-task",
        eventData: (eventEl) => {
          const id = eventEl.getAttribute("data-id");
          const task = tasks.find((task) => String(task?.id) === id);

          if (!task) return null;

          setIsCollapsed(true);

          return {
            title: task.title,
            id: task.id,
            start: task.start,
            end: task.end,
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
  }, [tasks]);

  function handleEventReceive(eventInfo) {
    if (eventReceive && typeof eventReceive === "function") {
      const processed = convertToServerTime({
        start: eventInfo.event.start,
        end: eventInfo.event.end,
        allDay: eventInfo.event.allDay,
        title: eventInfo.event.title,
        id: eventInfo.event.id,
        extendedProps: eventInfo.event.extendedProps,
      });
      eventReceive({ ...eventInfo, event: processed });
    }
    eventInfo.event.remove();
  }

  function handleEventChangeWrapper(eventInfo) {
    if (handleEventChange && typeof handleEventChange === "function") {
      const processed = convertToServerTime({
        start: eventInfo.event.start,
        end: eventInfo.event.end,
        allDay: eventInfo.event.allDay,
        title: eventInfo.event.title,
        id: eventInfo.event.id,
        extendedProps: eventInfo.event.extendedProps,
      });
      handleEventChange({ ...eventInfo, event: processed });
    }
  }

  function handleDateSelect(selectInfo) {
    const processed = convertToServerTime({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
    });

    setSelectedDate(processed);
    handleNewTaskDialogOpen("paper");
  }

  const handleSettingsDialogOpen = () => setSettingsDialogOpen(true);
  const handleSettingsDialogClose = () => setSettingsDialogOpen(false);

  function handleApplySettings(tempSlotDuration, tempTimeRange, tempTimeOffset) {
    handleSettingsDialogClose();
    const updatedSettings = { ...newSettings, slotDuration: tempSlotDuration, timeRange: tempTimeRange, timeOffset: tempTimeOffset, }
    saveSettings(updatedSettings);
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

    const originalStart = eventInfo.event.extendedProps?.originalStart || eventInfo.event.start;
    const originalEnd = eventInfo.event.extendedProps?.originalEnd || eventInfo.event.end;

    const startTime = formatTime(originalStart);
    const endTime = formatTime(originalEnd);

    const timeLabel = `${startTime}${endTime ? " - " + endTime : ""}`;

    return {
      html: `<div class="fc-event-title fc-sticky">${timeLabel} - ${eventInfo.event.title}</div>`,
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
    const startStr = calendarApi.view.activeStart.toISOString();
    const endStr = calendarApi.view.activeEnd.toISOString();
    fetchEvents({ start: startStr, end: endStr });
    if (newSettings.currentView !== currentView) {
      saveSettings({ ...newSettings, currentView });
    }
    if (datesSet && typeof datesSet === "function")
      datesSet(currentView, currentDate);
  };

  useEffect(() => {
    if (calendarRef?.current?.getApi) {
      handleDatesSet();
    }
  }, []);

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
      // rrulePlugin,
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
    eventChange: handleEventChangeWrapper,
    eventReceive: handleEventReceive,
    eventDragStart: () => setIsCollapsed(true),
    // eventContent: (arg) => {
    //     if (arg.view.type.startsWith('timeGrid') || arg.view.type === 'dayGridDay') {
    //         return renderEventContent(arg);
    //     }
    //     return null;
    // },
    nowIndicator: true,
  };

  if (newSettings?.currentView?.startsWith('timeGrid') || newSettings?.currentView == 'dayGridDay') 
    calendarProps.eventContent = (arg) => renderEventContent(arg);

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
              saveSettings({
                ...newSettings,
                isToggledBGTasksEdit: !newSettings.isToggledBGTasksEdit,
              });
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
              onCreate={handleTaskCreate}
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
            {calendarUIState && (
              <>
                <TaskDialog
                  open={calendarUIState.taskDialogOpen}
                  handleClose={handleDialogClose}
                  scroll={calendarUIState.dialogScroll}
                  instance={calendarUIState.selectedEvent}
                  subtasks={calendarUIState.selectedSubtasks}
                  task={calendarUIState.parentTask}
                  overrides={calendarUIState.overrides}
                  taskFields={taskFields}
                  addSubTask={addSubTask}
                  changeTaskStatus={changeTaskStatus}
                  changeInstanceStatus={changeInstanceStatus}
                  onChangeTask={handleTaskChange}
                  onChangeInstance={handleInstanceChange}
                  onDeleteTaskDate={handleDeleteTaskDate}
                  deleteTask={deleteTask}
                />
                <Snackbar
                  open={calendarUIState.overrideSnackbar.open}
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  message={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span>Что изменить?</span>
                      <Button variant="contained" color="primary" onClick={() => handleOverrideChoice('single')}>
                        Только этот экземпляр (только {calendarUIState.overrideSnackbar.eventInfo?.event?.extendedProps?.originalStart ? new Date(calendarUIState.overrideSnackbar.eventInfo.event.extendedProps.originalStart).toLocaleDateString() : 'этот день'})
                      </Button>
                      <Button variant="outlined" color="secondary" onClick={() => handleOverrideChoice('series')}>
                        Всю серию
                      </Button>
                    </Box>
                  }
                  onClose={() => setOverrideSnackbar({ open: false, eventInfo: null })}
                />
              </>
            )}
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
                  {tasks && tasks.length > 0 ? (
                    <>
                      {tasks
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
                      {tasks.filter((task) => task.status_id === 2).length >
                        0 && (
                        <>
                          <ListItem>
                            <ListItemText
                              primary="Выполненные задачи:"
                              sx={{ fontWeight: "bold", marginTop: 2 }}
                            />
                          </ListItem>
                          {tasks
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
  events: PropTypes.array,
  tasks: PropTypes.array,
  lists: PropTypes.object,
  fetchTasks: PropTypes.func,
  fetchEvents: PropTypes.func,
  onCreateTask: PropTypes.func,
  newSettings: PropTypes.object.isRequired,
  saveSettings: PropTypes.func.isRequired,
  handleEventClick: PropTypes.func,
  handleEventChange: PropTypes.func,
  eventReceive: PropTypes.func,
  datesSet: PropTypes.func,
  calendarUIState: PropTypes.object,
  taskFields: PropTypes.object,
  handleDialogClose: PropTypes.func,
  handleOverrideChoice: PropTypes.func,
  setOverrideSnackbar: PropTypes.func,
  changeInstanceStatus: PropTypes.func,
  handleTaskChange: PropTypes.func,
  handleInstanceChange: PropTypes.func,
  handleDeleteTaskDate: PropTypes.func,
  addSubTask: PropTypes.func,
  changeTaskStatus: PropTypes.func,
  deleteTask: PropTypes.func,
};

export default React.memo(CalendarComponent);
