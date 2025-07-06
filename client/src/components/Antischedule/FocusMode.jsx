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
import React, { useEffect, useState, useMemo } from "react";
import useFocusTimer from "./hooks/useFocusTimer";
import useFocusTasks from "./hooks/useFocusTasks";
import {
    divideTaskWithBreaks,
    findNextInterval,
    calculateRemainingTime,
    checkIsTaskStart,
    findNextTask,
    isTaskInPast,
} from "./hooks/focusUtils";
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
    selectedList,
    updateTask,
    changeTaskStatus,
    fetchTasks,
    onTaskClick,
    additionalButtonClick,
    saveSettings
}) => {
    const [currentTaskParams, setCurrentTaskParams] = useState({intervals: []})
    const [modeSettings, setModeSettings] = useState({
        workIntervalDuration: 30 * 60,
        breakDuration: 5 * 60,
        additionalBreakDuration: 15 * 60,
        isBackgroundTasks: true,
    });
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const {
        mainTasks,
        currentTask,
        skippedTasks,
        setSkippedTasks,
        setCurrentTask,
    } = useFocusTasks(modeSettings);
    const {
        timerState,
        progress,
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


    const handleIntervalEnd = () => {
        playCheckedAudio();
        const {intervals} = currentTaskParams;
        const nextInterval = findNextInterval(intervals);
        let newCurrentTask = null;
        if (!nextInterval) {
            const nextTask = findNextTask(mainTasks, skippedTasks);
            if (nextTask) {
                newCurrentTask = { ...nextTask, status: 'started' };
            }
            setCurrentTask(newCurrentTask);
        } else {
            const newTimerParams = {
                currentIntervalIndex: nextInterval.id,
                currentIntervalEndDate: nextInterval.end,
                currentIntervalDuration: nextInterval.duration,
                remainingTime: nextInterval.duration,
                isOnBreak: nextInterval.isOnBreak,
            };
            updateTimerState(newTimerParams);
            startTimer(newTimerParams.currentIntervalEndDate, undefined, handleIntervalEnd);
        }
    };

    useEffect(() => {
        const {taskParams, timerParams} = findTaskAndTimerParams(currentTask, modeSettings)
        stopTimer()
        updateTimerState(timerParams)
        updateCurrentTaskParams(taskParams)
        if (currentTask) {
            startTimer(timerParams.currentIntervalEndDate, undefined, handleIntervalEnd);
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
        const newSettings = { ...modeSettings, ...updates };
        setModeSettings(newSettings);
        if (typeof saveSettings === 'function') {
            saveSettings(newSettings);
        }
    }

    function handleRefresh() {
        setSkippedTasks([]);
        if (selectedList?.id && typeof fetchTasks === 'function') fetchTasks(selectedList.id);
    }
    const filteredTasks = useMemo(
        () =>
            modeSettings?.isBackgroundTasks
                ? mainTasks
                : mainTasks.filter((task) => !task.is_background),
        [mainTasks, modeSettings.isBackgroundTasks]
    );


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
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 1 }}>
                <IconButton edge="start" color="inherit" aria-label="settings" onClick={() => setSettingsDialogOpen(true)}>
                    <SettingsIcon />
                </IconButton>
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <Grid container justifyContent="center" alignItems="center" direction="column">
                        <Typography variant="h6" component="div">
                            {currentTaskParams.taskName}
                        </Typography>
                        {mainTasks?.length > 0 && (
                            <Typography variant="subtitle1" component="div" color="text.secondary">
                                {currentTaskParams.taskRange}
                            </Typography>
                        )}
                    </Grid>
                </Box>
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
    selectedList: PropTypes.object,
    updateTask: PropTypes.func,
    changeTaskStatus: PropTypes.func,
    fetchTasks: PropTypes.func,
    onTaskClick: PropTypes.func,
    additionalButtonClick: PropTypes.func,
    saveSettings: PropTypes.func,
};
