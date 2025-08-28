import { memo, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button, Typography, TextField, ListItemButton, ListItemText, Collapse } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { 
  // useGetTasksByIdsQuery, 
  useAddTaskMutation, useGetTasksByIdsQuery, useGetTasksByListIdQuery } from '../../store/tasksSlice';
import { useGetListsQuery, useUpdateListMutation } from '../../store/listsSlice';
import { setSelectedListId, setEditingTitle, setCompletedTasksOpen, toggleTaskExpanded } from '../../store/todoLayoutSlice';
import PropTypes from 'prop-types';

// Hooks
import { useTaskActions } from "./TasksList/hooks/useTaskActions";
import { useTaskDragDrop } from "./TasksList/hooks/useTaskDragDrop";
import { useTaskMenu } from "./TasksList/hooks/useTaskMenu";
import { splitTasksByStatus } from './TasksList/index.js';

// Components
import TaskContextMenu from "./TasksList/ContextMenu/TaskContextMenu.jsx";
import ListsSelectionMenu from "./TasksList/ContextMenu/ListsSelectionMenu.jsx";
import TasksList from './TasksList/index.js';
import NewTaskInput from './NewTaskInput.jsx';

function ToDoTasksPanel({ mobile = false }) {
  const dispatch = useDispatch();
  const selectedListId = useSelector((state) => state.todoLayout.selectedListId);
  const isEditingTitle = useSelector((state) => state.todoLayout.isEditingTitle);
  const editingTitle = useSelector((state) => state.todoLayout.editingTitle);
  const expandedTasks = useSelector((state) => state.todoLayout.expandedTasks);
  const selectedTaskId = useSelector((state) => state.todoLayout.selectedTaskId);
  const contextTarget = useSelector((state) => state.todoLayout.contextTarget);
  const completedTasksOpen = useSelector((state) => state.todoLayout.completedTasksOpen);

  const { data: listsData, isDefaultList } = useGetListsQuery(undefined, {
    selectFromResult: ({ data }) => ({
      data,
      isDefaultList: data?.default_lists.some(l => l.id === selectedListId),
    }),
  });

  const selectedList = useMemo(() => {
    if (!selectedListId || !listsData) return null;
    const allLists = [...(listsData.lists || []), ...(listsData.default_lists || [])];
    return allLists.find(l => l.id === selectedListId) || null;
  }, [selectedListId, listsData]);

  // 1. Загружаем задачи списка
const { data: tasksData } = useGetTasksByListIdQuery(selectedListId, {
  skip: !selectedListId,
});

// 2. Собираем id подзадач
  const tasksIds = useMemo(() => {
    if (!selectedList || !tasksData?.tasks) return [];
    let ids = selectedList.childes_order || [];
    ids = ids.concat(
      ...tasksData.tasks.map(t => t.childes_order || [])
    );
    return Array.from(new Set(ids));
  }, [selectedList, tasksData]);

  // 3. Догружаем подзадачи
  const { data: subtasksData, isLoading: tasksLoading, isFetching, error: tasksError } =
    useGetTasksByIdsQuery(tasksIds, { skip: !selectedListId || tasksIds.length === 0 });

  // 4. Объединяем данные в useMemo
  const allTasksData = useMemo(() => {
    if (tasksData && subtasksData) {
      return { tasks: [...tasksData.tasks, ...subtasksData.tasks] };
    }
    return tasksData || subtasksData;
  }, [tasksData, subtasksData]);

  // 5. Формируем tasks
  const tasks = useMemo(() => {
    if (!selectedList || !allTasksData?.tasks) return [];
    const order = selectedList.childes_order || [];
    const map = new Map(allTasksData.tasks.map((t) => [t.id, t]));
    return order.map((id) => map.get(id)).filter(Boolean);
  }, [allTasksData, selectedList]);

  const [addTask, { isLoading: isAddingTask }] = useAddTaskMutation();
  const [updateList, { isLoading: isUpdatingList }] = useUpdateListMutation();

  // Hooks for task management
  const targetItemId = contextTarget?.id;
  const { activeTasks, completedTasks } = splitTasksByStatus(tasks);

  const taskActions = useTaskActions(selectedList, tasks);
  const dragDrop = useTaskDragDrop(selectedListId, tasks);
  const menu = useTaskMenu(listsData?.lists, listsData?.projects, selectedList, taskActions);

  const stableTaskSelect = useCallback((taskId) => {
      taskActions.handleSelectTask(taskId);
  }, [taskActions]);

  const stableTaskToggle = useCallback((taskId, checked) => {
      taskActions.handleToggle(taskId, checked);
  }, [taskActions]);

  const stableTaskExpand = useCallback((taskId) => {
      dispatch(toggleTaskExpanded(taskId));
  }, [dispatch]);

  const stableContextMenu = useCallback((event, item) => {
      menu.handleContextMenu(event, item);
  }, [menu]);

  const stableDragStart = useCallback((event, task) => {
      dragDrop.handleDragStart(event, task);
  }, [dragDrop]);

  const handleTitleEdit = async () => {
    if (editingTitle.trim() !== '' && selectedList) {
      try {
        await updateList({ 
          listId: selectedList.id, 
          title: editingTitle.trim(),
          type: selectedList.type 
        }).unwrap();
        dispatch(setEditingTitle({ isEditing: false, title: '' }));
      } catch (error) {
        console.error('Failed to update list title:', error);
      }
    }
  };

  const handleToggleCompleted = () => {
      dispatch(setCompletedTasksOpen(!completedTasksOpen));
  };

  if (!selectedListId) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Выберите список для просмотра задач
        </Typography>
      </Box>
    );
  }

  if (tasksLoading || isFetching) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Загрузка задач...
        </Typography>
      </Box>
    );
  }

  if (tasksError) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="error">
          Ошибка загрузки задач: {tasksError.message}
        </Typography>
      </Box>
    );
  }

  if (selectedList?.type === 'group' || selectedList?.type === 'project') {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" align="center">
          {selectedList.type === 'group' ? 'Описание группы (заглушка)' : 'Описание проекта (заглушка)'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {selectedList && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: mobile ? 1 : 4, py: 0, my: 1, borderBottom: '1px solid #ddd', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
            <ListIcon sx={{ mr: 1, flexShrink: 0 }} />
            {isEditingTitle ? (
              <TextField
                value={editingTitle}
                onChange={(e) => dispatch(setEditingTitle({ isEditing: true, title: e.target.value }))}
                onBlur={handleTitleEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleEdit()}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                variant="standard"
                size="small"
                disabled={isUpdatingList}
                sx={{ flex: 1, minWidth: 0 }}
              />
            ) : (
              <Typography
                variant="h6"
                onClick={() => {
                  if (!isDefaultList) {
                    dispatch(setEditingTitle({ isEditing: true, title: selectedList.title }));
                  }
                }}
                sx={{ cursor: isDefaultList ? 'default' : 'pointer', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {selectedList.title}
              </Typography>
            )}
          </Box>
          {mobile && (
            <Button sx={{mr: 'auto'}} onClick={() => dispatch(setSelectedListId(null))}>Назад</Button>
          )}
        </Box>
      )}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
        <TasksList 
          tasks={activeTasks} 
          selectedTaskId={selectedTaskId}
          expandedMap={expandedTasks}
          onTaskSelect={stableTaskSelect}
          onTaskToggle={stableTaskToggle}
          onExpandToggle={stableTaskExpand}
          onContextMenu={stableContextMenu}
          onDragStart={stableDragStart}
          isNeedContextMenu={true}
        />
        {completedTasks.length > 0 && (
            <>
                <ListItemButton onClick={handleToggleCompleted} >
                    <ListItemText primary="Выполненные" />
                    {completedTasksOpen ? <ExpandMore /> : <ExpandLess /> }
                </ListItemButton>
                <Collapse in={completedTasksOpen} timeout="auto" unmountOnExit>
                    <Box sx={{ height: '300px', overflow: 'auto' }}>
                        <TasksList
                            tasks={completedTasks}
                            selectedTaskId={selectedTaskId}
                            expandedMap={expandedTasks}
                            onTaskSelect={stableTaskSelect}
                            onTaskToggle={stableTaskToggle}
                            onExpandToggle={stableTaskExpand}
                            onContextMenu={stableContextMenu}
                            onDragStart={stableDragStart}
                            isNeedContextMenu={true}
                        />
                    </Box>
                </Collapse>
            </>
        )}
      </Box>
      {selectedListId && (
        <Box sx={{ position: 'sticky', bottom: 0, left: 0, width: '100%', zIndex: 2, p: 1 }}>
          <NewTaskInput 
            onAdd={(title) => addTask({ title, listId: selectedListId })} 
            disabled={isAddingTask} 
          />
        </Box>
      )}
      <TaskContextMenu
          anchorEl={menu.anchorEl}
          open={Boolean(menu.anchorEl)}
          onClose={menu.handleCloseMenu}
          onAddToMyDay={() => taskActions.handleAddToMyDay(targetItemId)}
          onOpenListsMenu={menu.handleOpenListsMenu}
          onUpToTask={() => taskActions.handleUpToTask(targetItemId)}
          onChangeChildesOrder={taskActions.handleChangeChildesOrder}
          onDeleteFromChildes={taskActions.handleDeleteFromChildes}
          listsList={listsData?.lists}
          selectedList={selectedList}
          targetItemId={targetItemId}
      />
      <ListsSelectionMenu
          anchorEl={menu.listsMenuAnchorEl}
          open={Boolean(menu.listsMenuAnchorEl)}
          onClose={menu.handleCloseListsMenu}
      >
          {menu.listsMenuItems()}
      </ListsSelectionMenu>
    </Box>
  );
}

export default memo(ToDoTasksPanel);

ToDoTasksPanel.propTypes = {
  mobile: PropTypes.bool,
};