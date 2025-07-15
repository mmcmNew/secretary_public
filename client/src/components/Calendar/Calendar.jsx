import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import ruLocale from "@fullcalendar/core/locales/ru";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import listPlugin from "@fullcalendar/list";
import { Button, Grid, List, ListItem, ListItemText, Paper, Box, useTheme, ToggleButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EditOffIcon from "@mui/icons-material/EditOff";
import useTasks from "../ToDo/hooks/useTasks";
import ListsList from "../ToDo/ListsList";
import useContainer from "../DraggableComponents/useContainer";
import TaskDialog from "./TaskDialog";
import NewTaskDialog from "./NewTaskDialog";
import SettingsDialog from "./SettingsDialog";

export default function Calendar() {
    const { updateTask, addTask, fetchTasks, taskFields, addSubTask, changeTaskStatus, deleteTask, lists, updateList, deleteFromChildes, linkListGroup, calendarEvents, fetchCalendarEvents } = useTasks();
    const { setUpdates } = useContainer();
    const calendarRef = useRef(null);
    const draggableEl = useRef(null);
    const draggableInstance = useRef(null);
    const [selectedListId, setSelectedListId] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isToggledBGTasksEdit, setIsToggled] = useState(false);
    const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
    const [dialogScroll, setDialogScroll] = useState("paper");
    const [selectedDate, setSelectedDate] = useState(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [slotDuration, setSlotDuration] = useState(30);
    const [timeRange, setTimeRange] = useState([8, 24]);
    const timeOffset = useRef(0);
    const currentTheme = useTheme();
    const [currentView, setCurrentView] = useState("dayGridMonth");
    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    useEffect(() => {
        const fetchAndSetTasks = async () => {
            const newTasks = await fetchTasks(selectedListId);
            setTasks(newTasks);
        };

        fetchAndSetTasks();
    }, [selectedListId]);

    useEffect(() => {
        // Создаем локальную версию событий с учетом смещения времени
        // console.log('calendarEvents:', calendarEvents);
        let updatedEvents = calendarEvents?.map((event) => {
            const updatedEvent = { ...event };

            // Применяем смещение времени
            const applyOffset = (date) => {
                const newDate = new Date(date);
                newDate.setHours(newDate.getHours() - timeOffset.current);
                return newDate;
            };

            if (event.start) {
                updatedEvent.start = applyOffset(event.start).toISOString();
            }

            if (event.end) {
                updatedEvent.end = applyOffset(event.end).toISOString();
            }

            if (event.rrule) {
                // Преобразуем dtstartDate обратно в строку ISO и присваиваем его rrule.dtstart
                updatedEvent.rrule.dtstart = updatedEvent.start;
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

            return updatedEvent;
        });
        // console.log('Updated calendarEvents:', updatedEvents)
        // Обновляем события на календаре
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.removeAllEvents();
        }
        if (isToggledBGTasksEdit) {
            updatedEvents = updatedEvents?.filter((event) => event.display == "background");
            updatedEvents.forEach((event) => {
                event.display = "block";
            });
            // console.log('updatedEvents:', updatedEvents)
            calendarApi.addEventSource(updatedEvents);
        } else {
            calendarApi.addEventSource(updatedEvents);
        }

        // setUpdatedCalendarEvents(updatedEvents);
    }, [timeOffset.current, isToggledBGTasksEdit, currentView, calendarEvents]);

    // useEffect для отслеживания изменения представления
    useEffect(() => {
        const calendarApi = calendarRef.current?.getApi();

        if (calendarApi) {
            // Устанавливаем начальное представление
            setCurrentView(calendarApi.view.type);

            // Обработчик для события datesSet (изменение представления или дат)
            const handleViewChange = () => {
                const newView = calendarApi.view.type;
                setCurrentView(newView); // Обновляем состояние при изменении представления
                console.log("New view:", newView);
            };

            // Слушаем событие 'datesSet' (оно срабатывает при смене view)
            calendarApi.on("datesSet", handleViewChange);

            // Убираем обработчик при размонтировании компонента
            return () => {
                calendarApi.off("datesSet", handleViewChange);
            };
        }
    }, []);

    function applyTimeOffsetToGrid(offset, theme) {
        // console.log('applyTimeOffsetToGrid: offset:', offset, 'timeOffset: ', timeOffset.current, 'theme: ', theme);

        // Если сразу обновлять все метки времени, то календарь ломается и не удается создавать задачи
        // Поэтому пока нет оффсета возвращаю меткам стандартный вид
        if (offset == 0) {
            let newTimeElements = document.querySelectorAll(".newTimeElement");
            newTimeElements.forEach((element) => {
                element.remove();
            });
            return;
        }

        const timeElements = document.querySelectorAll(".fc-timegrid-slot-label");
        // console.log(timeElements);
        timeElements.forEach((element) => {
            const cushionElement = element.querySelector(".fc-timegrid-slot-label-cushion");
            if (cushionElement) {
                let originalTime = element.getAttribute("data-original-time");
                if (!originalTime) {
                    originalTime = cushionElement.textContent;
                    element.setAttribute("data-original-time", originalTime);
                }

                const timeParts = originalTime.split(":");
                if (timeParts.length > 1) {
                    const hours = parseInt(timeParts[0], 10);
                    const minutes = parseInt(timeParts[1], 10);

                    const date = new Date();
                    date.setHours(hours);
                    date.setMinutes(minutes);

                    if (offset !== 0) date.setHours(date.getHours() + offset);

                    const newHours = String(date.getHours()).padStart(2, "0");
                    const newMinutes = String(date.getMinutes()).padStart(2, "0");

                    const newTimeElement = document.createElement("div");
                    newTimeElement.className = "MuiPaper-root newTimeElemet";
                    newTimeElement.style.backgroundColor = theme.palette.background.paper;
                    newTimeElement.style.position = "absolute";
                    newTimeElement.style.top = "0";
                    newTimeElement.style.left = "0";
                    newTimeElement.style.width = "100%";
                    newTimeElement.style.height = "100%";
                    newTimeElement.style.display = "flex";
                    newTimeElement.style.alignItems = "center";
                    newTimeElement.style.justifyContent = "center";

                    // Вставляем текст через Typography
                    const typographyElement = document.createElement("div");
                    typographyElement.className = "MuiTypography-root"; // Класс MUI для стилей Typography
                    typographyElement.textContent = `${newHours}:${newMinutes}`;

                    newTimeElement.appendChild(typographyElement);

                    // Обертываем оригинальный элемент в новый контейнер
                    const container = document.createElement("div");
                    container.style.position = "relative";
                    element.innerHTML = ""; // Очистка содержимого элемента
                    container.appendChild(cushionElement);
                    container.appendChild(newTimeElement);
                    element.appendChild(container);
                }
            }
        });
    }

    useEffect(() => {
        applyTimeOffsetToGrid(timeOffset.current, currentTheme); // Обновляем стили при изменении темы
    }, [currentTheme, currentView, timeRange, slotDuration]);

    const handleDialogOpen = (scrollType) => {
        setDialogOpen(true);
        setDialogScroll(scrollType);
    };

    const handleNewTaskDialogOpen = (scrollType) => {
        setNewTaskDialogOpen(true);
        setDialogScroll(scrollType);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setNewTaskDialogOpen(false);
        console.log("handleClose");
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

    useEffect(() => {
        if (draggableEl.current) {
            if (draggableInstance.current) {
                draggableInstance.current.destroy(); // Очистка предыдущего экземпляра
            }
            draggableInstance.current = new Draggable(draggableEl.current, {
                itemSelector: ".draggable-task",
                eventData: (eventEl) => {
                    const id = eventEl.getAttribute("data-id");
                    const task = tasks.find((task) => String(task.id) === id);

                    // Скрываем задачи при начале перетаскивания
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
    }, [tasks]);

    function handleEventReceive(eventInfo) {
        handleEventChange(eventInfo);

        // Закрываем панель при завершении перетаскивания
        // setIsCollapsed(false);
    }

    function handleDateSelect(selectInfo) {
        // console.log(selectInfo)
        const applyOffset = (date, offset) => {
            const newDate = new Date(date);
            newDate.setHours(newDate.getHours() + offset);
            return newDate.toISOString();
        };

        // Применяем смещение времени к выбранной дате
        const adjustedStartDate = applyOffset(selectInfo.startStr, timeOffset.current);
        const adjustedEndDate = selectInfo.endStr ? applyOffset(selectInfo.endStr, timeOffset.current) : null;

        setSelectedDate({
            start: adjustedStartDate,
            end: adjustedEndDate,
            allDay: selectInfo.allDay,
        });
        handleNewTaskDialogOpen("paper");
    }

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

    async function handleDelDateClick(taskId) {
        await updateTask(taskId, { start: null, end: null });
        if (fetchCalendarEvents) await fetchCalendarEvents(getCalendarRange());
        setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
    }

    async function handleEventChange(eventInfo) {
        const applyOffset = (date, offset) => {
            const newDate = new Date(date);
            newDate.setHours(newDate.getHours() + offset);
            return newDate.toISOString();
        };

        const eventDict = {
            taskId: eventInfo.event.id,
            listId: selectedListId,
            title: eventInfo.event.title,
            allDay: eventInfo.event.allDay,
        };

        if (eventInfo.event.start) {
            eventDict.start = applyOffset(eventInfo.event.start, timeOffset.current);
        }

        if (eventInfo.event.end) {
            eventDict.end = applyOffset(eventInfo.event.end, timeOffset.current);
        } else if (eventInfo.event.start) {
            // Время start + 1 час
            const endDate = new Date(eventInfo.event.start);
            endDate.setHours(endDate.getHours() + 1);
            eventDict.end = applyOffset(endDate, timeOffset.current);
        }

        const calendarEvent = calendarEvents.find((event) => event.id == eventInfo.event.id);

        if (calendarEvent && calendarEvent.rrule) {
            eventDict.rrule = {
                ...calendarEvent.rrule,
                dtstart: applyOffset(eventInfo.event.start, timeOffset.current),
            };
        }

        // setUpdatedCalendarEvents((prevEvents) => [...prevEvents, eventDict]);

        // console.log('eventDict', eventDict);
        await updateTask(eventInfo.event.id, eventDict);
        setUpdates((prevUpdates) => [...prevUpdates, "todo", "calendar"]);
        if (fetchTasks) await fetchTasks(selectedListId);
        if (fetchCalendarEvents) await fetchCalendarEvents(getCalendarRange());
    }

    const handleSettingsDialogOpen = () => setSettingsDialogOpen(true);
    const handleSettingsDialogClose = () => setSettingsDialogOpen(false);

    function handleApplySettings(tempSlotDuration, tempTimeRange, tempTimeOffset) {
        setSlotDuration(tempSlotDuration);
        setTimeRange(tempTimeRange);
        timeOffset.current = tempTimeOffset; // Сохраняем смещение времени
        handleSettingsDialogClose();

        applyTimeOffsetToGrid(tempTimeOffset, currentTheme);
        // console.log('Settings applied', tempSlotDuration, tempTimeRange, tempTimeOffset);
    }

    // Функция для корректного отображения меток времени с учетом смещения
    // Чтоб корректно работала функция перерисовки времени я оставил и эту функцию
    // в целом она не нужна
    function getTimeLabelFormat() {
        return {
            hour: "numeric",
            minute: "2-digit",
            omitZeroMinute: false,
            meridiem: "short",
        };
    }

    // Функция для рендера события с учетом смещения
    function renderEventMonthContent(eventInfo) {
        const { startTime } = applyTimeOffsetToEvent(eventInfo.event, timeOffset.current);
        const calendarEvent = calendarEvents.find((event) => event.id == eventInfo.event.id);
        const color =
            calendarEvent?.status_id == 2
                ? "#008000"
                : calendarEvent?.priority_id == 3
                ? "#A52A2A"
                : calendarEvent?.color
                ? calendarEvent.color
                : "#3788D8";

        return {
            html: `<div class="fc-daygrid-event-dot" style="border-color: ${color};"></div>
            <div class="fc-event-time">${startTime}</div>
            <div class="fc-event-title">${eventInfo.event.title}</div>`,
        };
    }

    function renderEventContent(eventInfo) {
        const calendarEvent = calendarEvents.find((event) => event.id == eventInfo.event.id);
        // console.log('renderEventContent: eventInfo:', eventInfo)
        // console.log('renderEventContent: calendarEvent:', calendarEvent)
        if (calendarEvent && calendarEvent.display && calendarEvent.display == "background" && !isToggledBGTasksEdit)
            return {
                html: `<div class="fc-event-main-frame">
                <div class="fc-event-title-container">
                  <div class="fc-event-title fc-sticky">${eventInfo.event.title}</div>
                </div>
            `,
            };

        const { startTime, endTime } = applyTimeOffsetToEvent(eventInfo.event, timeOffset.current);

        return {
            html: `<div class="fc-event-main-frame">
              <div class="fc-event-time">${startTime}${endTime ? " - " + endTime : ""}</div>
              <div class="fc-event-title-container">
                <div class="fc-event-title fc-sticky">${eventInfo.event.title}</div>
              </div>
            </div>`,
        };
    }

    // Функция для применения смещения ко времени события
    function applyTimeOffsetToEvent(event, offset) {
        // console.log('applyTimeOffsetToEvent: event:', event, 'offset:', offset);
        const startDate = new Date(event.start);
        const endDate = event.end ? new Date(event.end) : null;

        if (offset !== 0) {
            startDate.setHours(startDate.getHours() + offset);
            if (endDate) {
                endDate.setHours(endDate.getHours() + offset);
            }
        }

        const formatTime = (date) => {
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            return `${hours}:${minutes}`;
        };

        return {
            startTime: formatTime(startDate),
            endTime: endDate ? formatTime(endDate) : null,
        };
    }

    // Отмена изменений
    function handleCancelSettings() {
        handleSettingsDialogClose();
    }

    // Добавляем  0 перед минутами если меньше 10 иначе получаем ошибку
    const formattedSlotDuration = String(slotDuration).padStart(2, "0");

    const calendarProps = {
        locale: ruLocale,
        slotDuration: `00:${formattedSlotDuration}:00`, // Интервал сетки
        slotLabelInterval: `00:${formattedSlotDuration}:00`, // Интервал меток
        slotMinTime: `${String(timeRange[0]).padStart(2, "0")}:00:00`,
        slotMaxTime: `${String(timeRange[1]).padStart(2, "0")}:00:00`, // Максимальное время
        // forceEventDuration={true}
        height: "100%",
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, rrulePlugin],
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        },
        droppable: true,
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        initialEvents: calendarEvents,
        datesSet: (dateInfo) => setCurrentView(dateInfo.view.type),
        slotLabelFormat: getTimeLabelFormat(),
        select: handleDateSelect,
        eventClick: handleEventClick,
        eventChange: handleEventChange,
        eventReceive: handleEventReceive,
        eventDragStart: () => setIsCollapsed(true),
    };

    // Добавляем eventContent только если текущий вид не "dayGridMonth"
    if (currentView == "dayGridMonth") {
        calendarProps.eventContent = renderEventMonthContent;
    } else if (currentView !== "listWeek") {
        calendarProps.eventContent = renderEventContent;
    }

    if (timeOffset.current == 0) {
        calendarProps.nowIndicator = true;
    }

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", width: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", paddingTop: 1, paddingX: 1 }}>
                <Box>
                    <Button onClick={handleSettingsDialogOpen}>Настройки</Button>
                    <ToggleButton
                        onClick={() => {
                            setIsToggled(!isToggledBGTasksEdit);
                        }}
                        selected={isToggledBGTasksEdit}
                        value="backgroundsEdit"
                    >
                        {!isToggledBGTasksEdit ? <EditIcon /> : <EditOffIcon />} Фоновые задачи
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
            <Grid container sx={{ flexGrow: 1, overflowY: "auto", height: "100%", position: "relative" }}>
                <Grid item width={"100%"}>
                    <Paper sx={{ p: 3, flexGrow: 1, overflowY: "auto", height: "100%" }}>
                        <FullCalendar ref={calendarRef} {...calendarProps} />
                        <TaskDialog
                            open={dialogOpen}
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
                        <NewTaskDialog
                            open={newTaskDialogOpen}
                            handleClose={handleDialogClose}
                            scroll={dialogScroll}
                            selectedDate={selectedDate}
                            onCreate={addTask}
                        />
                        {/* Диалоговое окно для настроек */}
                        <SettingsDialog
                            open={settingsDialogOpen}
                            onClose={handleCancelSettings}
                            onApply={handleApplySettings}
                            slotDuration={slotDuration}
                            timeRange={timeRange}
                            timeOffset={timeOffset.current}
                        />
                    </Paper>
                </Grid>
                {!isCollapsed && (
                    <Grid
                        item
                        sx={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            right: isCollapsed ? "-100%" : "0",
                            width: "500px",
                            maxWidth: "100%",
                            transition: "right 0.3s ease",
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
                                lists={lists}
                                defaultLists={lists.default_lists}
                                projects={lists.projects}
                                updateList={updateList}
                                isNeedContextMenu={true}
                                setSelectedListId={setSelectedListId}
                                deleteFromChildes={deleteFromChildes}
                                setSelectedTaskId={setSelectedTaskId}
                                linkListGroup={linkListGroup}
                            />
                        </Paper>
                        {selectedListId && (
                            <Paper sx={{ p: 3, flexGrow: 1, overflowY: "auto", height: "100%" }}>
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
                                            {tasks.filter((task) => task.status_id === 2).length > 0 && (
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
                )}
            </Grid>
        </Box>
    );
}
