import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    // List is unused because we virtualize the list
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
import VirtualizedTasksList from './VirtualizedTasksList.jsx';
import {
    useChangeTaskStatusMutation,
    useUpdateTaskMutation,
    useDeleteFromChildesMutation,
    useLinkTaskMutation,
} from "../../store/tasksSlice";
import {
    setSelectedTaskId,
    setSelectedTask,
    setCompletedTasksOpen,
    toggleTaskExpanded,
    setContextTarget,
    clearContextTarget,
} from "../../store/todoLayoutSlice.js";
import { useUpdateListMutation } from "../../store/listsSlice";

// Pure helper: flatten hierarchical tasks into visible items using expanded map and optional ordering
function flattenTasks(taskList = [], expandedMap = {}, selectedList = null) {
    const mapById = new Map(taskList.map(t => [t.id, t]));
    const roots = (selectedList?.childes_order && selectedList.childes_order.length > 0)
        ? selectedList.childes_order.map(id => mapById.get(id)).filter(Boolean)
        : taskList.filter(t => !t.parent_id);

    const out = [];
    const visit = (task, level = 0) => {
        out.push({ task, level });
        if (task.childes_order && expandedMap[task.id]) {
            task.childes_order.forEach(childId => {
                const child = mapById.get(childId);
                if (child) visit(child, level + 1);
            });
        }
    };
    roots.forEach(r => visit(r, 0));
    return out;
}

// Lightweight memoized row to avoid recreating TaskItem render functions
const TaskRow = memo(function TaskRow({ task, level, selectedTaskId, expandedMap, onTaskSelect, onTaskToggle, onExpandToggle, onAdditionalButtonClick, onContextMenu, onDragStart, additionalButton, isNeedContextMenu }) {
    return (
        <div style={{ paddingLeft: level * 12 }}>
            <TaskItem
                task={task}
                selectedTaskId={selectedTaskId}
                expandedMap={expandedMap}
                onTaskSelect={onTaskSelect}
                onTaskToggle={onTaskToggle}
                onExpandToggle={onExpandToggle}
                onAdditionalButtonClick={onAdditionalButtonClick}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
                additionalButton={additionalButton}
                isNeedContextMenu={isNeedContextMenu}
            />
        </div>
    );
});

