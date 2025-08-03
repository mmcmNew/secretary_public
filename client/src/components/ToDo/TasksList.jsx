import React, { useEffect, useState, useContext, memo, useCallback, useMemo } from "react";
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
    Menu,
    MenuItem,
    Divider,
} from "@mui/material";
import { ExpandLess, ExpandMore, MoreVert as MoreVertIcon } from "@mui/icons-material";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import { Draggable } from "@fullcalendar/interaction";
import useContextMenu from "./hooks/useContextMenu";
import { useTasks } from "./hooks/useTasks.js";
import { useTasksLogic } from "./hooks/useTasksLogic.js";
import { AudioContext } from "../../contexts/AudioContext.jsx";
import TaskItem from "./TaskItem.jsx";

function TasksList({
    containerId,
    listsList,
    projects = [],
    selectedList,
    isNeedContextMenu = false,
    setSelectedTaskId = null,
    linkTaskList = null,
    deleteFromChildes = null,
    additionalButton = null,
    additionalButtonClick = null,
    tasks = [],
    selectedTaskId = null,
    updateTask = null,
    changeTaskStatus = null,
    onSuccess = null,
    onError = null,
    calendarRange = null, 
}) {
    const { playAudio } = useContext(AudioContext);
    const { anchorEl, openMenu, closeMenu } = useContextMenu();
    const { fetchCalendarEvents, getSubtasksByParentId } = useTasks({
        onError: (error) => {
            console.error('Error in useTasks:', error);
            if (onError) onError(error);
        }
    });
    
    // Используем новый хук для логики задач
    const {
        open,
        completedOpen,
        setCompletedOpen,
        activeTasks,
        completedTasks,
        handleTaskToggle,
        handleTaskClick,
        handleTaskSelect,
        handleAddToMyDay,
    } = useTasksLogic({
        tasks,
        selectedList,
        selectedTaskId,
        onTaskSelect: setSelectedTaskId,
        onTaskToggle: changeTaskStatus,
        onTaskUpdate: updateTask,
        onSubtasksLoad: getSubtasksByParentId,
        onCalendarUpdate: fetchCalendarEvents,
        onSuccess,
        onError,
        calendarRange,
    });

    const [listsMenuAnchorEl, setListsMenuAnchorEl] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [targetItemId, setTargetItemId] = useState(null);

    // useEffect for Draggable initialization - moved to be closer to other hooks
    useEffect(() => {
        const draggableEl = document.getElementById(`tasksList${containerId}`);
        if (!draggableEl) {
            return;
        }

        const draggable = new Draggable(draggableEl, {
            itemSelector: '.draggable-task',
            eventData: (eventEl) => {
                const id = eventEl.getAttribute("data-id");
                const task = tasks.find((task) => String(task.id) === id);
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

    if (!tasks || !selectedList) {
        return null;
    }

    // Мемоизированные обработчики
    const handleToggle = useCallback(async (task_id, checked) => {
        const status_id = checked ? 2 : 1;
        if (status_id === 2) {
            playAudio("/sounds/isComplited.wav", { queued: false });
        }
        await handleTaskToggle(task_id, checked);
    }, [playAudio, handleTaskToggle]);

    const handleAdditionalButtonClick = useCallback((task) => {
        if (typeof additionalButtonClick === "function") additionalButtonClick(task);
    }, [additionalButtonClick]);

    function handleContextMenu(event, item) {
        openMenu(event);
        setTargetItemId(item.id);
    }

    function handleCloseMenu() {
        setListsMenuAnchorEl(null);
        closeMenu();
        setActionType(null);
    }

    async function handleChangeChildesOrder(elementId, direction) {
        handleCloseMenu();
        if (!selectedList) return;

        const index = selectedList.childes_order.indexOf(elementId);

        // Проверяем, что элемент найден в childes_order
        if (index === -1) return;

        if (direction === "up" && index > 0) {
            // Меняем местами с предыдущим элементом
            [selectedList.childes_order[index - 1], selectedList.childes_order[index]] = [
                selectedList.childes_order[index],
                selectedList.childes_order[index - 1],
            ];
        } else if (direction === "down" && index < selectedList.childes_order.length - 1) {
            // Меняем местами со следующим элементом
            [selectedList.childes_order[index + 1], selectedList.childes_order[index]] = [
                selectedList.childes_order[index],
                selectedList.childes_order[index + 1],
            ];
        }

        // Сохраняем изменения в childes_order
        if (typeof updateList === "function") {
            try {
                await updateList({ listId: selectedList.id, childes_order: selectedList.childes_order });
                if (onSuccess) onSuccess('Порядок задач изменен');
            } catch (err) {
                if (onError) onError(err);
            }
        }
    }

    async function handleDeleteFromChildes(elementId) {
        if (typeof deleteFromChildes === "function") {
            try {
                await deleteFromChildes({
                    source_id: `task_${elementId}`,
                    group_id: selectedList.id,
                });
                if (onSuccess) onSuccess('Задача удалена из списка');
            } catch (err) {
                if (onError) onError(err);
            }
        }
        handleCloseMenu();
    }

    async function handleToListAction(targetId, actionTypeName = null) {
        if (!actionTypeName) actionTypeName = actionType;
        if (typeof linkTaskList === "function") {
            const params = {
                task_id: targetItemId,
                list_id: targetId,
                action: actionTypeName
            };
            if (actionTypeName === "move" && selectedList?.id) {
                params.source_list_id = selectedList.id;
            }
            try {
                await linkTaskList(params);
                if (onSuccess) onSuccess('Задача перемещена');
            } catch (err) {
                if (onError) onError(err);
            }
        }
        // Закрываем все меню после выполнения действия
        handleCloseMenu();
    }

    function handleUpToTask() {
        handleToListAction(selectedList.id, "link");
    }

    function handleOpenListsMenu(event, actionType) {
        setActionType(actionType);
        setListsMenuAnchorEl(event.currentTarget);
    }

    function handleCloseListsMenu() {
        setListsMenuAnchorEl(null);
    }

    // function handleOpenTasksMenu(event, actionType) {
    //   setActionType(actionType);
    //   setTasksMenuAnchorEl(event.currentTarget);
    // }

    // function handleCloseTasksMenu() {
    //   setTasksMenuAnchorEl(null);
    // }

    function handleDragStart(event, task){
        event.dataTransfer.setData("task", JSON.stringify(task));
    }

    const handleAddToMyDayClick = useCallback(async () => {
        await handleAddToMyDay(targetItemId);
        handleCloseMenu();
    }, [handleAddToMyDay, targetItemId]);

    // Мемоизированная функция рендера задачи
    const renderTask = useCallback((task) => {
        const hasChildren = task.childes_order && task.childes_order.length > 0;

        return (
            <TaskItem
                key={task.id}
                task={task}
                selectedTaskId={selectedTaskId}
                open={open}
                onTaskSelect={handleTaskSelect}
                onTaskToggle={handleToggle}
                onExpandToggle={handleTaskClick}
                onAdditionalButtonClick={handleAdditionalButtonClick}
                onContextMenu={handleContextMenu}
                onDragStart={handleDragStart}
                additionalButton={additionalButton}
                isNeedContextMenu={isNeedContextMenu}
            >
                {hasChildren && (
                    <Collapse in={open[task.id]} timeout="auto" unmountOnExit>
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
        open,
        handleTaskSelect,
        handleToggle,
        handleTaskClick,
        handleAdditionalButtonClick,
        handleContextMenu,
        handleDragStart,
        additionalButton,
        isNeedContextMenu,
        tasks,
    ]);

    // Задачи теперь вычисляются в useTasksLogic

    return (
        <>
            <List sx={{ width: "100%", pt: 0 }} component="nav" id={`tasksList${containerId}`}>
                {activeTasks.map((task) => renderTask(task))}
                {completedTasks.length > 0 && (
                    <div>
                        <ListItemButton onClick={() => setCompletedOpen(!completedOpen)}>
                            <ListItemText primary="Completed Tasks" />
                            {completedOpen ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                        <Collapse in={completedOpen} timeout="auto" unmountOnExit>
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
                    {listsList?.filter((item) => item.type == "list") && [
                        <MenuItem key="moveToList" onClick={(event) => handleOpenListsMenu(event, "move")}>Переместить в список</MenuItem>,
                        <MenuItem key="linkToList" onClick={(event) => handleOpenListsMenu(event, "link")}>Связать со списком</MenuItem>,
                    ]}
                    {!selectedList?.childes_order?.includes(targetItemId) && [
                        <MenuItem key="upToTask" onClick={() => handleUpToTask(selectedList.id)}>
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
                        const allItems = listsList.concat(projects);
                        const itemsMap = new Map(allItems.map(item => [item.id, item]));
                        // Корневые проекты
                        const rootProjects = projects.filter(item => !item.deleted);
                        const elements = [];
                        let menuIndex = 0;
                        const visited = new Set();
                        const traverse = (item, depth = 0) => {
                            if (visited.has(item.id) || depth > 10) return; // Предотвращаем циклы и слишком глубокую вложенность
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
                        // Также добавим списки вне проектов (inGeneralList)
                        const rootLists = listsList.filter(item => item.inGeneralList && !item.deleted && !item.parent_id);
                        rootLists.forEach(item => traverse(item));
                        return elements;
                    })()}
                </Menu>
            )}

            {/* Подменю для задач
      <Menu
        anchorEl={tasksMenuAnchorEl}
        open={Boolean(tasksMenuAnchorEl)}
        onClose={handleCloseTasksMenu}
      >
        {tasks.filter(item => item.status_id !== 2).filter(item => item.id !== targetItemId).map(task => (
          <MenuItem key={task.id} onClick={() => handleToListAction(`task_${task.id}`)}>
            {task.title}
          </MenuItem>
        ))}
        {tasks.filter(item => item.status_id == 2).filter(item => item.id !== targetItemId).map(task => (
          <MenuItem key={task.id} onClick={() => handleToListAction(`task_${task.id}`)}>
            {task.title}
          </MenuItem>
        ))}
      </Menu> */}
        </>
    );
}

TasksList.propTypes = {
    containerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tasks: PropTypes.array,
    selectedTaskId: PropTypes.number,
    listsList: PropTypes.array,
    projects: PropTypes.array,
    isNeedContextMenu: PropTypes.bool,
    selectedList: PropTypes.object,
    setSelectedTaskId: PropTypes.func,
    updateList: PropTypes.func,
    updateTask: PropTypes.func,
    linkTaskList: PropTypes.func,
    additionalButtonClick: PropTypes.func,
    changeTaskStatus: PropTypes.func,
    deleteFromChildes: PropTypes.func,
    additionalButton: PropTypes.object,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
    calendarRange: PropTypes.object, // Добавляем пропс для диапазона календаря
};

export default memo(TasksList);
