import { useEffect, useRef, useState, memo, useCallback, useContext, useMemo } from 'react';
import {
  Menu,
  MenuItem,
  Button,
  Box,
  Divider
} from '@mui/material';
import PropTypes from 'prop-types';
import ListsSection from './ListsList/ListsSection';
import ContextMenu from './ListsList/ContextMenu';

import { useTasks } from './hooks/useTasks';
import { useListsLogic } from './hooks/useListsLogic';
import useContextMenu from './hooks/useContextMenu'
import { clearAllCache } from '../../utils/api';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ErrorContext } from '../../contexts/ErrorContext';

function ListsList({
  listsList = [],
  defaultLists = [],
  projects = [],
  isNeedContextMenu = false,
  setSelectedTaskId = null,
  selectedTaskId = null,
  updateAll = null,
  updateEvents = null,
  selectedListId = null,
  setSelectedListId = null,
  fetchLists = null,
  addList = null,
  deleteList = null,
  linkListGroup = null,
  deleteFromChildes = null,
  linkTaskList = null,
  changeChildesOrder = null,
  selectedList = null,
  setSelectedList = null,
  calendarRange = null,
  // deleteFromChildes = null,
}) {
  const { anchorEl, openMenu, closeMenu } = useContextMenu();
  const [targetItemId, setTargetItemId] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState(null);
  const [groupMenuPosition, setGroupMenuPosition] = useState(null);
  const [projectMenuPosition, setProjectMenuPosition] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [dropMenuAnchorEl, setDropMenuAnchorEl] = useState(null);
  const [droppedTask, setDroppedTask] = useState(null);
  const [dropTargetListId, setDropTargetListId] = useState(null);
  const [listDropMenuAnchorEl, setListDropMenuAnchorEl] = useState(null);
  const [droppedListItem, setDroppedListItem] = useState(null);
  const [listDropTargetId, setListDropTargetId] = useState(null);
  const inputRef = useRef(null);
  const { setError } = useContext(ErrorContext);
  const { fetchTasks, fetchLists: fetchListsHook, updateList, fetchCalendarEvents } = useTasks({
    onError: (error) => {
      console.error('Error in useTasks:', error);
      setError(error);
    }
  });

  // Используем новый хук для логики списков
  const {
    openGroups,
    editingItemId,
    editingTitle,
    setEditingTitle,
    handleToggleGroup,
    handleListSelect,
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleOrderChange,
    handleTaskDrop,
    handleListDrop,
    lists,
    default_lists,
    projects_list,
    // deleteFromChildes
  } = useListsLogic({
    listsList,
    defaultLists,
    projects,
    listsObject: listsList?.lists && listsList?.default_lists && listsList?.projects ? listsList : null,
    selectedListId,
    onListSelect: setSelectedListId,
    onListUpdate: updateList,
    onListLink: linkListGroup,
    onListDelete: deleteFromChildes,
    onTaskLink: linkTaskList,
    onSuccess: (message) => console.log(message),
    onError: setError,
  });

  // Мемоизированные обработчики
  const handleFullRefresh = useCallback(async () => {
    await clearAllCache();
    if (typeof fetchLists === 'function') await fetchLists({ id: 'get-lists' });
    else if (typeof fetchListsHook === 'function') await fetchListsHook({ id: 'get-lists' });
    if (typeof fetchTasks === 'function' && selectedListId) await fetchTasks(selectedListId);
    if (typeof fetchCalendarEvents === 'function') await fetchCalendarEvents(calendarRange);
  }, [fetchLists, fetchListsHook, fetchTasks, fetchCalendarEvents, selectedListId, calendarRange]);

  const handleListItemClick = useCallback((event, index) => {
    handleListSelect(index);
    if (typeof setSelectedTaskId === 'function') setSelectedTaskId(null);
  }, [handleListSelect, setSelectedTaskId]);

  const handleContextMenu = useCallback((event, item, groupId) => {
    console.log(item, groupId)
    openMenu(event);
    setTargetGroupId(groupId);
    setTargetItemId(item.id);
    handleEditStart(item.id, item.title);
  }, [openMenu, handleEditStart]);

  const handleCloseMenu = useCallback(() => {
    closeMenu();
    setTargetGroupId(null);
    handleEditCancel();
  }, [closeMenu, handleEditCancel]);

  const handleEditClick = useCallback((itemId) => {
    const item = [...lists, ...projects_list, ...default_lists].find(i => i.id === itemId);
    if (item) {
      handleEditStart(itemId, item.title);
    }
    closeMenu();
  }, [lists, projects_list, default_lists, handleEditStart, closeMenu]);

  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [editingItemId])

  const handleTitleChange = useCallback((event) => {
    setEditingTitle(event.target.value);
  }, [setEditingTitle]);

  const handleDeleteFromChildesClick = useCallback((elementId, groupId) => {
    closeMenu();
    if (typeof deleteFromChildes === 'function') {
      deleteFromChildes({source_id: elementId, group_id: groupId});
    }
  }, [closeMenu, deleteFromChildes]);

  const handleChangeChildesOrder = useCallback(async (elementId, direction, groupId) => {
    closeMenu();
    await handleOrderChange(elementId, direction, groupId);
    if (typeof updateAll === 'function') await updateAll();
    if (typeof updateEvents === 'function') await updateEvents();
  }, [closeMenu, handleOrderChange, updateAll, updateEvents]);

  async function handleAction(targetId) {
    // Сохраняем группу источника, так как handleCloseMenu обнуляет targetGroupId
    const sourceGroupId = targetGroupId;

    // Закрываем открытые подменю
    handleCloseGroupMenu();
    handleCloseProjectMenu();
    closeMenu();
    setActionType(null);

    if (actionType === 'move') {
      if (typeof linkListGroup === 'function') {
        await linkListGroup({ source_id: targetItemId, target_id: targetId });
      }
      if (typeof deleteFromChildes === 'function') {
        await deleteFromChildes({ source_id: targetItemId, group_id: sourceGroupId });
      }
      handleCloseMenu();
      console.log(`Перемещаем элемент с id ${targetItemId} в ${targetId} и удаляем из ${sourceGroupId}`);
    } else if (actionType === 'link') {
      if (typeof linkListGroup === 'function') {
        await linkListGroup({ source_id: targetItemId, target_id: targetId });
      }
      handleCloseMenu();
      console.log(`Связываем элемент с id ${targetItemId} с ${targetId}`);
    }
  }

  function handleOpenGroupMenu(event, actionType) {
    setActionType(actionType);
    setGroupMenuPosition({ top: event.clientY, left: event.clientX });
  }

  function handleCloseGroupMenu() {
    setGroupMenuPosition(null);
  }

  function handleOpenProjectMenu(event, actionType) {
    setActionType(actionType);
    setProjectMenuPosition({ top: event.clientY, left: event.clientX });
  }

  function handleCloseProjectMenu() {
    setProjectMenuPosition(null);
  }

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleEditSave();
      inputRef.current = null;
    }
  }, [handleEditSave]);

  const handleBlur = useCallback(() => {
    handleEditSave();
    inputRef.current = null;
  }, [handleEditSave]);

  const handleAddToGeneralList = useCallback((itemId) => {
    updateList({listId: itemId, inGeneralList: 1});
    closeMenu();
  }, [updateList, closeMenu]);

  function findParentId(id) {
    const grp = lists.find(g => Array.isArray(g.childes_order) && g.childes_order.includes(id));
    if (grp) return grp.id;
    const proj = projects_list?.find(p => Array.isArray(p.childes_order) && p.childes_order.includes(id));
    if (proj) return proj.id;
    return null;
  }

  const handleTaskDropEvent = useCallback((event, listId) => {
    event.preventDefault();
    const taskData = event.dataTransfer.getData('task');
    if (!taskData) return;
    setDroppedTask(JSON.parse(taskData));
    setDropTargetListId(listId);
    setDropMenuAnchorEl(event.currentTarget);
  }, []);

  const handleListDragStart = useCallback((event, item) => {
    event.dataTransfer.setData('list', JSON.stringify(item));
  }, []);

  const handleListDropEvent = useCallback((event, targetId) => {
    event.preventDefault();
    const listData = event.dataTransfer.getData('list');
    if (!listData) return;
    const dropped = JSON.parse(listData);
    setDroppedListItem(dropped);
    setListDropTargetId(targetId);
    setListDropMenuAnchorEl(event.currentTarget);
  }, []);

  const handleDropAction = useCallback(async (action) => {
    if (!droppedTask) return;
    await handleTaskDrop(droppedTask, dropTargetListId, action);
    handleCloseDropMenu();
  }, [droppedTask, dropTargetListId, handleTaskDrop]);

  const handleCloseDropMenu = useCallback(() => {
    setDropMenuAnchorEl(null);
    setDroppedTask(null);
    setDropTargetListId(null);
  }, []);

  const handleListDropAction = useCallback(async (action) => {
    if (!droppedListItem) return;
    await handleListDrop(droppedListItem, listDropTargetId, action);
    if (typeof updateAll === 'function') await updateAll();
    handleCloseListDropMenu();
  }, [droppedListItem, listDropTargetId, handleListDrop, updateAll]);

  const handleCloseListDropMenu = useCallback(() => {
    setListDropMenuAnchorEl(null);
    setDroppedListItem(null);
    setListDropTargetId(null);
  }, []);




  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 1 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            if (typeof fetchLists === 'function') fetchLists({ silent: false, refetch: true });
          }}
        >
          Обновить
        </Button>
      </Box>
      <Box sx={{
          height: 'calc(100% - 50px)', // Вычитаем высоту кнопки
          overflowY: 'auto'
        }}>
          <ListsSection
            items={default_lists}
            sectionType="default"
            selectedListId={selectedListId}
            selectedTaskId={selectedTaskId}
            openGroups={openGroups}
            onSelect={handleListItemClick}
            onToggleGroup={handleToggleGroup}
            isNeedContextMenu={false} // Default lists do not have context menu
            editingItemId={editingItemId}
          onContextMenu={handleContextMenu}
          inputRef={inputRef}
          handleKeyDown={handleKeyDown}
          handleBlur={handleBlur}
          handleTitleChange={handleTitleChange}
          editingTitle={editingTitle}
          listsList={lists} // Pass listsList and projects for GroupItem children lookup
          onTaskDrop={handleTaskDrop}
          onDragStart={handleListDragStart}
          onListDrop={handleListDrop}
        />
          <Divider />
          <ListsSection
            items={projects_list}
            sectionType="projects"
            selectedListId={selectedListId}
            selectedTaskId={selectedTaskId}
            openGroups={openGroups}
            onSelect={handleListItemClick}
            onToggleGroup={handleToggleGroup}
            isNeedContextMenu={isNeedContextMenu}
            editingItemId={editingItemId}
            onContextMenu={handleContextMenu}
          inputRef={inputRef}
          handleKeyDown={handleKeyDown}
          handleBlur={handleBlur}
          handleTitleChange={handleTitleChange}
          editingTitle={editingTitle}
          listsList={lists} // Pass listsList and projects for GroupItem children lookup
          onTaskDrop={handleTaskDrop}
          onDragStart={handleListDragStart}
          onListDrop={handleListDrop}
        />
          <Divider />
          <ListsSection
            items={lists}
            sectionType="lists"
            selectedListId={selectedListId}
            selectedTaskId={selectedTaskId}
            openGroups={openGroups}
            onSelect={handleListItemClick}
            onToggleGroup={handleToggleGroup}
            isNeedContextMenu={isNeedContextMenu}
            editingItemId={editingItemId}
            onContextMenu={handleContextMenu}
            inputRef={inputRef}
            handleKeyDown={handleKeyDown}
            handleBlur={handleBlur}
            handleTitleChange={handleTitleChange}
            editingTitle={editingTitle}
            listsList={lists} // Pass listsList and projects for GroupItem children lookup
            onTaskDrop={handleTaskDropEvent}
            onDragStart={handleListDragStart}
            onListDrop={handleListDropEvent}
        />
        </Box>
      <ContextMenu
        anchorEl={anchorEl}
        item={lists?.find(item => item.id === targetItemId) || projects_list?.find(item => item.id === targetItemId)}
        groupId={targetGroupId}
        onClose={handleCloseMenu}
        onEditClick={handleEditClick}
        onOpenGroupMenu={handleOpenGroupMenu}
        onOpenProjectMenu={handleOpenProjectMenu}
        // onDeleteFromChildes={handleDeleteFromChildes}
        onChangeChildesOrder={handleChangeChildesOrder}
        onAddToGeneralList={handleAddToGeneralList}
        listsList={lists} // Pass listsList and projects for ContextMenu to filter available groups/projects
      />

      {/* Submenu for groups */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={groupMenuPosition}
        open={Boolean(groupMenuPosition)}
        onClose={handleCloseGroupMenu}
      >
        {lists && lists
          .filter(item => item.type === 'group' && !item.deleted) // Filter for active groups
          .map(group => (
            <MenuItem key={group.id} onClick={() => handleAction(group.id)}>
              {group.title}
            </MenuItem>
          ))}
      </Menu>

      {/* Submenu for projects */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={projectMenuPosition}
        open={Boolean(projectMenuPosition)}
        onClose={handleCloseProjectMenu}
      >
        {projects_list?.map(project => (
          <MenuItem key={project.id} onClick={() => handleAction(project.id)}>
            {project.title}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={dropMenuAnchorEl}
        open={Boolean(dropMenuAnchorEl)}
        onClose={handleCloseDropMenu}
      >
        <MenuItem onClick={() => handleDropAction('link')}>Связать</MenuItem>
        <MenuItem onClick={() => handleDropAction('move')}>Переместить</MenuItem>
      </Menu>

      <Menu
        anchorEl={listDropMenuAnchorEl}
        open={Boolean(listDropMenuAnchorEl)}
        onClose={handleCloseListDropMenu}
      >
        <MenuItem onClick={() => handleListDropAction('link')}>Связать</MenuItem>
        <MenuItem onClick={() => handleListDropAction('move')}>Переместить</MenuItem>
      </Menu>
    </Box>
  );
}


ListsList.propTypes = {
  selectedListId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedListId: PropTypes.func,
  setSelectedTaskId: PropTypes.func,
  isNeedContextMenu: PropTypes.bool,
  updateAll: PropTypes.func,
  listsList: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.shape({
      lists: PropTypes.array,
      default_lists: PropTypes.array,
      projects: PropTypes.array
    })
  ]),
  projects: PropTypes.array,
  defaultLists: PropTypes.array,
  updateList: PropTypes.func,
  updateEvents: PropTypes.func,
  linkListGroup: PropTypes.func,
  deleteFromChildes: PropTypes.func,
  linkTaskList: PropTypes.func,
  changeChildesOrder: PropTypes.func,
  calendarRange: PropTypes.object, // Добавляем пропс для диапазона календаря
};

export default memo(ListsList);
