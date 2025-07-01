import { useEffect, useRef, useState } from "react";
import { Box, useMediaQuery } from "@mui/system";
import AntischeduleComponent from "./AntischeduleComponent";
import useContainer from "../DraggableComponents/useContainer";
import useLists from "../ToDo/hooks/useLists";
import useTasks from "../ToDo/hooks/useTasks";
import useAntiSchedule from "../ToDo/hooks/useAntiSchedule";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";


dayjs.extend(utc);
dayjs.extend(timezone);

export default function AntiScheduleLayout({
  containerId,
  antiScheduleSettingsProp = null,
  focusSettingsProp = null,
  onError = null,
  onSuccess = null,
}) {
  const { lists, setSelectedListId } = useLists();
  const {
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

  const eventFields = useRef({
            start: { type: "datetime", name: "Дата начала" },
            end: { type: "datetime", name: "Дата завершения" },
            divider1: { type: "divider" },
            color: { type: "color", name: "Цвет на календаре" },
            is_background: { type: "toggle", name: "Фоновая задача" },
            type_id: {
              type: "select",
              name: "Тип задачи",
              groupBy: 'type',
              options: [
                { value: 1, type: 'work', label: "Продуктивная работа", groupLabel: "Работа" },
                { value: 2, type: 'work', label: "Повседневные задачи", groupLabel: "Работа" },
                { value: 3, type: 'rest', label: "Перерыв", groupLabel: "Отдых" },
                { value: 4, type: 'meals', label: "Обед", groupLabel: "Питание" },
                { value: 5, type: 'study', label: "Учеба", groupLabel: "Учёба" },
                { value: 6, type: 'rest', label: "Прогулка", groupLabel: "Отдых" },
                { value: 7, type: 'personal', label: "Личные дела", groupLabel: "Личное" },
                { value: 8, type: 'personal', label: "Домашние дела", groupLabel: "Личное" },
                { value: 9, type: 'rest', label: "Сон", groupLabel: "Отдых" },
                { value: 10, type: 'social', label: "Переписки", groupLabel: "Общение" },
                { value: 11, type: 'everyday', label: "Планирование", groupLabel: "Повседневное" },
                { value: 12, type: 'work', label: "Составление отчетов", groupLabel: "Работа" },
                { value: 13, type: 'meals', label: "Ужин", groupLabel: "Питание" },
                { value: 14, type: 'meals', label: "Перекус", groupLabel: "Питание" },
                { value: 15, type: 'study', label: "Чтение", groupLabel: "Учёба" },
                { value: 16, type: 'personal', label: "Анализ записей", groupLabel: "Личное" },
                { value: 17, type: 'study', label: "Изучение языков", groupLabel: "Учёба" },
                { value: 18, type: 'personal', label: "Покупки", groupLabel: "Личное" },
                { value: 19, type: 'everyday', label: "Умывание", groupLabel: "Повседневное" },
                { value: 20, type: 'rest', label: "Отдых", groupLabel: "Отдых" },
                { value: 21, type: 'rest', label: "Развлечения", groupLabel: "Отдых" },
                { value: 22, type: 'work', label: "Совещание", groupLabel: "Работа" },
                { value: null, label: "Без типа", groupLabel: "Без группы" }
              ],
            },
            divider3: { type: "divider" },
            files: { type: "string", name: "Добавить файл" },
            note: { type: "text", name: "Заметка" },
          })

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
          const newTasks = await fetchTasks("my_day");
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

  async function handleUpdateTasks() {
    const newTasks = await fetchTasks("my_day");
    const newCalendarEvents = await fetchAntiSchedule();
    const selectedList = lists?.default_lists?.find((list) => list.id === "my_day");
    setMyDayList(selectedList);
    if (selectedList) setSelectedListId(selectedList.id);
    setCalendarEvents(newCalendarEvents || []);
    setMyDayTasks(newTasks);
  }

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
        changeTaskStatus(taskId, updatedFields);
      if (onSuccess) onSuccess('Статус обновлен');
    } catch (err) {
      if (onError) onError(err);
    }
  }

  function updateEventsForCalendar(calendarEvents, timeOffset) {
    if (!calendarEvents) return null;
    let updatedEvents = calendarEvents?.map((event) => {
      const updatedEvent = { ...event };

      // Применяем смещение времени
      const applyOffset = (date) => {
        const newDate = new Date(date);
        newDate.setHours(newDate.getHours() - timeOffset);
        return newDate;
      };

      if (event.start) {
        updatedEvent.start = applyOffset(event.start).toISOString();
      }

      if (event.end) {
        updatedEvent.end = applyOffset(event.end).toISOString();
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
      let newAntiTask = {};
      if (addAntiTask && typeof addAntiTask === "function")
        newAntiTask = await addAntiTask(taskParams);
      if (newAntiTask) {
        setCalendarEvents((prevEvents) => [...prevEvents, newAntiTask]);
        if (onSuccess) onSuccess('Событие добавлено');
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

  // Применяем смещение времени
  const applyOffset = (date, offset) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + offset);
    return newDate.toISOString();
  };

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
      if (updateAntiTask && typeof updateAntiTask === "function") {
        await updateAntiTask(payload);
      }
      // Локальное обновление
      const currentUpdatedTasks = calendarEvents?.map((task) =>
        task.id == payload.taskId ? { ...task, ...payload } : task
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
      await updateTask(taskId, updatedFields);
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

  useEffect(() => {
    let updatedEvents = updateEventsForCalendar(
      calendarEvents,
      newSettings?.timeOffset
    );
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
  }, [newSettings, calendarEvents, myDayTasks, selectedDate]);

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
