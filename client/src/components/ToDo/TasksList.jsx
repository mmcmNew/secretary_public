import React, { useEffect, useState } from "react";
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

export default function TasksList({
    containerId,
    listsList,
    projects = [],
    selectedList,
    isNeedContextMenu = false,
    setSelectedTaskId = null,
    linkTaskList = null,
    additionalButtonClick = null,
    deleteFromChildes = null,
    additionalButton = null,
    tasks = [],
    selectedTaskId = null,
    updateTask = null,
    changeTaskStatus = null,
    onSuccess = null,
    onError = null,
}) {
    const [open, setOpen] = useState({});
    const [completedOpen, setCompletedOpen] = useState(true);
    const { anchorEl, openMenu, closeMenu } = useContextMenu();
    const [listsMenuAnchorEl, setListsMenuAnchorEl] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [targetItemId, setTargetItemId] = useState(null);

    // useEffect(() => {
    //     console.log('TasksList received props:', {
    //         tasks,
    //         selectedList,
    //         selectedTaskId,
    //         containerId
    //     });
    // }, [tasks, selectedList, selectedTaskId, containerId]);

    useEffect(() => {
        const draggableEl = document.getElementById(`tasksList${containerId}`);
        if (!draggableEl) {
            // console.log('Draggable element not found:', `tasksList${containerId}`);
            return;
        }

        // console.log('Initializing draggable for tasks:', tasks);
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

        return () => draggable.destroy(); // Очистка Draggable при размонтировании
    }, [tasks, containerId]);

    if (!tasks || !selectedList) {
        // console.log('TasksList render blocked:', { tasks, selectedList });
        return null;
    }

    function handleToggle(task_id, checked) {
        const status_id = checked ? 2 : 1;
        if (status_id == 2) {
            const audio = new Audio("/sounds/isComplited.wav");
            audio.play();
        }
        const updatedFields = { status_id };
        if (status_id == 2) {
            updatedFields.end_date = dayjs().toISOString();
        }
        if (typeof changeTaskStatus === "function") changeTaskStatus({ taskId: task_id, ...updatedFields, listId: selectedList.id });
    }

    // const isDefaultList = (listId) => defaultLists.some(list => list.id === listId);

    function handleClick(id) {
        setOpen((prevOpen) => ({
            ...prevOpen,
            [id]: !prevOpen[id],
        }));
    }

    function handleAdditionalButtonClick(task) {
        if (typeof additionalButtonClick === "function") additionalButtonClick(task);
    }

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

        setAnchorEl(null);
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
                await deleteFromChildes(`task_${elementId}`, selectedList.id);
                if (onSuccess) onSuccess('Задача удалена из списка');
            } catch (err) {
                if (onError) onError(err);
            }
        }
        setAnchorEl(null);
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

    async function handleAddToMyDay() {
        // Найти задачу по targetItemId
        const task = tasks.find((t) => t.id === targetItemId);
        if (!task) return;
        // Установить дату на сегодня с 12:00 до 13:00
        const today = dayjs().hour(12).minute(0).second(0).millisecond(0);
        const end = today.clone().add(1, 'hour');
        // Обновить задачу через updateTask, если доступно
        if (typeof updateTask === 'function') {
            try {
                await updateTask({
                    taskId: task.id,
                    start: today.toISOString(),
                    end: end.toISOString(),
                    deadline: end.toISOString(),
                });
                if (onSuccess) onSuccess('Добавлено в "Мой день"');
            } catch (err) {
                if (onError) onError(err);
            }
        }
        handleCloseMenu();
    }

    function renderTask(task) {
        const labelId = `checkbox-list-label-${task.id}`;
        const hasChildren = task.childes_order && task.childes_order.length > 0;

        return (
            <div key={task.id}>
                <ListItem disablePadding>
                    <Paper sx={{ mb: 1, width: "100%" }}>
                        <ListItemButton
                            className="draggable-task"
                            data-id={task.id}
                            draggable="true"
                            selected={selectedTaskId === task.id}
                            onClick={() => {
                                if (typeof setSelectedTaskId === "function") setSelectedTaskId(task.id);
                            }}
                            onDragStart={(event) => handleDragStart(event, task)}
                            onContextMenu={isNeedContextMenu ? (event) => handleContextMenu(event, task) : undefined}
                        >
                            <ListItemIcon onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    edge="start"
                                    checked={task.status_id === 2}
                                    tabIndex={-1}
                                    disableRipple
                                    inputProps={{ "aria-labelledby": labelId }}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleToggle(task.id, e.target.checked);
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText id={labelId} primary={task.title} />
                            {hasChildren && (
                                <IconButton
                                    edge="end"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleClick(task.id);
                                    }}
                                >
                                    {open[task.id] ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                            )}
                            <IconButton
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleAdditionalButtonClick(task);
                                }}
                            >
                                {additionalButton ? React.createElement(additionalButton) : task.priority_id === 3 ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                            {isNeedContextMenu && (
                                <IconButton
                                    edge="end"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openMenu(event);
                                        setTargetItemId(task.id);
                                    }}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                            )}
                        </ListItemButton>
                    </Paper>
                </ListItem>
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
            </div>
        );
    }

    // const activeTasks = isDefaultList(selectedList.id)
    //   ? tasks.filter(task => task.status_id !== 2)
    //   : selectedList.childes_order.map(taskId => tasks.find(t => t.id === taskId && t.status_id !== 2)).filter(Boolean);

    // const completedTasks = isDefaultList(selectedList.id)
    //   ? tasks.filter(task => task.status_id === 2)
    //   : selectedList.childes_order.map(taskId => tasks.find(t => t.id === taskId && t.status_id === 2)).filter(Boolean);

    // console.log(`selectedList: `, selectedList);
    const activeTasks = selectedList.childes_order
        .map((taskId) => tasks?.find((t) => t.id === taskId && t.status_id != 2))
        .filter(Boolean);

    const completedTasks = selectedList.childes_order
        .map((taskId) => tasks?.find((t) => t.id === taskId && t.status_id == 2))
        .filter(Boolean);

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
                    <MenuItem key="addToMyDay" onClick={handleAddToMyDay}>
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
};
