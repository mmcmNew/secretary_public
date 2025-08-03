import { PropTypes } from "prop-types";
import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import TaskEditor from "../ToDo/TaskEditor";

export default function TaskDialog({
    open,
    handleClose,
    scroll,
    instance = null,
    task = null,
    subtasks = null,
    overrides = [],
    taskFields = {},
    onChangeTask = null,
    onChangeInstance = null,
    addSubTask = null,
    onDeleteTaskDate = null,
    onDeleteInstanceDate = null,
    changeInstanceStatus = null,
    changeTaskStatus = null,
}) {
    const [activeTab, setActiveTab] = React.useState(1);

    const hasParent = Boolean(task?.parentId);

    React.useEffect(() => {
        if (open) {
            setActiveTab(hasParent ? 1 : 0);
        }
    }, [open, hasParent]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleSelectOverride = (item, isParent) => {
        // setInstance(item);
        setActiveTab(isParent ? 1 : 0);
    };

    if (!task) return null;

    const isInstance = !!instance;

    // Готовим поля для редактора экземпляра задачи
    const allowedFields = ['start', 'end', 'type_id', 'priority_id', 'color', 'note'];
    const instanceTaskFields = Object.entries(taskFields).reduce((acc, [key, value]) => {
        if (allowedFields.includes(key) || value.type === 'range') {
            // Для экземпляров повторяющихся задач мы хотим редактировать только время, а не дату.
            // Поэтому меняем тип поля с 'range' (datetime) на 'time-range'.
            acc[key] = value.type === 'range' ? { ...value, type: 'time-range' } : value;
        }
        return acc;
    }, {});


    const handleDelClick = () => {
        if (activeTab === 0 && onChangeInstance && instance?.id) {
            // For instances, we use the onDeleteInstanceDate function
            if (onDeleteInstanceDate && instance?.parent_task_id && instance?.originalStart) {
                onDeleteInstanceDate({ 
                    parent_task_id: instance.parent_task_id, 
                    originalStart: instance.originalStart 
                });
            } else {
                onChangeInstance({ ...instance, type: 'skip' });
            }
        } else if (activeTab === 1 && onDeleteTaskDate && task?.id) {
            onDeleteTaskDate(task.id);
        }
    };

    const handleCloseClick = () => {
        handleClose && handleClose();
    };

    const renderContent = () => {
        if (!isInstance) {
            return (
                <TaskEditor
                    task={task}
                    subtasks={subtasks}
                    taskFields={taskFields}
                    showJournalButton={true}
                    onChange={(t) => onChangeTask(t)}
                    addSubTask={addSubTask}
                />
            );
        }

        return (
            <>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Экземпляр" />
                    <Tab label="Серия" />
                    {/* <Tab label="Список" /> */}
                </Tabs>
                {activeTab === 0 && (
                    <TaskEditor
                        task={instance}
                        taskFields={instanceTaskFields}
                        onChange={(t) => onChangeInstance(t)}
                        changeTaskStatus={changeInstanceStatus}
                        showJournalButton={false}
                    />
                )}
                {activeTab === 1 && (
                    <TaskEditor
                        task={task}
                        subtasks={subtasks}
                        taskFields={taskFields}
                        showJournalButton={true}
                        onChange={(t) => onChangeTask(t)}
                        addSubTask={addSubTask}
                        changeTaskStatus={changeTaskStatus}
                    />
                )}
                {/* {activeTab === 2 && (
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton selected={activeTab === 1} onClick={() => handleSelectOverride(parentTask, true)}>
                                <ListItemText primary={`Серия: ${parentTask?.title || 'Без названия'}`} secondary={parentTask ? `ID: ${parentTask.id}` : ''} />
                            </ListItemButton>
                        </ListItem>
                        <Divider />
                        {overrides?.length > 0 ? overrides.map((ovr) => (
                            <ListItem key={ovr.id} disablePadding>
                                <ListItemButton selected={task?.id === ovr.id} onClick={() => handleSelectOverride(ovr, false)}>
                                    <ListItemText
                                        primary={`Экземпляр: ${ovr.title || ''}`}
                                        secondary={`Дата: ${ovr.start ? new Date(ovr.start).toLocaleString() : ''} (ID: ${ovr.id})`}
                                    />
                                </ListItemButton>
                            </ListItem>
                        )) : (
                            <ListItem>
                                <ListItemText primary="Нет изменённых экземпляров" />
                            </ListItem>
                        )}
                    </List>
                )} */}
            </>
        );
    };

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
            <DialogContent dividers={scroll === "paper"} style={{ width: "500px", maxWidth: "100%" }}>
                {renderContent()}
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
    scroll: PropTypes.string,
    instance: PropTypes.object,
    task: PropTypes.object,
    subtasks: PropTypes.array,
    overrides: PropTypes.array,
    taskFields: PropTypes.object,
    onChangeTask: PropTypes.func,
    onChangeInstance: PropTypes.func,
    addSubTask: PropTypes.func,
    onDeleteTaskDate: PropTypes.func,
    onDeleteInstanceDate: PropTypes.func,
    changeInstanceStatus: PropTypes.func,
    changeTaskStatus: PropTypes.func,
};
