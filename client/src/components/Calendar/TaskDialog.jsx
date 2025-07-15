import { PropTypes } from "prop-types";
import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import TaskEditor from "../ToDo/TaskEditor";
import useTasks from "../ToDo/hooks/useTasks";

export default function TaskDialog({
    open,
    handleClose,
    handleDelDateClick,
    scroll,
    task = null,
    subtasks = null,
    parentTask = null,
    overrides = [],
    loadSubtasks = null,
    taskFields = {},
    onChange = null,
    addSubTask = null,
}) {
    // 0: экземпляр, 1: серия, 2: список
    const [activeTab, setActiveTab] = React.useState(0);
    // Для перехода по overrides
    const [currentTask, setCurrentTask] = React.useState(task);
    const [currentSubtasks, setCurrentSubtasks] = React.useState(subtasks || []);

    React.useEffect(() => {
        setCurrentTask(task);
    }, [task]);
    React.useEffect(() => {
        setCurrentSubtasks(subtasks || []);
    }, [subtasks]);

    // Сброс вкладки на 'Экземпляр' при каждом открытии диалога
    React.useEffect(() => {
        if (open) setActiveTab(1);
    }, [open]);

    // // Загружаем подзадачи при смене задачи
    // React.useEffect(() => {
    //     if (open && currentTask && loadSubtasks) {
    //         loadSubtasks(currentTask.id).then(setCurrentSubtasks);
    //     }
    // }, [open, currentTask, loadSubtasks]);

    const { updateTask, updateTaskOverride, createTaskOverride } = useTasks();

    // Обработка изменений задачи
    const handleTaskChange = React.useCallback(
        async (updatedTask) => {
            if (!updatedTask) return;
            let finalTask = updatedTask;
            setCurrentTask(updatedTask);
            if (!updatedTask.id) return;
            if (updatedTask.is_instance) {
                if (updatedTask.is_override && updatedTask.override_id) {
                    await updateTaskOverride(updatedTask.override_id, { data: updatedTask });
                } else if (updatedTask.parent_task_id) {
                    const dateStr = updatedTask.start ? updatedTask.start.split('T')[0] : null;
                    if (!dateStr) return;
                    const res = await createTaskOverride({
                        task_id: updatedTask.parent_task_id,
                        date: dateStr,
                        type: 'modified',
                        data: updatedTask,
                    });
                    if (res && res.override) {
                        finalTask = {
                            ...updatedTask,
                            is_override: true,
                            override_id: res.override.id,
                            id: `${res.override.id}`,
                            is_instance: true,
                        };
                        setCurrentTask(finalTask);
                    }
                }
            } else {
                await updateTask({ taskId: updatedTask.id, ...updatedTask });
            }
            if (onChange) onChange(finalTask);
        },
        [onChange, updateTask, updateTaskOverride, createTaskOverride]
    );

    // Переключение вкладок
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        if (newValue === 0 && task) {
            setCurrentTask(task);
        } else if (newValue === 1 && parentTask) {
            setCurrentTask(parentTask);
        }
    };

    // Переход к override/серии из списка
    const handleSelectOverride = (item, isParent) => {
        setActiveTab(isParent ? 1 : 0);
        setCurrentTask(item);
    };

    if (!task) return null;

    function handleDelClick() {
        if (handleDelDateClick) handleDelDateClick(currentTask.id);
    }

    function handleCloseClick() {
        handleClose && handleClose();
    }

    return (
        <Dialog
            open={open}
            onClose={handleCloseClick}
            scroll={scroll}
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description"
            sx={{ maxWidth: "100%" }}
        >
            <DialogTitle id="scroll-dialog-title">Редактирование задачи</DialogTitle>
            { parentTask &&
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Экземпляр" />
                    <Tab label="Серия" disabled={!parentTask} />
                    <Tab label="Список" disabled={!parentTask} />
                </Tabs>
            }
            <DialogContent dividers={scroll === "paper"} style={{ width: "500px", maxWidth: "100%" }}>
                {activeTab === 0 && (
                    <TaskEditor
                        task={currentTask}
                        subtasks={currentSubtasks}
                        taskFields={taskFields}
                        onChange={handleTaskChange}
                        addSubTask={addSubTask}
                    />
                )}
                {activeTab === 1 && parentTask && (
                    <TaskEditor
                        task={parentTask}
                        subtasks={currentSubtasks}
                        taskFields={taskFields}
                        onChange={handleTaskChange}
                        addSubTask={addSubTask}
                    />
                )}
                {activeTab === 2 && (
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton selected={activeTab === 1} onClick={() => handleSelectOverride(parentTask, true)}>
                                <ListItemText primary={`Серия: ${parentTask?.title || 'Без названия'}`} secondary={parentTask ? `ID: ${parentTask.id}` : ''} />
                            </ListItemButton>
                        </ListItem>
                        <Divider />
                        {overrides && overrides.length > 0 ? overrides.map((ovr) => (
                            <ListItem key={ovr.id} disablePadding>
                                <ListItemButton selected={currentTask?.id === ovr.id} onClick={() => handleSelectOverride(ovr, false)}>
                                    <ListItemText
                                        primary={`Экземпляр: ${ovr.title || ''}`}
                                        secondary={`Дата: ${ovr.start ? new Date(ovr.start).toLocaleString() : ''} (ID: ${ovr.id})`}
                                    />
                                </ListItemButton>
                            </ListItem>
                        )) : (
                            <ListItem><ListItemText primary="Нет изменённых экземпляров" /></ListItem>
                        )}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDelClick}>Удалить дату выполнения</Button>
                <Button onClick={handleCloseClick}>Закрыть</Button>
            </DialogActions>
        </Dialog>
    );
}

TaskDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func,
    handleDelDateClick: PropTypes.func,
    scroll: PropTypes.string,
    task: PropTypes.object,
    subtasks: PropTypes.array,
    parentTask: PropTypes.object,
    parentSubtasks: PropTypes.array,
    overrides: PropTypes.array,
    loadSubtasks: PropTypes.func,
    taskFields: PropTypes.object,
    onChange: PropTypes.func,
    addSubTask: PropTypes.func,
};
