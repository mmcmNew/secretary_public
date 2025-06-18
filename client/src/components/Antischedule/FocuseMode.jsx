import {
    Typography,
    IconButton,
    CircularProgress,
    Box,
    Grid,
    Stepper,
    Step,
    StepLabel,
    Button,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import TasksList from "../ToDo/TasksList";
import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import PropTypes from "prop-types";
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import SettingsDialog from "./SettingsDialog";

dayjs.extend(utc);
dayjs.extend(timezone);

const MemoizedTaskList = React.memo(TasksList);

const FocusModeComponent = ({
    containerId,
    updateTask,
    tasks,
    selectedList,
    changeTaskStatus,
    onTaskClick,
    handleUpdateTasks,
    additionalButtonClick
}) => {
    // const [isPaused, setIsPaused] = useState(false);
    const [timerState, setTimerState] = useState({
        stateUpdater: 0,
        remainingTime: 1500, // 25 минут
        isOnBreak: false,
        currentIntervalIndex: 0,
        currentIntervalEndDate: null,
        currentIntervalDuration: 25 * 60,
    });
    const [currentTaskParams, setCurrentTaskParams] = useState({intervals: []})
    const [modeSettings, setModeSettings] = useState({
        workIntervalDuration: 30 * 60,
        breakDuration: 5 * 60,
        additionalBreakDuration: 15 * 60,
        isBackgroundTasks: true,
    });
    const [mainTasks, setMainTasks] = useState(tasks);
    const [currentTask, setCurrentTask] = useState(null)
    const [skippedTasks, setSkippedTasks] = useState([]);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    // const [currentIntervalEndDate, setCurrentIntervalEndDate] = useState(null)

    const timerRef = useRef(null);

    const progress = (timerState.remainingTime / timerState.currentIntervalDuration) * 100;

    useEffect(() => {
        return () => {
            stopTimer(); // Останавливаем таймер при размонтировании компонента
        };
    }, []);

    useEffect(() => {
        stopTimer()
        let newMainTasks = null
        // Фильтруем задачи, которые принадлежат списку и которые не фоновые
        if (modeSettings.isBackgroundTasks)
            newMainTasks = tasks?.filter((task) => selectedList?.childes_order.includes(task.id)) || [];
        else
            newMainTasks = tasks?.filter((task) => selectedList.childes_order.includes(task.id) && !task.is_background) || [];

        const nextTask = findNextTask(newMainTasks, skippedTasks)
        console.log('1')
        setMainTasks(newMainTasks)
        setCurrentTask(nextTask)
    }, [tasks, selectedList, modeSettings.isBackgroundTasks, skippedTasks]);

    useEffect(() => {
        const currentTime = dayjs().tz();
        const {currentIntervalEndDate} = timerState;
        // console.log(currentIntervalEndDate, currentTime.toISOString(), dayjs(currentIntervalEndDate).isBefore(currentTime))
        if (dayjs(currentIntervalEndDate).isBefore(currentTime)) {
            stopTimer();
            playCheckedAudio();
            const {intervals} = currentTaskParams;
            // console.log(intervals)
            const nextInterval = findNextInterval(intervals)
            // console.log('nextInterval: ', nextInterval)
            let newCurrentTask = null
            if (!nextInterval) {
                const nextTask = findNextTask(mainTasks, skippedTasks)
                if (nextTask) {
                    newCurrentTask = {...nextTask, status: 'started'}
                }
                console.log(newCurrentTask)
                setCurrentTask(newCurrentTask)
            } else {
                const newTimerParams = {
                    currentIntervalIndex: nextInterval.id,
                    currentIntervalEndDate: nextInterval.end,
                    currentIntervalDuration: nextInterval.duration,
                    remainingTime: nextInterval.duration,
                    isOnBreak: nextInterval.isOnBreak,
                }
                updateTimerState(newTimerParams)
                // console.log('3', taskParams, timerParams)
                startTimer(newTimerParams.currentIntervalEndDate)
            }
        }
    }, [timerState, currentTaskParams])

    useEffect(() => {
        // console.log('2', currentTask)
        const {taskParams, timerParams} = findTaskAndTimerParams(currentTask, modeSettings)
        // console.log('3', taskParams, timerParams)
        stopTimer()
        updateTimerState(timerParams)
        updateCurrentTaskParams(taskParams)
        if (currentTask) {
            startTimer(timerParams.currentIntervalEndDate);
        } else {
            stopTimer();
        }
    }, [currentTask, modeSettings])

    function updateTimerState(updates) {
        setTimerState((prevState) => ({
        ...prevState,
        ...updates,
        }));
    }

    function updateCurrentTaskParams(updates) {
        setCurrentTaskParams((prevState) => ({
        ...prevState,
        ...updates,
        }));
    }

    function handleTaskClick(taskId) {
        if (handleTaskClick && typeof handleTaskClick === "function") {
            onTaskClick(taskId);
        }
    }

    function findTaskAndTimerParams(currentTask, modeSettings) {
        switch (true) {
            // Случай, когда нет текущей задачи
            case !currentTask: {
                return {
                    taskParams: {
                        taskName: "Все задачи завершены",
                        taskRange: "",
                        intervals: [],
                        currentTask: null
                    },
                    timerParams: {
                        remainingTime: 0,
                        isOnBreak: true,
                        currentIntervalEndDate: null,
                        currentIntervalIndex: 0
                    }
                };
            }

            // Случай, когда задача еще не началась
            case !checkIsTaskStart(currentTask): {
                const newTaskRange = `${dayjs(currentTask.start).format("HH:mm")} - ${dayjs(currentTask.deadline).format("HH:mm")}`;
                const newRemainingTime = calculateRemainingTime(currentTask.start);
                const currentTime = dayjs();
                const newTimerEndDate = currentTime
                    .hour(dayjs(currentTask.start).hour())
                    .minute(dayjs(currentTask.start).minute())
                    .second(dayjs(currentTask.start).second())
                    .toISOString();
                return {
                    taskParams: {
                        taskName: `Перерыв. Далее ${currentTask.title}`,
                        taskRange: newTaskRange,
                        intervals: [],
                        currentTask: currentTask
                    },
                    timerParams: {
                        remainingTime: newRemainingTime,
                        isOnBreak: true,
                        currentIntervalEndDate: newTimerEndDate,
                        currentIntervalIndex: 0,
                        currentIntervalDuration: newRemainingTime
                    }
                };
            }

            // Случай, когда задача началась
            default: {
                const intervals = divideTaskWithBreaks(currentTask, modeSettings);
                const newTaskRange = `${dayjs(currentTask.start).format("HH:mm")} - ${dayjs(currentTask.deadline).format("HH:mm")}`;
                const nextInterval = findNextInterval(intervals);
                const newRemainingTime = calculateRemainingTime(nextInterval?.end);
                return {
                    taskParams: {
                        taskName: currentTask.title,
                        taskRange: newTaskRange,
                        intervals: intervals,
                        currentTask: currentTask
                    },
                    timerParams: {
                        remainingTime: newRemainingTime,
                        isOnBreak: nextInterval?.isOnBreak,
                        currentIntervalIndex: nextInterval?.id,
                        currentIntervalDuration: nextInterval?.duration,
                        currentIntervalEndDate: nextInterval?.end
                    }
                };
            }
        }
    }

    function calculateRemainingTime(checkedTime, timezone) {
        if (timezone == null) timezone = dayjs.tz.guess();
        const taskStartTime = dayjs(checkedTime).tz(timezone);
        const currentTime = dayjs().tz(timezone);
        // console.log("calculateReaminingTime", checkedTime, currentTime, taskStartTime, timezone);

        // Извлекаем часы, минуты и секунды для обеих дат
        const taskStartSeconds = taskStartTime.hour() * 3600 + taskStartTime.minute() * 60 + taskStartTime.second();
        const currentSeconds = currentTime.hour() * 3600 + currentTime.minute() * 60 + currentTime.second();
        const remainingTime = Math.abs(currentSeconds - taskStartSeconds);
        return remainingTime;
    }

    function findNextInterval(intervals, timezone = null) {
        if (timezone == null) timezone = dayjs.tz.guess();
        let foundInterval = null;
        let intervalEndTime = null
        let nowTime = dayjs().tz(timezone)
        intervals.some((interval) => {
            // console.log("findNextInterval", interval, nowTime);
            intervalEndTime = dayjs(interval.end).tz(timezone)
            // console.log("findNextInterval", intervalEndTime.toISOString(), nowTime.toISOString(), intervalEndTime.isAfter(nowTime));
            if (intervalEndTime.isAfter(nowTime)) {
                foundInterval = interval;
                return true; // Останавливаем итерацию
            }
            return false; // Продолжаем итерацию
        });
        return foundInterval;
    }

    const startTimer = (newTimerEndDate, timezone = null) => {
        if (timezone == null) timezone = dayjs.tz.guess();
        timerRef.current = setInterval(() => {
            const newRemainingTime = calculateRemainingTime(newTimerEndDate);
            updateTimerState({ remainingTime: newRemainingTime });
        }, 500);
    };

    function stopTimer() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }

    const findNextTask = (tasksList, skipedTasksList) => {
        console.log("findNextTask: skippedTasksList", skipedTasksList)
        const filtredTasks = tasksList?.filter((task) => !skipedTasksList.includes(task.id)); // отфильтровать те задачи которые в skipedTasks
        const nextTask = filtredTasks?.find((task) => !isTaskInPast(task)) || null;
        return nextTask;
    }

    function checkIsTaskStart(task, timezone = null) {
        if (timezone == null) timezone = dayjs.tz.guess();
        const taskStartTime = dayjs(task.start).tz(timezone);
        const currentTime = dayjs().tz(timezone);

        // Извлекаем часы, минуты и секунды для обеих дат
        const taskStartSeconds = taskStartTime.hour() * 3600 + taskStartTime.minute() * 60 + taskStartTime.second();
        const currentSeconds = currentTime.hour() * 3600 + currentTime.minute() * 60 + currentTime.second();

        // Лог для проверки значений
        // console.log("taskStartSeconds ", taskStartSeconds, "currentSeconds ", currentSeconds);

        // Проверяем, началась ли задача, только по времени суток
        return currentSeconds >= taskStartSeconds;
    }

    const playCheckedAudio = () => {
        let playAudioPromise = Promise.resolve();
        let soundUrl = "/sounds/endTimer.mp3";
        if (soundUrl) {
            // Воспроизводим звук завершения интервала
            const audio = new Audio(soundUrl);
            audio.volume = 0.5;
            playAudioPromise = new Promise((resolve) => {
                audio.onended = resolve; // Ждём завершения звука
                audio.play();
            });
        }

        // Возвращаем Promise, если нужно добавить другую логику после звука
        return playAudioPromise;
    };

    // Расчет длительности задачи (время без учета даты)
    const calculateTaskDuration = (task) => {
        const startTime = dayjs(task.start);
        const endTime = dayjs(task.deadline);

        // Преобразуем время начала и окончания задачи в количество секунд с начала суток
        const startInSeconds = startTime.hour() * 3600 + startTime.minute() * 60 + startTime.second();
        const endInSeconds = endTime.hour() * 3600 + endTime.minute() * 60 + endTime.second();

        // Рассчитываем разницу в секундах
        let durationInSeconds = endInSeconds - startInSeconds;

        // Если разница отрицательная, это значит, что конец наступает на следующий день, поэтому добавляем 24 часа
        if (durationInSeconds < 0) {
            durationInSeconds += 24 * 3600; // Добавляем 24 часа в секундах
        }

        return durationInSeconds;
    };

    // Функция для разделения на интервалы
    const divideTaskWithBreaks = (task, modeSettings) => {
        let intervalDuration = modeSettings?.workIntervalDuration
        let breakDuration = modeSettings?.breakDuration
        let additionalBreakDuration = modeSettings?.additionalBreakDuration
        const intervals = [];
        let remainingTime = calculateTaskDuration(task);
        let taskStartTime = dayjs(task.start);  // Время из задачи
        let currentTime = dayjs();              // Текущая дата
        console.log("divideTaskWithBreaks", task, modeSettings)
        // Заменяем дату текущего времени на дату из задачи (оставляем только время)
        currentTime = currentTime.hour(taskStartTime.hour()).minute(taskStartTime.minute()).second(taskStartTime.second());

        // console.log("remainingTime", remainingTime);
        // Добавить интервалы
        let currentIntervalId = -1;
        let breakId = 0;
        let intervalType = "work";
        let currentBreakDuration = breakDuration;
        let newIntervalDuration = 0;
        while (remainingTime > 0) {
            currentIntervalId++;
            let intervalStartTime = currentTime;
            switch (intervalType) {
                case "work":
                    if (remainingTime >= intervalDuration) {
                        newIntervalDuration = intervalDuration;
                        remainingTime -= intervalDuration;
                    } else {
                        newIntervalDuration = remainingTime;
                        remainingTime = 0;
                    }
                    currentTime = currentTime.add(newIntervalDuration, 'second');
                    intervals.push({
                        id: currentIntervalId,
                        duration: newIntervalDuration,
                        type: "work",
                        isOnBreak: false,
                        start: intervalStartTime.toISOString(),
                        end: currentTime.toISOString(),
                    });
                    intervalType = "break";
                    continue;
                case "break":
                    // если оставшееся время меньше перерыва, то прибавляем это время к крайнему рабочему интервалу или создаем новый
                    if (remainingTime < currentBreakDuration) {
                        if (intervals && intervals.length > 0 && intervals[intervals.length - 1].type == "work") {
                            let lastIntervalId = intervals.length - 1;
                            intervals[lastIntervalId].duration = intervals[lastIntervalId].duration + remainingTime;
                            intervals[lastIntervalId].end = currentTime.add(remainingTime, 'second').toISOString();
                            remainingTime = 0;
                        } else {
                            currentTime = currentTime.add(remainingTime, 'second'); // Обновляем текущее время
                            intervals.push({
                                id: currentIntervalId,
                                duration: remainingTime,
                                type: "work",
                                isOnBreak: false,
                                start: intervalStartTime.toISOString(),
                                end: currentTime.toISOString(),
                            });
                            remainingTime = 0;
                        }
                        intervalType = "work";
                        continue;
                    }
                    // каждый третий перерыв дополнительно больше кроме случая когда последний интервал будет менее 5 минут
                    if (breakId == 2 && remainingTime > additionalBreakDuration + 5) {
                        currentBreakDuration = additionalBreakDuration;
                        breakId = 0;
                    }
                    breakId++;
                    currentTime = currentTime.add(currentBreakDuration, 'second');
                    intervals.push({
                        id: currentIntervalId,
                        duration: currentBreakDuration,
                        type: "break",
                        isOnBreak: true,
                        start: intervalStartTime.toISOString(),
                        end: currentTime.toISOString(),
                    });
                    remainingTime -= currentBreakDuration;
                    currentBreakDuration = breakDuration;
                    intervalType = "work";
                    continue;
            }
        }

        // console.log("intervals", intervals);
        // проверяем чтоб последний интервал не был перерывом
        if (intervals && intervals.length > 0 && intervals[intervals.length - 1].type == "break") {
            // удаляем последний интервал и добавляем длительность перерыва к рабочему времени
            let lastBreakDuration = intervals[intervals.length - 1].duration;
            let lastBreakEndTime = dayjs(intervals[intervals.length - 1].end); // Время окончания последнего перерыва
            let lastBreakStartTime = dayjs(intervals[intervals.length - 1].start);
            intervals.pop();

            // если последний интервал перерыв и он равен обычному перерыву, то просто прибавляем его к времени задачи
            if (lastBreakDuration == breakDuration) {
                intervals[intervals.length - 1].duration += breakDuration;
                intervals[intervals.length - 1].end = lastBreakEndTime
            } else {
                // если интервал длинее обычного перерыва, то создаем обычный перерыв, а оставшееся время как рабочее
                let newBreakEndTime = lastBreakStartTime.add(breakDuration, 'second');
                intervals.push({
                    id: currentIntervalId,
                    duration: breakDuration,
                    type: "break",
                    isOnBreak: true,
                    start: lastBreakStartTime.toISOString(),
                    end: newBreakEndTime.toISOString(),
                });
                let lastWorkDuration = lastBreakDuration - breakDuration;
                let lastWorkEndTime = newBreakEndTime.add(lastWorkDuration, 'second');
                intervals.push({
                    id: currentIntervalId + 1,
                    duration: lastWorkDuration,
                    type: "work",
                    isOnBreak: false,
                    start: newBreakEndTime.toISOString(),
                    end: lastWorkEndTime.toISOString(),
                });
            }
        }


        if (intervals && intervals.length > 0 && intervals[intervals.length - 1].duration < 1) intervals.pop();

        return intervals;
    };

    // Функция для проверки прошла ли уже задача
    const isTaskInPast = (task, timezone = null) => {
        // console.log('isTaskInPast:', task)
        if (timezone == null) timezone = dayjs.tz.guess();
        if (!task || !task.deadline) return false;
        // console.log('isTaskInPast 2:', task.deadline)
        const currentTime = dayjs().tz(timezone);
        const taskEndTime = dayjs(task.deadline).tz(timezone);

        // Получаем только время (часы и минуты) для текущего времени и времени задачи
        const currentHours = currentTime.hour();
        const currentMinutes = currentTime.minute();
        const taskEndHours = taskEndTime.hour();
        const taskEndMinutes = taskEndTime.minute()-1;

        const taskEndMin = taskEndHours * 60 + taskEndMinutes;
        const currentTimeMin = currentHours * 60 + currentMinutes;
        // Сравниваем только время
        // console.log("taskEndMin", taskEndMin, "currentTimeMin", currentTimeMin);
        if (taskEndMin <= currentTimeMin) {
            return true;
        }
        return false;
    };

    function handleChangeTaskStatus(taskId, updatedFields) {
        if (tasks)
            setMainTasks((prevTasks) =>
                prevTasks.map((task) => (task.id == taskId ? { ...task, ...updatedFields } : task)),
            );
        if (typeof changeTaskStatus === "function") {
            changeTaskStatus(taskId, updatedFields);
        }
    }

    // Функция для форматирования оставшегося времени
    const formatRemainingTime = (time) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;
        let formatedTime = "";
        if (hours > 0) formatedTime += `${hours < 10 ? `0${hours}` : hours}:`;
            formatedTime += `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
        return formatedTime;
    };

    function handleAdditionalButtonClick(task) {
        //найти текущий интервал и если это перерыв, то взять предыдущий интервал и по времени интервала создать дату начала и окончания задачи
        const {intervals} = currentTaskParams;
        const currentIntervalIndex = timerState?.currentIntervalIndex;
        if (intervals && intervals.length > currentIntervalIndex) {
            let currentTask = intervals[currentIntervalIndex]
            if (currentTask.type == "break") {
                currentTask = intervals[currentIntervalIndex-1]
            }
            task.start =currentTask.start;
            task.end = currentTask.end;
        } else {
            const now = dayjs();
            const roundedStart = now.minute(Math.floor(now.minute() / 5) * 5).second(0); // Округляем вниз до 5 минут
            task.start = roundedStart;
            task.end = roundedStart.add(60, 'minute'); // Добавляем час к началу
        }
        if (typeof additionalButtonClick === "function") additionalButtonClick(task);
    }

    function handleSettingsClose() {
        setSettingsDialogOpen(false);
    }

    function handleSettingsApply(updates){
        setSettingsDialogOpen(false);
        setModeSettings((prevSettings) => ({ ...prevSettings, ...updates }));
    }

    const handleSkipTask = () => {
        const currentTask = currentTaskParams?.currentTask
        if (!currentTask) return;
        const newSkippedTasks = skippedTasks?.includes(currentTask?.id) ? skippedTasks : [...skippedTasks, currentTask.id];
        setSkippedTasks(newSkippedTasks);
    };

    function handleRefresh() {
        setSkippedTasks([]);
        if (typeof handleUpdateTasks === "function") handleUpdateTasks();
    }

    // const handleBack = () => {
    //     setCurrentIntervalIndex((prevActiveStep) => prevActiveStep - 1);
    // };

    return (
        <Box
            sx={{
                flexGrow: 1,
                height: "100%",
                width: "98.9%",
                display: "flex",
                flexDirection: "column",
                alignContent: "center",
                overflowX: "none",
            }}
        >
            {/* Верхняя панель */}
            <Box sx={{ display: "flex", flexDirection: "row", padding: 1 }}>
                <IconButton edge="start" color="inherit" aria-label="settings" onClick={() => setSettingsDialogOpen(true)}>
                    <SettingsIcon />
                </IconButton>
                <Grid container justifyContent="center" alignItems="center" direction="column">
                    <Typography variant="h6" component="div">
                        {currentTaskParams.taskName}
                    </Typography>
                    {/* время начала и окончания */}
                    {tasks?.length > 0 && (
                        <Typography variant="subtitle1" component="div" color="text.secondary">
                            {currentTaskParams.taskRange}
                        </Typography>
                    )}
                </Grid>
                <IconButton edge="end" color="inherit" aria-label="refresh" onClick={handleRefresh}>
                    <RefreshIcon />
                </IconButton>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 1, width: "100%" }}>
                {/* Таймер и название задачи */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "row", justifyContent: "center", padding: 1 }}>
                    {/* Таймер */}
                    <Box
                        key="focusMode"
                        sx={{
                            position: "relative",
                            display: "flex",
                            margin: 0,
                            height: "250px",
                            width: "250px",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <CircularProgress
                            variant="determinate"
                            value={progress}
                            color={
                                // isPaused
                                //     ? "warning" // Цвет паузы
                                //     :
                                timerState.isOnBreak
                                    ? "success" // Зеленый цвет для перерыва
                                    : "primary" // Синий цвет для работы
                            }
                            size="250px"
                        />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "auto",
                            }}
                        >
                            {/* {isPaused ? (
                                <Icon color="action">pause</Icon> // Отображаем иконку паузы
                            ) : ( */}
                            <Typography variant="h3" component="div" color="text.secondary">
                                {formatRemainingTime(timerState.remainingTime)}
                            </Typography>
                            {/* )} */}
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ width: "100%", overflow: "auto" }}>
                    <Stepper activeStep={timerState.currentIntervalIndex} alternativeLabel>
                        {currentTaskParams.intervals.map((step, index) => (
                            <Step key={`step_${index}`}>
                                {/* Отображаем длительность в минутах */}
                                <StepLabel>{`${Math.floor(step.duration / 60)} мин`}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <Button onClick={handleSkipTask}>Пропустить задачу</Button>
                </Box>
            </Box>
            <Box
                sx={{
                    px: 2,
                    flexGrow: 1,
                    overflowY: "auto",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                }}
            >
                <MemoizedTaskList
                    containerId={containerId}
                    tasks={modeSettings?.isBackgroundTasks ? tasks :  tasks.filter((task) => !task.is_background)}
                    selectedTaskId={currentTaskParams?.currentTask?.id || null} // управляет выделением элемента списка
                    selectedList={selectedList} //для получения порядка задач
                    isNeedContextMenu={false}
                    setSelectedTaskId={handleTaskClick} // для окна редактирования задачи
                    updateTask={updateTask}
                    additionalButtonClick={handleAdditionalButtonClick} //Получаем клик по спец кнопке для задачи
                    changeTaskStatus={handleChangeTaskStatus} // для того чтоб можно было отметить задачу выполненной
                    skippedTasks={skippedTasks}
                    additionalButton={ScheduleSendIcon}
                />
            </Box>
            <SettingsDialog
                open={settingsDialogOpen}
                onClose={handleSettingsClose}
                onApply={handleSettingsApply}
                settingsProp={modeSettings}
            />
        </Box>
    );
};

export default FocusModeComponent;

FocusModeComponent.propTypes = {
    containerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    updateTask: PropTypes.func,
    tasks: PropTypes.array,
    selectedList: PropTypes.object,
    changeTaskStatus: PropTypes.func,
    onTaskClick: PropTypes.func,
    handleUpdateTasks: PropTypes.func,
    additionalButtonClick: PropTypes.func,
};