TaskRow.propTypes = {
    task: PropTypes.object.isRequired,
    level: PropTypes.number,
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

    // State from Redux (store is single source of truth for these UI flags)
    const { expandedTasks, completedTasksOpen, selectedTaskId, contextTarget } = useSelector((state) => state.todoLayout);

    // Local state (anchors, actionType) — anchors must stay local (non-serializable)
    const [listsMenuAnchorEl, setListsMenuAnchorEl] = useState(null);
    const [actionType, setActionType] = useState(null);

    // Получаем targetItemId из store.contextTarget
    const targetItemId = contextTarget?.id;

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

    // Compute visible (flattened) lists for virtualization
    const visibleActive = useMemo(() => flattenTasks(activeTasks, expandedTasks, selectedList), [activeTasks, expandedTasks, selectedList]);
    const visibleCompleted = useMemo(() => flattenTasks(completedTasks, expandedTasks, selectedList), [completedTasks, expandedTasks, selectedList]);

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

    const handleToggle = useCallback(async (task_id, checked) => {
        if (!selectedList?.id) return;
        const is_completed = checked;
        try {
            await changeTaskStatusMutation({ taskId: task_id, is_completed: is_completed, completed_at: checked ? new Date().toISOString() : null, listId: selectedList.id }).unwrap();
            if (onSuccess) onSuccess(`Task status changed`);
        } catch (err) {
            if (onError) onError(err);
        }
    }, [changeTaskStatusMutation, selectedList, onSuccess, onError]);

    const handleAdditionalButtonClick = useCallback((task) => {
        if (typeof additionalButtonClick === "function") additionalButtonClick(task);
    }, [additionalButtonClick]);

    const handleContextMenu = useCallback((event, item) => {
        openMenu(event);
        // store only id and menuType; anchorEl remains local in hook
        dispatch(setContextTarget({ id: item.id, menuType: 'task' }));
    }, [openMenu, dispatch]);

    const handleCloseMenu = useCallback(() => {
        setListsMenuAnchorEl(null);
        closeMenu();
        setActionType(null);
        dispatch(clearContextTarget());
    }, [closeMenu, dispatch]);

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
            if (onSuccess) onSuccess('Порядок задачи изменен');
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
            if (onSuccess) onSuccess('Задача перемещена/связана');
        } catch (err) {
            if (onError) onError(err);
        }
        handleCloseMenu();
    }

    function handleUpToTask() {
        if (!selectedList?.id) return;
        handleToListAction(selectedList.id, "link");
    }

    function handleOpenListsMenu(event, actionTypeParam) {
        setActionType(actionTypeParam);
        setListsMenuAnchorEl(event.currentTarget);
    }

    function handleCloseListsMenu() {
        setListsMenuAnchorEl(null);
    }

    const handleDragStart = useCallback((event, task) => {
        event.dataTransfer.setData("task", JSON.stringify(task));
    }, []);

    const handleSelectTask = useCallback((taskId) => {
        const selectedTask = tasks.find(t => t.id === taskId);
        dispatch(setSelectedTaskId(taskId));
        dispatch(setSelectedTask(selectedTask));
    }, [dispatch, tasks]);

    const handleAddToMyDayClick = useCallback(async () => {
        try {
            await updateTaskMutation({ taskId: targetItemId, isMyDay: true }).unwrap();
            if (onSuccess) onSuccess('Добавлено в "Мой день"');
        } catch (err) {
            if (onError) onError(err);
        }
        handleCloseMenu();
    }, [updateTaskMutation, targetItemId, onSuccess, onError, handleCloseMenu]);

    // Handlers passed to TaskRow are stable (useCallback where needed)
    

    if (!tasks || !selectedList) {
        return (
            <Typography variant="body2" color="textSecondary" align="center">
                Нет задач для отображения
            </Typography>
        );
    }

    return (
        <>
            <div id={`tasksList${containerId}`}>
                <VirtualizedTasksList
                    items={visibleActive}
                    itemContent={(index, item) => (
                        <TaskRow
                            key={item.task.id}
                            task={item.task}
                            level={item.level}
                            selectedTaskId={selectedTaskId}
                            expandedMap={expandedTasks}
                            onTaskSelect={handleSelectTask}
                            onTaskToggle={handleToggle}
                            onExpandToggle={handleTaskClick}
                            onAdditionalButtonClick={handleAdditionalButtonClick}
                            onContextMenu={handleContextMenu}
                            onDragStart={handleDragStart}
                            additionalButton={additionalButton}
                            isNeedContextMenu={isNeedContextMenu}
                        />
                    )}
                    style={{ height: '60vh' }}
                />

                {completedTasks.length > 0 && (
                    <div>
                        <ListItemButton onClick={() => dispatch(setCompletedTasksOpen(!completedTasksOpen))}>
                            <ListItemText primary="Выполненные" />
                            {completedTasksOpen ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                        <Collapse in={completedTasksOpen} timeout="auto" unmountOnExit>
                            <VirtualizedTasksList
                                items={visibleCompleted}
                                itemContent={(index, item) => (
                                    <TaskRow
                                        key={item.task.id}
                                        task={item.task}
                                        level={item.level}
                                        selectedTaskId={selectedTaskId}
                                        expandedMap={expandedTasks}
                                        onTaskSelect={handleSelectTask}
                                        onTaskToggle={handleToggle}
                                        onExpandToggle={handleTaskClick}
                                        onAdditionalButtonClick={handleAdditionalButtonClick}
                                        onContextMenu={handleContextMenu}
                                        onDragStart={handleDragStart}
                                        additionalButton={additionalButton}
                                        isNeedContextMenu={isNeedContextMenu}
                                    />
                                )}
                                style={{ height: '30vh' }}
                            />
                        </Collapse>
                    </div>
                )}
            </div>
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