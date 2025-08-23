import React, { memo, useCallback } from "react";
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Checkbox,
    IconButton,
    Paper,
} from "@mui/material";
import { ExpandLess, ExpandMore, MoreVert as MoreVertIcon } from "@mui/icons-material";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import PropTypes from "prop-types";

// Мемоизированный компонент задачи (presentational)
// expandedMap — объект { [taskId]: boolean } контролируется внешне (store)
const TaskItem = memo(({
    task,
    selectedTaskId,
    expandedMap,
    onTaskSelect,
    onTaskToggle,
    onExpandToggle,
    onAdditionalButtonClick,
    onContextMenu,
    onDragStart,
    additionalButton,
    isNeedContextMenu,
    children,
}) => {
    const labelId = `checkbox-list-label-${task.id}`;
    const hasChildren = task.childes_order && task.childes_order.length > 0;

    const handleCheckboxChange = useCallback((e) => {
        e.stopPropagation();
        onTaskToggle(task.id, e.target.checked);
    }, [task.id, onTaskToggle]);

    const handleExpandClick = useCallback((event) => {
        event.stopPropagation();
        onExpandToggle(task.id);
    }, [task.id, onExpandToggle]);

    const handleTaskClick = useCallback(() => {
        onTaskSelect(task.id);
    }, [task.id, onTaskSelect]);

    const handleAdditionalClick = useCallback((event) => {
        event.stopPropagation();
        onAdditionalButtonClick(task);
    }, [task, onAdditionalButtonClick]);

    const handleContextMenuClick = useCallback((event) => {
        event.stopPropagation();
        onContextMenu(event, task);
    }, [task, onContextMenu]);

    const handleDragStartEvent = useCallback((event) => {
        onDragStart(event, task);
    }, [task, onDragStart]);

    return (
        <div key={task.id}>
            <ListItem disablePadding>
                <Paper sx={{ mb: 1, width: "100%" }}>
                    <ListItemButton
                        className="draggable-task"
                        data-id={task.id}
                        draggable="true"
                        selected={selectedTaskId === task.id}
                        onClick={handleTaskClick}
                        onDragStart={handleDragStartEvent}
                        onContextMenu={isNeedContextMenu ? handleContextMenuClick : undefined}
                    >
                        <ListItemIcon onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                edge="start"
                                checked={task.is_completed}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ "aria-labelledby": labelId }}
                                onChange={handleCheckboxChange}
                            />
                        </ListItemIcon>
                        <ListItemText id={labelId} primary={task.title} />
                        {hasChildren && (
                            <IconButton
                                edge="end"
                                onClick={handleExpandClick}
                            >
                                {expandedMap && expandedMap[task.id] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        )}
                        <IconButton onClick={handleAdditionalClick}>
                            {additionalButton ? React.createElement(additionalButton) : task.priority_id === 3 ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton>
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
            {children}
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
    children: PropTypes.node,
};

export default TaskItem;