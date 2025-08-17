import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    List,
    ListItemButton,
    ListItemText,
    Collapse,
    Menu,
    MenuItem,
    Divider,
    Typography,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import PropTypes from "prop-types";
import { Draggable } from "@fullcalendar/interaction";
import useContextMenu from "./hooks/useContextMenu";
import TaskItem from "./TaskItem.jsx";
import {
    useChangeTaskStatusMutation,
    useUpdateTaskMutation,
    useDeleteFromChildesMutation,
    useLinkTaskMutation,
} from "../../store/tasksSlice";
import {
    setSelectedTaskId,
    setSelectedTask,
} from "../../store/todoLayoutSlice.js";
import { useUpdateListMutation } from "../../store/listsSlice";
import { setCompletedTasksOpen, toggleTaskExpanded } from "../../store/todoLayoutSlice";


function TasksList({
    containerId,
    listsList,
    projects = [],
    selectedList,
    isNeedContextMenu = false,
    additionalButton = null,
    additionalButtonClick = null,
    tasks = [],
    onSuccess = null,
    onError = null,
}) {
    const dispatch = useDispatch();
    const { anchorEl, openMenu, closeMenu } = useContextMenu();

    // RTK Query Mutations
    const [changeTaskStatusMutation] = useChangeTaskStatusMutation();
    const [updateTaskMutation] = useUpdateTaskMutation();
    const [deleteFromChildesMutation] = useDeleteFromChildesMutation();
    const [linkTaskMutation] = useLinkTaskMutation();
    const [updateListMutation] = useUpdateListMutation();

    // State from Redux
    const { expandedTasks, completedTasksOpen, selectedTaskId } = useSelector((state) => state.todoLayout);

    // Local state
    const [listsMenuAnchorEl, setListsMenuAnchorEl] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [targetItemId, setTargetItemId] = useState(null);

    // Logic for splitting tasks into active and completed
    const { activeTasks, completedTasks } = useMemo(() => {
        const active = [];
        const completed = [];
        if (Array.isArray(tasks)) {
            tasks.forEach(task => {
                if (task.is_completed) {
                    completed.push(task);
                } else {
                    active.push(task);
                }
            });
        }
        return { activeTasks: active, completedTasks: completed };
    }, [tasks]);


    // useEffect for Draggable initialization
    useEffect(() => {
        const draggableEl = document.getElementById(`tasksList${containerId}`);
        if (!draggableEl) return;

        const draggable = new Draggable(draggableEl, {
            itemSelector: '.draggable-task',
            eventData: (eventEl) => {
                const id = eventEl.getAttribute("data-id");
                const task = tasks.find((t) => String(t.id) === id);
                if (!task) return null;
                return {
                    title: task.title,
                    id: task.id,
                    start: task.start || null,
                    end: task.end || null,
                    allDay: !task.start,
                };
            },
        });

        return () => draggable.destroy();
    }, [tasks, containerId]);


    const handleTaskClick = useCallback((taskId) => {
        dispatch(toggleTaskExpanded(taskId));
    }, [dispatch]);

    // Мемоизированные обработчики
    const handleToggle = useCallback(async (task_id, checked) => {
        if (!selectedList?.id) return;
        const status_id = checked ? 2 : 1; // TODO: get final status from settings
        try {
            await changeTaskStatusMutation({ taskId: task_id, status_id, completed_at: checked ? new Date().toISOString() : null, listId: selectedList.id }).unwrap();
            if (onSuccess) onSuccess(`Task status changed`);
        } catch (err) {
            if (onError) onError(err);
        }
    }, [changeTaskStatusMutation, selectedList, onSuccess, onError]);

    const handleAdditionalButtonClick = useCallback((task) => {
        if (typeof additionalButtonClick === "function") additionalButtonClick(task);
    }, [additionalButtonClick]);

    function handleContextMenu(event, item) {
        openMenu(event);
        setTargetItemId(item.id);
    }

    console.log(selectedTaskId, "selectedTaskId from TasksList");

    function handleCloseMenu() {
        setListsMenuAnchorEl(null);
        closeMenu();
        setActionType(null);
    }

    async function handleChangeChildesOrder(elementId, direction) {
        handleCloseMenu();
        if (!selectedList || !selectedList.childes_order) return;

        const newChildesOrder = [...selectedList.childes_order];
        const index = newChildesOrder.indexOf(elementId);

        if (index === -1) return;

        if (direction === "up" && index > 0) {
            [newChildesOrder[index - 1], newChildesOrder[index]] = [newChildesOrder[index], newChildesOrder[index - 1]];
        } else if (direction === "down" && index < newChildesOrder.length - 1) {
            [newChildesOrder[index + 1], newChildesOrder[index]] = [newChildesOrder[index], newChildesOrder[index + 1]];
        } else {
            return;
        }

        try {
            await updateListMutation({ listId: selectedList.id, childes_order: newChildesOrder }).unwrap();
            if (onSuccess) onSuccess('Порядок задач изменен');
        } catch (err) {
            if (onError) onError(err);
        }
    }

    async function handleDeleteFromChildes(elementId) {
        if (!selectedList?.id) return;
        try {
            await deleteFromChildesMutation({
                source_id: `task_${elementId}`,
                group_id: selectedList.id,
            }).unwrap();
            if (onSuccess) onSuccess('Задача удалена из списка');
        } catch (err) {
            if (onError) onError(err);
        }
        handleCloseMenu();
    }

    async function handleToListAction(targetId, actionTypeName = null) {
        const finalActionType = actionTypeName || actionType;
        const params = {
            task_id: targetItemId,
            list_id: targetId,
            action: finalActionType,
        };
        if (finalActionType === "move" && selectedList?.id) {
            params.source_list_id = selectedList.id;
        }

        try {
            await linkTaskMutation(params).unwrap();
            if (onSuccess) onSuccess('Задача перемещена');
        } catch (err) {
            if (onError) onError(err);
        }
        handleCloseMenu();
    }

    function handleUpToTask() {
        if (!selectedList?.id) return;
        handleToListAction(selectedList.id, "link");
    }

    function handleOpenListsMenu(event, actionType) {
        setActionType(actionType);
        setListsMenuAnchorEl(event.currentTarget);
    }

    function handleCloseListsMenu() {
        setListsMenuAnchorEl(null);
    }

    function handleDragStart(event, task){
        event.dataTransfer.setData("task", JSON.stringify(task));
    }

    const handleAddToMyDayClick = useCallback(async () => {
        try {
            // Assuming "My Day" is a list with a specific, known ID or alias.
            // This logic might need adjustment based on how "My Day" is identified.
            // For now, let's assume we need to update the task.
            await updateTaskMutation({ taskId: targetItemId, isMyDay: true }).unwrap();
            if (onSuccess) onSuccess('Добавлено в "Мой день"');
        } catch (err) {
            if (onError) onError(err);
        }
        handleCloseMenu();
    }, [updateTaskMutation, targetItemId, onSuccess, onError]);

    // Мемоизированная функция рендера задачи
    const renderTask = useCallback((task) => {
        const hasChildren = task.childes_order && task.childes_order.length > 0;

        return (
            <TaskItem
                key={task.id}
                task={task}
                selectedTaskId={selectedTaskId}
                open={expandedTasks}
                onTaskSelect={(taskId) => {
                    const selectedTask = tasks.find(t => t.id === taskId);
                    dispatch(setSelectedTaskId(taskId));
                    dispatch(setSelectedTask(selectedTask));
                }}
                onTaskToggle={handleToggle}
                onExpandToggle={handleTaskClick}
                onAdditionalButtonClick={handleAdditionalButtonClick}
                onContextMenu={handleContextMenu}
                onDragStart={handleDragStart}
                additionalButton={additionalButton}
                isNeedContextMenu={isNeedContextMenu}
            >
                {hasChildren && (
                    <Collapse in={expandedTasks[task.id]} timeout="auto" unmountOnExit>
                        <List disablePadding sx={{ pl: 3 }}>
                            {task.childes_order.map((childId) => {
                                const childTask = tasks.find((t) => t.id === childId);
                                return childTask ? renderTask(childTask) : null;
                            })}
                        </List>
                    </Collapse>
                )}
            </TaskItem>
        );
    }, [
        selectedTaskId,
        expandedTasks,
        handleToggle,
        handleTaskClick,
        handleAdditionalButtonClick,
        handleContextMenu,
        handleDragStart,
        additionalButton,
        isNeedContextMenu,
        tasks,
    ]);

    if (!tasks || !selectedList) {
        return (
            <Typography variant="body2" color="textSecondary" align="center">
                Нет задач для отображения
            </Typography>
        );
    }


    return (
        <>
            <List sx={{ width: "100%", pt: 0 }} component="nav" id={`tasksList${containerId}`}>
                {activeTasks.map((task) => renderTask(task))}
                {completedTasks.length > 0 && (
                    <div>
                        <ListItemButton onClick={() => dispatch(setCompletedTasksOpen(!completedTasksOpen))}>
                            <ListItemText primary="Выполненные" />
                            {completedTasksOpen ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                        <Collapse in={completedTasksOpen} timeout="auto" unmountOnExit>
                            <List disablePadding>{completedTasks.map((task) => renderTask(task))}</List>
                        </Collapse>
                    </div>
                )}
            </List>
            {isNeedContextMenu && (
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                    <MenuItem key="addToMyDay" onClick={handleAddToMyDayClick}>
                        Добавить в Мой день
                    </MenuItem>
                    {(listsList || []).filter((item) => item.type == "list").length > 0 && [
                        <MenuItem key="moveToList" onClick={(event) => handleOpenListsMenu(event, "move")}>Переместить в список</MenuItem>,
                        <MenuItem key="linkToList" onClick={(event) => handleOpenListsMenu(event, "link")}>Связать со списком</MenuItem>,
                    ]}
                    {!selectedList?.childes_order?.includes(targetItemId) && [
                        <MenuItem key="upToTask" onClick={() => handleUpToTask()}>
                            Поднять до задачи
                        </MenuItem>,
                    ]}
                    {selectedList?.childes_order?.includes(targetItemId) && [
                        <Divider key="divider2" />,
                        <MenuItem key="moveUp" onClick={() => handleChangeChildesOrder(targetItemId, "up")}>
                            Переместить выше
                        </MenuItem>,
                        <MenuItem key="moveDown" onClick={() => handleChangeChildesOrder(targetItemId, "down")}>
                            Переместить ниже
                        </MenuItem>,
                        <MenuItem key="toggleInList" onClick={() => handleDeleteFromChildes(targetItemId)}>
                            Удалить из этого списка
                        </MenuItem>,
                    ]}

                    {/* <MenuItem onClick={handleDeleteClick}>Удалить</MenuItem> */}
                </Menu>
            )}

            {isNeedContextMenu && (
                <Menu anchorEl={listsMenuAnchorEl} open={Boolean(listsMenuAnchorEl)} onClose={handleCloseListsMenu}>
                    {(() => {
                        if (!listsList || !projects) return [];
                        const allItems = (listsList || []).concat(projects || []);
                        const itemsMap = new Map(allItems.map(item => [item.id, item]));
                        const rootProjects = (projects || []).filter(item => !item.deleted);
                        const elements = [];
                        let menuIndex = 0;
                        const visited = new Set();
                        const traverse = (item, depth = 0) => {
                            if (visited.has(item.id) || depth > 10) return;
                            visited.add(item.id);
                            
                            if (item.type === 'project' || item.type === 'group') {
                                elements.push(
                                    <MenuItem key={menuIndex++} disabled sx={{ pl: depth * 2 }} data-id={item.id}>
                                        {item.title}
                                    </MenuItem>
                                );
                                (item.childes_order || []).forEach(childId => {
                                    const child = itemsMap.get(childId);
                                    if (child && !visited.has(childId)) {
                                        traverse(child, depth + 1);
                                    }
                                });
                            } else if (item.type === 'list') {
                                const currentIndex = menuIndex++;
                                elements.push(
                                    <MenuItem key={currentIndex} data-id={item.id} onClick={() => handleToListAction(item.id)} sx={{ pl: depth * 2 }}>
                                        {item.title}
                                    </MenuItem>
                                );
                            }
                        };
                        rootProjects.forEach(item => traverse(item));
                        const rootLists = (listsList || []).filter(item => item.in_general_list && !item.deleted && !item.parent_id);
                        rootLists.forEach(item => traverse(item));
                        return elements;
                    })()}
                </Menu>
            )}
        </>
    );
}

TasksList.propTypes = {
    containerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    listsList: PropTypes.array,
    projects: PropTypes.array,
    isNeedContextMenu: PropTypes.bool,
    selectedList: PropTypes.object,
    additionalButtonClick: PropTypes.func,
    additionalButton: PropTypes.object,
    tasks: PropTypes.array,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
};

export default memo(TasksList);
