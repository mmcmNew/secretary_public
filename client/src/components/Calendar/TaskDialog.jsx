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

    // Сброс вкладки на 'Экземпляр' при каждом открытии диалога
    React.useEffect(() => {
        if (open && parentTask) setActiveTab(1)
        else setActiveTab(0)
    }, [open, parentTask]);

    // Обработка изменений задачи
    const handleTaskChange = React.useCallback(
        async (updatedTask) => {
            // Если это экземпляр задачи (instance), добавляем нужные поля для override
            if (task?.is_instance && task?.override_id) {
                updatedTask.is_override = true;
                updatedTask.override_id = task.override_id;
            }
            if (onChange) await onChange(updatedTask);
        },
        [onChange, task]
    );

    // Переключение вкладок
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Переход к override/серии из списка
    const handleSelectOverride = (item, isParent) => {
        setActiveTab(isParent ? 1 : 0);
    };

    if (!task) return null;

    function handleDelClick() {
        if (handleDelDateClick) handleDelDateClick(task.id);
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
                        task={task}
                        subtasks={subtasks}
                        taskFields={taskFields}
                        onChange={handleTaskChange}
                        addSubTask={addSubTask}
                    />
                )}
                {activeTab === 1 && parentTask && (
                    <TaskEditor
                        task={parentTask}
                        subtasks={subtasks}
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
                                <ListItemButton selected={task?.id === ovr.id} onClick={() => handleSelectOverride(ovr, false)}>
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
