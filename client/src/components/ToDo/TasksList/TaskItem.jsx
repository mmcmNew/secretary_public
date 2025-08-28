import { memo, useCallback } from "react";
import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    // Collapse,
    Checkbox,
    IconButton,
    Paper,
    Box,
    CircularProgress,
} from "@mui/material";
import { 
    // xpandLess, ExpandMore, 
    MoreVert as MoreVertIcon } from "@mui/icons-material";
// import StarBorderIcon from "@mui/icons-material/StarBorder";
// import StarIcon from "@mui/icons-material/Star";
import PropTypes from "prop-types";
import TasksList from "./index.jsx";
import { useGetTasksByIdsQuery } from "../../../store/tasksSlice.js";

const LazySubtasks = memo((props) => {
    const { task, ...rest } = props;
    const { data, isLoading, isFetching } = useGetTasksByIdsQuery({
        listId: task.id,
        ids: task.childes_order,
    });

    console.log('LazySubtasks: task=', task, 'data=', data, 'isLoading=', isLoading, 'isFetching=', isFetching);

    if (isLoading || isFetching) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
            </Box>
        );
    }

    const subtasks = data?.tasks || [];
    console.log('LazySubtasks: subtasks=', subtasks);


    return <TasksList tasks={subtasks} {...rest} />;
});

LazySubtasks.propTypes = {
    task: PropTypes.object.isRequired,
};

LazySubtasks.displayName = 'LazySubtasks';

// Мемоизированный компонент задачи (presentational)
const TaskItem = memo((props) => {
    const {
        task,
        selectedTaskId,
        // expandedMap,
        onTaskSelect,
        onTaskToggle,
        // onExpandToggle,
        // onAdditionalButtonClick,
        onContextMenu,
        onDragStart,
        // additionalButton,
        isNeedContextMenu,
    } = props;

    const handleCheckboxChange = useCallback((e) => {
        e.stopPropagation();
        onTaskToggle(task.id, e.target.checked);
    }, [task, onTaskToggle]);

    // const handleExpandClick = useCallback((event) => {
    //     event.stopPropagation();
    //     onExpandToggle(task.id);
    // }, [task, onExpandToggle]);

    const handleTaskClick = useCallback(() => {
        onTaskSelect(task.id);
    }, [task, onTaskSelect]);

    // const handleAdditionalClick = useCallback((event) => {
    //     event.stopPropagation();
    //     onAdditionalButtonClick(task);
    // }, [task, onAdditionalButtonClick]);

    const handleContextMenuClick = useCallback((event) => {
        event.stopPropagation();
        onContextMenu(event, task);
    }, [task, onContextMenu]);

    const handleDragStartEvent = useCallback((event) => {
        onDragStart(event, task);
    }, [task, onDragStart]);

    const labelId = `checkbox-list-label-${task?.id}`;
    // const hasChildren = task.childes_order && task.childes_order.length > 0;
    // const isExpanded = expandedMap && expandedMap[task.id];

    return (
        <div key={task.id}>
            <ListItem disablePadding>
                <Paper sx={{ mb: 1, width: "100%", p:0 }}>
                    <ListItemButton
                        className="draggable-task"
                        data-id={task.id}
                        draggable="true"
                        selected={selectedTaskId === task.id}
                        onClick={handleTaskClick}
                        onDragStart={handleDragStartEvent}
                        onContextMenu={isNeedContextMenu ? handleContextMenuClick : undefined}
                        sx={{ py:0 }}
                    >
                        <ListItemIcon onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                edge="start"
                                checked={task.is_completed}
                                tabIndex={-1}
                                disableRipple
                                slotProps={{ input: { 'aria-labelledby': labelId } }}
                                onChange={handleCheckboxChange}
                            />
                        </ListItemIcon>
                        <ListItemText id={labelId} primary={task.title} />
                        {/* {hasChildren && (
                            <IconButton
                                edge="end"
                                onClick={handleExpandClick}
                            >
                                {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        )} */}
                        {/* <IconButton onClick={handleAdditionalClick}>
                            {additionalButton ? React.createElement(additionalButton) : task.is_important === true ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton> */}
                        {isNeedContextMenu && (
                            <IconButton
                                edge="end"
                                onClick={handleContextMenuClick}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        )}
                    </ListItemButton>
                </Paper>
            </ListItem>
            {/* {hasChildren && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ pl: 4, borderLeft: '2px solid #ddd', ml: 2 }}>
                        <LazySubtasks {...props} />
                    </Box>
                </Collapse>
            )} */}
        </div>
    );
});

TaskItem.displayName = 'TaskItem';

TaskItem.propTypes = {
    task: PropTypes.object.isRequired,
    selectedTaskId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    expandedMap: PropTypes.object,
    onTaskSelect: PropTypes.func,
    onTaskToggle: PropTypes.func,
    onExpandToggle: PropTypes.func,
    onAdditionalButtonClick: PropTypes.func,
    onContextMenu: PropTypes.func,
    onDragStart: PropTypes.func,
    additionalButton: PropTypes.object,
    isNeedContextMenu: PropTypes.bool,
};

export default TaskItem;
