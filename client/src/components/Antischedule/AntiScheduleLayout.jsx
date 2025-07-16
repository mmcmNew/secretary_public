import { useEffect, useRef, useState, useMemo } from "react";
import { Box } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import AntischeduleComponent from "./AntischeduleComponent";
import useContainer from "../DraggableComponents/useContainer";
import useTasks from "../ToDo/hooks/useTasks";
import useAntiSchedule from "../ToDo/hooks/useAntiSchedule";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import applyTimeOffset from "../../utils/applyTimeOffset";


dayjs.extend(utc);
dayjs.extend(timezone);

// Helper that applies a time offset in hours and returns an ISO string
function applyOffset(date, offset = 0) {
  return applyTimeOffset(date, offset);
}

export default function AntiScheduleLayout({
  containerId,
  antiScheduleSettingsProp = null,
  focusSettingsProp = null,
  onError = null,
  onSuccess = null,
}) {
  const {
    lists,
    setSelectedListId,
    fetchTasks,
    updateTask,
    changeTaskStatus,
    deleteTask,
    taskFields,
  } = useTasks();
  const {
    antiSchedule,
    fetchAntiSchedule,
    addAntiTask,
    updateAntiTask,
    deleteAntiTask,
  } = useAntiSchedule();
  const listsList = lists?.lists || [];
  const defaultLists = lists?.default_lists || [];
  const projects = lists?.projects || [];
  const [mode, setMode] = useState("focus");
  // const { setUpdates } = useContainer();
  const calendarRef = useRef(null);
  const [myDayTasks, setMyDayTasks] = useState([]);
  const [myDayList, setMyDayList] = useState(null);
  const [currentTasks, setCurrentTasks] = useState([])
  const [calendarEvents, setCalendarEvents] = useState(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [dialogScroll, setDialogScroll] = useState("paper");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [updatedCalendarEvents, setUpdatedCalendarEvents] = useState(null);
  const [currentTaskFields, setCurrentTaskFields] = useState({})
  const [currentTaskType, setCurrentTaskType] = useState(null)
  const [newRecordDialogOpen, setNewRecordDialogOpen] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const isMobileQuery = useMediaQuery("(max-width: 1100px)");

  const [isMobile, setIsMobile] = useState(isMobileQuery);

  useEffect(() => {
    const mode = isMobile ? "focus" : "calendar";
    handleSetMode(mode);

  }, [])

  useEffect(() => {
        // console.log('isMobileQuery', isMobileQuery);
        setIsMobile(isMobileQuery);
    }, [isMobileQuery]);

  const eventFields = useRef(null)

  useEffect(() => {
    if (taskFields && taskFields.type_id) {
      eventFields.current = {
        start: { type: "datetime", name: "Дата начала" },
        end: { type: "datetime", name: "Дата завершения" },
        divider1: { type: "divider" },
        color: { type: "color", name: "Цвет на календаре" },
        is_background: { type: "toggle", name: "Фоновая задача" },
        type_id: {
          type: "select",
          name: "Тип задачи",
          groupBy: 'type',
          options: taskFields.type_id.options || [],
        },
        divider3: { type: "divider" },
        files: { type: "string", name: "Добавить файл" },
        note: { type: "text", name: "Заметка" },
      }
    }
  }, [taskFields])

  const [newSettings, setNewSettings] = useState(
    antiScheduleSettingsProp || {
      slotDuration: 30,
      timeRange: [8, 24],
      timeOffset: 0,
      currentView: "timeGridDay",
      views: "timeGridWeek,timeGridDay",
    },
  );

  const defaultFocusSettings = {
    workIntervalDuration: 30 * 60,
    breakDuration: 5 * 60,
    additionalBreakDuration: 15 * 60,
    isBackgroundTasks: true,
  };

  const [focusSettings, setFocusSettings] = useState(
    focusSettingsProp || defaultFocusSettings
  );

  useEffect(() => {
    if (antiScheduleSettingsProp) {
      setNewSettings(antiScheduleSettingsProp);
    }
  }, [antiScheduleSettingsProp]);

  useEffect(() => {
    if (focusSettingsProp) {
      setFocusSettings(focusSettingsProp);
    }
  }, [focusSettingsProp]);
  const { handleContainerResize, handleUpdateContent } = useContainer();

  const handleSaveSettings = (settings) => {
    try {
      setNewSettings(settings);
      if (handleUpdateContent && containerId) {
        handleUpdateContent(containerId, { antiScheduleSettingsProp: settings });
      }
      if (onSuccess) onSuccess('Настройки сохранены');
    } catch (err) {
      console.error('Error saving anti schedule settings:', err);
      if (onError) onError(err);
    }
  };

  const handleSaveFocusSettings = (settings) => {
    try {
      setFocusSettings(settings);
      if (handleUpdateContent && containerId) {
        handleUpdateContent(containerId, { focusSettingsProp: settings });
      }
      if (onSuccess) onSuccess('Настройки сохранены');
    } catch (err) {
      console.error('Error saving focus settings:', err);
      if (onError) onError(err);
    }
  };

  useEffect(() => {
    const getAndSetCalendarEvents = async () => {
      if (!calendarEvents?.loading) {
        try {
          const newCalendarEvents = await fetchAntiSchedule();
          setCalendarEvents(newCalendarEvents || []);
        } catch (err) {
          if (onError) onError(err);
        }
      }
    };

    const fetchAndSetTasks = async () => {
      if (!myDayTasks?.loading) {
        try {
          const newTasks = await fetchTasks('my_day');
          if (newTasks && Array.isArray(newTasks)) {
            setMyDayTasks(newTasks);
          } else if (newTasks && Array.isArray(newTasks.tasks)) {
            setMyDayTasks(newTasks.tasks);
          } else {
            setMyDayTasks([]);
          }
        } catch (err) {
          if (onError) onError(err);
        }
      }
    };

    fetchAndSetTasks();
    getAndSetCalendarEvents();
  }, []);

  // Корректно ищем myDayList при изменении lists
  useEffect(() => {
    // console.log('[AntiScheduleLayout] lists:', lists);
    if (lists?.default_lists) {
      const selectedList = lists.default_lists.find((list) => list.id === "my_day");
      // console.log('[AntiScheduleLayout] found selectedList:', selectedList);
      setMyDayList(selectedList);
      // if (selectedList) setSelectedListId(selectedList.id);
    }
  }, [lists]);

  useEffect(() => {
    setCalendarEvents(antiSchedule.data || []);
  }, [antiSchedule.data]);

  // Лог для props FocusModeComponent
  // useEffect(() => {
  //   console.log('[AntiScheduleLayout] myDayTasks:', myDayTasks);
  //   console.log('[AntiScheduleLayout] myDayList:', myDayList);
  // }, [myDayTasks, myDayList]);


  async function handleDelDateClick(taskId) {
    try {
      await deleteAntiTask({ taskId });
      setTaskDialogOpen(false);
      const newCalendarEvents = calendarEvents?.filter((event) => event.id != taskId);
      setCalendarEvents(newCalendarEvents);
      if (onSuccess) onSuccess('Дата удалена');
    } catch (err) {
      if (onError) onError(err);
    }
  }

  const handleDialogOpen = (scrollType) => {
    setTaskDialogOpen(true);
    setDialogScroll(scrollType);
  };

  const handleDialogClose = () => {
    setTaskDialogOpen(false);
    // console.log("handleClose");
    // setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
  };

  const handleNewRecordDialogOpen = () => {
    setNewRecordDialogOpen(true);
  };

  const handleNewRecordDialogClose = () => {
    setNewRecordDialogOpen(false);
  };

  async function handleEventClick(event) {
    setCurrentTaskFields(eventFields.current);
    setCurrentTasks(calendarEvents);
    setSelectedTaskId(event?.event?.id || null);
    setCurrentTaskType("event");
    try {
      handleDialogOpen("paper");
    } catch (error) {
      console.error("Error handling event click:", error);
    }
  }

  function handleTaskClick(taskId) {
    setCurrentTaskFields(taskFields);
    setCurrentTasks(myDayTasks);
    setSelectedTaskId(taskId || null);
    setCurrentTaskType("task");
    try {
      handleDialogOpen("paper");
    } catch (error) {
      console.error("Error handling event click:", error);
    }
  }

  function handleChangeEventStatus(eventId, updatedFields) {
    // console.log("handleChangeEventStatus", eventId, updatedFields);
    const eventColor = updatedFields.status_id == 2 ? "green" : "#3788D8";
    const updatedEvents = calendarEvents.map((event) => (event.id == eventId ? { ...event, ...updatedFields, color: eventColor } : event));
    setCalendarEvents(updatedEvents);
    setCurrentTasks(updatedEvents);

    // Обновляем updatedCalendarEvents
    const updatedCalendarEvents = updateEventsForCalendar(
      updatedEvents,
      newSettings?.timeOffset
    );
    setUpdatedCalendarEvents(updatedCalendarEvents);

    try {
      if (updateAntiTask && typeof updateAntiTask === "function")
        updateAntiTask({ taskId: eventId, ...updatedFields });
      if (onSuccess) onSuccess('Статус обновлен');
    } catch (err) {
      if (onError) onError(err);
    }
  }

  function handleChangeTaskStatus(taskId, updatedFields) {
    const eventColor = updatedFields.status_id == 2 ? "green" : "#3788D8";
    const updatedTasks = myDayTasks.map((task) => (task.id == taskId ? { ...task, ...updatedFields, color: eventColor } : task));
    setMyDayTasks(updatedTasks);
    setCurrentTasks(updatedTasks);

    try {
      if (changeTaskStatus && typeof changeTaskStatus === "function")
        changeTaskStatus({ taskId, listId: myDayList?.id, ...updatedFields });
      if (onSuccess) onSuccess('Статус обновлен');
    } catch (err) {
      if (onError) onError(err);
    }
  }

  function updateEventsForCalendar(calendarEvents, timeOffset) {
    if (!calendarEvents) return null;
    let updatedEvents = calendarEvents?.map((event) => {
      const updatedEvent = { ...event };

      if (event.start) {
        updatedEvent.start = applyOffset(event.start, -timeOffset);
      }

      if (event.end) {
        updatedEvent.end = applyOffset(event.end, -timeOffset);
      }

      const color =
        event?.status_id == 2
          ? "#008000"
          : event?.priority_id == 3
          ? "#A52A2A"
          : event?.color
          ? event.color
          : "#3788D8";
      updatedEvent.color = color;

      const eventDisplay = event.is_background ? "background" : "block";
      updatedEvent.display = eventDisplay;

      return updatedEvent;
    });
    return updatedEvents;
  }

  async function handleAddAntiTask(taskParams){
    try {
      taskParams.is_background = 0;
      if (addAntiTask && typeof addAntiTask === "function"){
        let result = await addAntiTask(taskParams);
        if (result?.task){
          setCalendarEvents(prev => [...prev, result.task]);
          if (onSuccess) onSuccess('Событие добавлено');
        }
      }
    } catch (err) {
      if (onError) onError(err);
    }
  }

  function handleEventReceive(eventInfo) {
    // console.log('handleEventReceive: eventInfo: ', eventInfo);
    let eventStart = eventInfo.event.start.toISOString();
    let eventEnd = eventInfo.event.end
    if (!eventInfo.event.end)
      eventEnd = dayjs(eventInfo.event.start).add(60, 'minute').toISOString()
    // console.log(eventEnd)
    if (newSettings && newSettings.timeOffset){
      eventStart = applyOffset(eventInfo.event.start, newSettings.timeOffset);
      eventEnd = applyOffset(eventInfo.event.end, newSettings.timeOffset);
    }
    const taskParams = {
      title: eventInfo.event.title,
      start: eventStart,
      end: eventEnd,
    }
    handleAddAntiTask(taskParams);
  }


  async function handleEventChange(eventInfo) {
    // console.log('handleEventChange: eventInfo:', eventInfo);
    const eventDict = {
      title: eventInfo.event.title,
    };

    if (eventInfo.event.start) {
      eventDict.start = applyOffset(
        eventInfo.event.start,
        newSettings?.timeOffset
      );
    }

    if (eventInfo.event.end) {
      eventDict.end = applyOffset(
        eventInfo.event.end,
        newSettings?.timeOffset
      );
    } else {
      // Время start + 1 час
      const endDate = new Date(eventInfo.event.start);
      endDate.setHours(endDate.getHours() + 1);
      eventDict.end = applyOffset(endDate, newSettings?.timeOffset);
    }
    // console.log('eventDict', eventDict);
    try {
      setCalendarEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id == eventInfo.event.id ? { ...event, ...eventDict } : event
        )
      );
      if (updateAntiTask && typeof updateAntiTask === "function") {
        await updateAntiTask({ taskId: eventInfo.event.id, ...eventDict });
      }
      if (onSuccess) onSuccess('Событие обновлено');
    } catch (err) {
      if (onError) onError(err);
    }
  }

  // Отдельная функция для обновления антизадачи (antiSchedule event) — принимает только payload
  const handleUpdateAntiTask = async (payload) => {
    try {
      // console.log('[DEBUG] handleUpdateAntiTask: calling updateAntiTask with', payload);
      let res = null;
      if (updateAntiTask && typeof updateAntiTask === "function") {
        res = await updateAntiTask(payload);
      }
      // Локальное обновление
      const currentUpdatedTasks = calendarEvents?.map((task) =>
        task.id == payload.taskId
          ? { ...task, ...(res?.task || payload) }
          : task
      );
      setCalendarEvents(currentUpdatedTasks);
      setCurrentTasks(currentUpdatedTasks);
      const updatedEvents = updateEventsForCalendar(
        currentUpdatedTasks,
        newSettings?.timeOffset
      );
      setUpdatedCalendarEvents(updatedEvents);
      if (updatedEvents) {
        const newSelectedDayTasks = updatedEvents.filter((task) => {
          const taskDate = dayjs(task.start);
          return taskDate.isSame(selectedDate, 'day');
        });
        setSelectedDayTasks(newSelectedDayTasks);
      }
      if (onSuccess) onSuccess('Событие обновлено');
    } catch (error) {
      console.error("[DEBUG] Ошибка обновления антизадачи:", error);
      if (onError) onError(error);
    }
  };

  // Отдельная функция для обновления обычной задачи (ToDo)
  const handleUpdateToDoTask = async (taskId, updatedFields) => {
    try {
      // console.log('[DEBUG] handleUpdateToDoTask: calling updateTask for ToDo', taskId, updatedFields);
      await updateTask({ taskId, listId: myDayList?.id, ...updatedFields });
      const currentUpdatedTasks = myDayTasks?.map((task) =>
        task.id == taskId ? { ...task, ...updatedFields } : task
      );
      setMyDayTasks(currentUpdatedTasks);
      setCurrentTasks(currentUpdatedTasks);
      if (onSuccess) onSuccess('Задача обновлена');
    } catch (error) {
      console.error("[DEBUG] Ошибка обновления задачи:", error);
      if (onError) onError(error);
    }
  };

  // handleUpdateTask теперь принимает (taskId, updatedFields) для задач и (payload) для событий
  async function handleUpdateTask(arg1, arg2) {
    if (currentTaskType === "event") {
      // Для событий антирасписания всегда передаем payload-объект
      await handleUpdateAntiTask(arg1);
    } else if (currentTaskType === "task") {
      // Для задач ToDo — taskId, updatedFields
      await handleUpdateToDoTask(arg1, arg2);
    }
  }

  function handleDatesSet(newView, newDate) {
    setSelectedDate(newDate);
    let newSelectedDayTasks = null
    if (newView === 'timeGridDay' || newView === 'dayGridDay') {
      newSelectedDayTasks = updatedCalendarEvents?.filter((task) => {
        const taskDate = dayjs(task.start);
        return taskDate.isSame(newDate, 'day');
      });
    }
    setSelectedDayTasks(newSelectedDayTasks)
  }

  const memoizedCalendarEvents = useMemo(
    () => updateEventsForCalendar(calendarEvents, newSettings?.timeOffset),
    [calendarEvents, newSettings?.timeOffset]
  );

  useEffect(() => {
    let updatedEvents = memoizedCalendarEvents;
    if (newSettings && newSettings.isToggledBGTasksEdit) {
      updatedEvents = updatedEvents?.filter(
        (event) => event.display == "background"
      );
      updatedEvents.forEach((event) => {
        event.display = "block";
      });
    }
    setUpdatedCalendarEvents(updatedEvents);
    // console.log('[DEBUG] useEffect calendarEvents/newSettings: updatedEvents', updatedEvents);
    // Обновляем selectedDayTasks при изменении календарных событий
    if (updatedEvents) {
      const newSelectedDayTasks = updatedEvents.filter((task) => {
        const taskDate = dayjs(task.start);
        return taskDate.isSame(selectedDate, 'day');
      });
      setSelectedDayTasks(newSelectedDayTasks);
      // console.log('[DEBUG] useEffect: setSelectedDayTasks', newSelectedDayTasks);
    }
  }, [memoizedCalendarEvents, newSettings?.isToggledBGTasksEdit, selectedDate]);

  // Добавляем инициализацию при монтировании
  useEffect(() => {
    if (updatedCalendarEvents) {
      const initialSelectedDayTasks = updatedCalendarEvents.filter((task) => {
        const taskDate = dayjs(task.start);
        return taskDate.isSame(selectedDate, 'day');
      });
      setSelectedDayTasks(initialSelectedDayTasks);
      // console.log('[DEBUG] useEffect: updatedCalendarEvents changed, setSelectedDayTasks', initialSelectedDayTasks);
    }
  }, [updatedCalendarEvents, selectedDate]);

  function handleSetMode(newMode=null) {
    // console.log(mode);
    if (!newMode)
      newMode = mode
    if (mode == "focus") {
      setMode("calendar");
      if (!isMobile)
        handleContainerResize(containerId, { width: 1230 });
    } else {
      setMode("focus");
      handleContainerResize(containerId, { width: 540 });
    }
  }

  function handleAdditionalButtonClick(task) {
    // console.log(task);
    handleAddAntiTask(task)
  }

  const handleSaveCalendarSettings = (settings) => {
    setNewSettings(settings);
    if (handleUpdateContent && containerId) {
      handleUpdateContent(containerId, { antiScheduleSettingsProp: settings });
    }
  };

  return (
    <AntischeduleComponent
      containerId={containerId}
      mode={mode}
      isMobile={isMobile}
      setIsMobile={setIsMobile}
      handleSetMode={handleSetMode}
      handleNewRecordDialogOpen={handleNewRecordDialogOpen}
      handleTaskClick={handleTaskClick}
      handleAdditionalButtonClick={handleAdditionalButtonClick}
      calendarRef={calendarRef}
      newSettings={newSettings}
      saveSettings={handleSaveSettings}
      focusSettings={focusSettings}
      saveFocusSettings={handleSaveFocusSettings}
      updatedCalendarEvents={updatedCalendarEvents}
      myDayTasks={myDayTasks}
      myDayList={myDayList}
      listsList={listsList}
      defaultLists={defaultLists}
      projects={projects}
      handleEventClick={handleEventClick}
      handleEventChange={handleEventChange}
      eventReceive={handleEventReceive}
      handleAddAntiTask={handleAddAntiTask}
      fetchTasks={fetchTasks}
      fetchAntiSchedule={fetchAntiSchedule}
      handleDatesSet={handleDatesSet}
      selectedDayTasks={selectedDayTasks}
      taskDialogOpen={taskDialogOpen}
      handleDialogClose={handleDialogClose}
      handleDelDateClick={handleDelDateClick}
      dialogScroll={dialogScroll}
      setSelectedTaskId={setSelectedTaskId}
      currentTasks={currentTasks}
      selectedTaskId={selectedTaskId}
      currentTaskFields={currentTaskFields}
      handleUpdateTask={handleUpdateTask}
      currentTaskType={currentTaskType}
      handleChangeTaskStatus={handleChangeTaskStatus}
      handleChangeEventStatus={handleChangeEventStatus}
      deleteTask={deleteTask}
      newRecordDialogOpen={newRecordDialogOpen}
      handleNewRecordDialogClose={handleNewRecordDialogClose}
      updateTask={updateTask}
      updateAntiTask={handleUpdateAntiTask}
      changeTaskStatus={changeTaskStatus}
    />
  );
}

AntiScheduleLayout.propTypes = {
  containerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  antiScheduleSettingsProp: PropTypes.object,
  focusSettingsProp: PropTypes.object,
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
};
