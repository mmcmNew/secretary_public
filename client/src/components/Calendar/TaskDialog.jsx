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
    changeInstanceStatus = null,
    changeTaskStatus = null,
}) {
    const [activeTab, setActiveTab] = React.useState(1);

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

    const handleDelClick = () => {
        if (activeTab === 0 && onChangeInstance && instance?.id) {
            onChangeInstance({ ...instance, type: 'skip' });
        } else if (activeTab === 1 && onDeleteTaskDate && task?.id) {
            onDeleteTaskDate(task.id);
        }
    };

    const handleCloseClick = () => {
        handleClose && handleClose();
    };

    const renderContent = () => {
        if (!instance) {
            return (
                <TaskEditor
                    task={task}
                    subtasks={subtasks}
                    taskFields={taskFields}
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
                        // TODO: taskFields для Instance
                        taskFields={taskFields}
                        onChange={(t) => onChangeInstance(t)}
                        changeTaskStatus={changeInstanceStatus}
                    />
                )}
                {activeTab === 1 && (
                    <TaskEditor
                        task={task}
                        subtasks={subtasks}
                        taskFields={taskFields}
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
    task: PropTypes.object,
    parentTask: PropTypes.object,
    subtasks: PropTypes.array,
    overrides: PropTypes.array,
    taskFields: PropTypes.object,
    onChangeTask: PropTypes.func,
    onChangeParentTask: PropTypes.func,
    addSubTask: PropTypes.func,
    onDeleteTaskDate: PropTypes.func,
    onDeleteParentDate: PropTypes.func,
};
