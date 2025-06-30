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
import React, { useEffect, useState } from "react";
import useFocusTimer from "./hooks/useFocusTimer";
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
    tasks = [],
    selectedList,
    updateTask,
    changeTaskStatus,
    fetchTasks,
    onTaskClick,
    additionalButtonClick
}) => {
    // Отладочные логи для props
    console.log('[FocusModeComponent] props:', {
        containerId,
        tasks,
        selectedList,
        updateTask,
        changeTaskStatus,
        fetchTasks,
        onTaskClick,
        additionalButtonClick
    });
    const [currentTaskParams, setCurrentTaskParams] = useState({intervals: []})
    const [modeSettings, setModeSettings] = useState({
        workIntervalDuration: 30 * 60,
        breakDuration: 5 * 60,
        additionalBreakDuration: 15 * 60,
        isBackgroundTasks: true,
    });
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [skippedTasks, setSkippedTasks] = useState([]);
    const [currentTask, setCurrentTask] = useState(null);
    const [timerState, setTimerState] = useState({
        remainingTime: 0,
        isOnBreak: true,
        currentIntervalEndDate: null,
        currentIntervalIndex: 0,
        currentIntervalDuration: 0
    });
    const [progress, setProgress] = useState(0);

    const {
        updateTimerState,
        startTimer,
        stopTimer,
        formatRemainingTime,
    } = useFocusTimer();

    useEffect(() => {
        return () => {
            stopTimer(); // Останавливаем таймер при размонтировании компонента
        };
    }, []);

    useEffect(() => {
        const currentTime = dayjs().tz();
        const {currentIntervalEndDate} = timerState;
        if (dayjs(currentIntervalEndDate).isBefore(currentTime)) {
            stopTimer();
            playCheckedAudio();
            const {intervals} = currentTaskParams;
            const nextInterval = findNextInterval(intervals)
            let newCurrentTask = null
            if (!nextInterval) {
                const nextTask = findNextTask(tasks, skippedTasks)
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
                startTimer(newTimerParams.currentIntervalEndDate)
            }
        }
    }, [timerState, currentTaskParams, tasks, skippedTasks])

    useEffect(() => {
        const {taskParams, timerParams} = findTaskAndTimerParams(currentTask, modeSettings)
        stopTimer()
        updateTimerState(timerParams)
        updateCurrentTaskParams(taskParams)
        if (currentTask) {
            startTimer(timerParams.currentIntervalEndDate);
        } else {
            stopTimer();
        }
    }, [currentTask, modeSettings])

    function updateCurrentTaskParams(updates) {
        setCurrentTaskParams((prevState) => ({
        ...prevState,
        ...updates,
        }));
    }

    function handleTaskClick(taskId) {
        if (onTaskClick && typeof onTaskClick === "function") {
            onTaskClick(taskId);
        }
    }

    function findTaskAndTimerParams(currentTask, modeSettings) {
        switch (true) {
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
            intervalEndTime = dayjs(interval.end).tz(timezone)
            if (intervalEndTime.isAfter(nowTime)) {
                foundInterval = interval;
                return true;
            }
            return false;
        });
        return foundInterval;
    }

    const findNextTask = (tasksList, skipedTasksList) => {
        console.log("findNextTask: skippedTasksList", skipedTasksList)
        const filtredTasks = tasksList?.filter((task) => !skipedTasksList.includes(task.id));
        const nextTask = filtredTasks?.find((task) => !isTaskInPast(task)) || null;
        return nextTask;
    }

    function checkIsTaskStart(task, timezone = null) {
        if (timezone == null) timezone = dayjs.tz.guess();
        const taskStartTime = dayjs(task.start).tz(timezone);
        const currentTime = dayjs().tz(timezone);

        const taskStartSeconds = taskStartTime.hour() * 3600 + taskStartTime.minute() * 60 + taskStartTime.second();
        const currentSeconds = currentTime.hour() * 3600 + currentTime.minute() * 60 + currentTime.second();

        return currentSeconds >= taskStartSeconds;
    }

    const playCheckedAudio = () => {
        let playAudioPromise = Promise.resolve();
        let soundUrl = "/sounds/endTimer.mp3";
        if (soundUrl) {
            const audio = new Audio(soundUrl);
            audio.volume = 0.5;
            playAudioPromise = new Promise((resolve) => {
                audio.onended = resolve;
                audio.play();
            });
        }

        return playAudioPromise;
    };

    const calculateTaskDuration = (task) => {
        const startTime = dayjs(task.start);
        const endTime = dayjs(task.deadline);

        const startInSeconds = startTime.hour() * 3600 + startTime.minute() * 60 + startTime.second();
        const endInSeconds = endTime.hour() * 3600 + endTime.minute() * 60 + endTime.second();

        let durationInSeconds = endInSeconds - startInSeconds;

        if (durationInSeconds < 0) {
            durationInSeconds += 24 * 3600;
        }

        return durationInSeconds;
    };

    const divideTaskWithBreaks = (task, modeSettings) => {
        let intervalDuration = modeSettings?.workIntervalDuration
        let breakDuration = modeSettings?.breakDuration
        let additionalBreakDuration = modeSettings?.additionalBreakDuration
        const intervals = [];
        let remainingTime = calculateTaskDuration(task);
        let taskStartTime = dayjs(task.start);
        let currentTime = dayjs();
        console.log("divideTaskWithBreaks", task, modeSettings)
        currentTime = currentTime.hour(taskStartTime.hour()).minute(taskStartTime.minute()).second(taskStartTime.second());

        console.log("remainingTime", remainingTime);
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
                    if (remainingTime < currentBreakDuration) {
                        if (intervals && intervals.length > 0 && intervals[intervals.length - 1].type == "work") {
                            let lastIntervalId = intervals.length - 1;
                            intervals[lastIntervalId].duration = intervals[lastIntervalId].duration + remainingTime;
                            intervals[lastIntervalId].end = currentTime.add(remainingTime, 'second').toISOString();
                            remainingTime = 0;
                        } else {
                            currentTime = currentTime.add(remainingTime, 'second');
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

        console.log("intervals", intervals);
        if (intervals && intervals.length > 0 && intervals[intervals.length - 1].type == "break") {
            let lastBreakDuration = intervals[intervals.length - 1].duration;
            let lastBreakEndTime = dayjs(intervals[intervals.length - 1].end);
            let lastBreakStartTime = dayjs(intervals[intervals.length - 1].start);
            intervals.pop();

            if (lastBreakDuration == breakDuration) {
                intervals[intervals.length - 1].duration += breakDuration;
                intervals[intervals.length - 1].end = lastBreakEndTime
            } else {
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

    const isTaskInPast = (task, timezone = null) => {
        if (timezone == null) timezone = dayjs.tz.guess();
        if (!task || !task.deadline) return false;
        const currentTime = dayjs().tz(timezone);
        const taskEndTime = dayjs(task.deadline).tz(timezone);

        const currentHours = currentTime.hour();
        const currentMinutes = currentTime.minute();
        const taskEndHours = taskEndTime.hour();
        const taskEndMinutes = taskEndTime.minute()-1;

        const taskEndMin = taskEndHours * 60 + taskEndMinutes;
        const currentTimeMin = currentHours * 60 + currentMinutes;
        if (taskEndMin <= currentTimeMin) {
            return true;
        }
        return false;
    };

    function handleChangeTaskStatus(taskId, updatedFields) {
        if (typeof changeTaskStatus === "function") {
            changeTaskStatus(taskId, updatedFields);
        }
    }

    function handleAdditionalButtonClick(task) {
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
            const roundedStart = now.minute(Math.floor(now.minute() / 5) * 5).second(0);
            task.start = roundedStart;
            task.end = roundedStart.add(60, 'minute');
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

    function handleRefresh() {
        setSkippedTasks([]);
        if (selectedList?.id && typeof fetchTasks === 'function') fetchTasks(selectedList.id);
    }

    // Лог перед рендером TasksList
    const filteredTasks = modeSettings?.isBackgroundTasks ? tasks : tasks.filter((task) => !task.is_background);
    console.log('[FocusModeComponent] TasksList props:', {
        containerId,
        tasks: filteredTasks,
        selectedList,
        selectedTaskId: currentTaskParams?.currentTask?.id || null
    });

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
            <Box sx={{ display: "flex", flexDirection: "row", padding: 1 }}>
                <IconButton edge="start" color="inherit" aria-label="settings" onClick={() => setSettingsDialogOpen(true)}>
                    <SettingsIcon />
                </IconButton>
                <Grid container justifyContent="center" alignItems="center" direction="column">
                    <Typography variant="h6" component="div">
                        {currentTaskParams.taskName}
                    </Typography>
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
                <Box sx={{ flex: 1, display: "flex", flexDirection: "row", justifyContent: "center", padding: 1 }}>
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
                                timerState.isOnBreak
                                    ? "success"
                                    : "primary"
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
                            <Typography variant="h3" component="div" color="text.secondary">
                                {formatRemainingTime(timerState.remainingTime)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ width: "100%", overflow: "auto" }}>
                    <Stepper activeStep={timerState.currentIntervalIndex} alternativeLabel>
                        {currentTaskParams.intervals.map((step, index) => (
                            <Step key={`step_${index}`}>
                                <StepLabel>{`${Math.floor(step.duration / 60)} мин`}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
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
                    tasks={filteredTasks}
                    selectedTaskId={currentTaskParams?.currentTask?.id || null}
                    selectedList={selectedList}
                    isNeedContextMenu={false}
                    setSelectedTaskId={handleTaskClick}
                    updateTask={updateTask}
                    additionalButtonClick={handleAdditionalButtonClick}
                    changeTaskStatus={handleChangeTaskStatus}
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
    tasks: PropTypes.array,
    selectedList: PropTypes.object,
    updateTask: PropTypes.func,
    changeTaskStatus: PropTypes.func,
    fetchTasks: PropTypes.func,
    onTaskClick: PropTypes.func,
    additionalButtonClick: PropTypes.func,
};
