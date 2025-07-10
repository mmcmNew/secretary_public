import { PropTypes } from "prop-types";
import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TaskEditor from "../ToDo/TaskEditor";

export default function TaskDialog({
    open,
    handleClose,
    handleDelDateClick,
    scroll,
    setSelectedTaskId,
    tasks,
    selectedTaskId,
    taskFields,
    addSubTask = null,
    updateTask = null,
    changeTaskStatus = null,
    deleteTask = null,
}) {
    // console.log("TaskDialog:  selectedTaskId: ", selectedTaskId);
    // console.log("TaskDialog:  tasks: ", tasks);
    // console.log("TaskDialog:  taskFields: ", taskFields);
    const descriptionElementRef = React.useRef(null);

    React.useEffect(() => {
        if (open) {
            const { current: descriptionElement } = descriptionElementRef;
            if (descriptionElement !== null) {
                descriptionElement.focus();
            }
        }
    }, [open]);

    if (!selectedTaskId) {
        return null;
    }

    function handleDelClick() {
        if (handleDelDateClick) handleDelDateClick(selectedTaskId);
        if (typeof setSelectedTaskId === "function") setSelectedTaskId(null);
    }

    function handleCloseClick() {
        if (typeof setSelectedTaskId === "function") setSelectedTaskId(null);
        handleClose();
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
            <DialogTitle id="scroll-dialog-title">Изменить задачу</DialogTitle>
            <DialogContent dividers={scroll === "paper"} style={{ width: "500px", maxWidth: "100%" }}>
                <TaskEditor
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    taskFields={taskFields}
                    addSubTask={addSubTask}
                    updateTask={updateTask}
                    changeTaskStatus={changeTaskStatus}
                    deleteTask={deleteTask}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDelClick}>Удалить дату выполнения</Button>
                <Button onClick={handleCloseClick}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

TaskDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func,
    handleDelDateClick: PropTypes.func,
    scroll: PropTypes.string,
    setSelectedTaskId: PropTypes.func,
    tasks: PropTypes.array,
    selectedTaskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    taskFields: PropTypes.object,
    addSubTask: PropTypes.func,
    updateTask: PropTypes.func,
    changeTaskStatus: PropTypes.func,
    deleteTask: PropTypes.func,
};
