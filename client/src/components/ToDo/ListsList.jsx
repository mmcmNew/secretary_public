import { useEffect, useRef, useState } from 'react';
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
import { DndContext } from '@dnd-kit/core';
import useTasks from './hooks/useTasks';
import useLists from './hooks/useLists';

export default function ListsList({
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
  updateList = null,
  deleteList = null,
  linkListGroup = null,
  deleteFromChildes = null,
  linkTaskList = null,
  changeChildesOrder = null,
  selectedList = null,
  setSelectedList = null,
}) {
  const [openGroups, setOpenGroups] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [targetItemId, setTargetItemId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [targetGroupId, setTargetGroupId] = useState(null); // Хранит id группы в которой находится список для которого вызвано контекстное меню
  const [groupMenuAnchorEl, setGroupMenuAnchorEl] = useState(null);
  const [projectMenuAnchorEl, setProjectMenuAnchorEl] = useState(null);
  const [actionType, setActionType] = useState(null); // Хранит текущее действие: "move" или "link"
  const inputRef = useRef(null);
  const { fetchTasks } = useTasks();
  const { fetchLists: fetchListsHook } = useLists();

  function handleToggleGroup(id) {
    setOpenGroups((prevOpenGroups) => ({
      ...prevOpenGroups,
      [id]: !prevOpenGroups[id],
    }));
  }

  async function handleUpdateAll() {
    if (typeof fetchLists === 'function') await fetchLists();
    else if (typeof fetchListsHook === 'function') await fetchListsHook();
    if (typeof fetchTasks === 'function' && selectedListId) await fetchTasks(selectedListId);
  }

  function handleListItemClick(event, index) {
    if (editingItemId) return;
    if (targetItemId !== index) {
      setTargetItemId(null);
      setEditingItemId(null);
    }
    if (typeof setSelectedListId === 'function')
      setSelectedListId(index);
    if (typeof setSelectedTaskId === 'function')
      setSelectedTaskId(null);
  }

  function handleContextMenu(event, item, groupId) {
    console.log(item, groupId)
    event.preventDefault();
    setEditingItemId(null);
    setAnchorEl(event.currentTarget);
    setTargetGroupId(groupId);
    setTargetItemId(item.id);
    setEditingTitle(item.title);
  }

  function handleCloseMenu() {
    setAnchorEl(null);
    setTargetGroupId(null);
  }

  function handleEditClick(itemId) {
    setEditingItemId(itemId);
    setAnchorEl(null);
  }

  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [editingItemId])

  function handleTitleChange(event) {
    setEditingTitle(event.target.value);
  }

  function handleDeleteFromChildes(elementId, groupId) {
    setAnchorEl(null);
    if (typeof deleteFromChildes === 'function') {
      deleteFromChildes(elementId, groupId);
    }
  }

  async function handleChangeChildesOrder(elementId, direction, groupId) {
    setAnchorEl(null);
    // Если targetGroupId не передан, работаем с listsList
    if (!groupId || String(elementId).startsWith('project_')) {
      console.log(elementId, direction);

      let generalList = String(elementId).startsWith('project_')
        ? listsList
        : defaultLists.filter(item => item.inGeneralList == 1 && !item.deleted);
      console.log(generalList);

      // Находим индекс элемента по его id
      const index = generalList.findIndex((list) => list.id === elementId);
      console.log(index);

      if (index === -1 || (direction === 'up' && index === 0) || (direction === 'down' && index === generalList.length - 1)) return;

      // Запоминаем старый order
      let oldOrder = generalList[index].order;
      console.log('oldOrder ', oldOrder);

      // Определяем индекс заменяемого элемента
      let replacedElementIndex = direction === 'up' ? index - 1 : index + 1;
      let replacedElement = generalList[replacedElementIndex];

      // Меняем order между элементами
      let newOrder = replacedElement.order;
      console.log('newOrder ', newOrder)

      // Обновляем элементы на сервере
      if (typeof updateList === 'function') {
        await updateList(elementId, {order: newOrder});
        await updateList(replacedElement.id, {order: oldOrder});
      }
      if (typeof updateAll === 'function') {
        await updateAll();
      }
      if (typeof updateEvents === 'function') {
        await updateEvents();
      }
      return;
    }

    // Если targetGroupId передан, работаем с группой
    console.log(`handleChangeChildesOrder: ${groupId}`, elementId, direction);

    let targetGroup = listsList.find((group) => group.id === groupId) || listsList.find((group) => group.id === groupId);

    if (!targetGroup) return; // Если targetGroup не найден

    const index = targetGroup.childes_order.indexOf(elementId);

    // Проверяем, что элемент найден в childes_order
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      // Меняем местами с предыдущим элементом
      [targetGroup.childes_order[index - 1], targetGroup.childes_order[index]] =
        [targetGroup.childes_order[index], targetGroup.childes_order[index - 1]];
    } else if (direction === 'down' && index < targetGroup.childes_order.length - 1) {
      // Меняем местами со следующим элементом
      [targetGroup.childes_order[index + 1], targetGroup.childes_order[index]] =
        [targetGroup.childes_order[index], targetGroup.childes_order[index + 1]];
    }

    // Сохраняем изменения в childes_order
    updateList(targetGroup.id, {childes_order: targetGroup.childes_order});
  }

  async function handleAction(targetId) {
    // Закрываем все меню после выполнения действия
    setGroupMenuAnchorEl(null);
    setProjectMenuAnchorEl(null);
    setAnchorEl(null);
    setActionType(null);
    handleCloseMenu();
    if (actionType === 'move') {
      if (typeof linkListGroup === 'function') {
        await linkListGroup(targetItemId, targetId);
      }
      if (typeof deleteFromChildes === 'function') {
        await deleteFromChildes(targetItemId, targetGroupId)
      }
      console.log(`Перемещаем элемент с id ${targetItemId} в ${targetId} и удаляем из ${targetGroupId}`);
    } else if (actionType === 'link') {
      if (typeof linkListGroup === 'function'){
        linkListGroup(targetItemId, targetId);
      }
      console.log(`Связываем элемент с id ${targetItemId} с ${targetId}`);
    }
  }

  function handleOpenGroupMenu(event, actionType) {
    setActionType(actionType);
    setGroupMenuAnchorEl(event.currentTarget);
  }

  function handleCloseGroupMenu() {
    setGroupMenuAnchorEl(null);
  }

  function handleOpenProjectMenu(event, actionType) {
    setActionType(actionType);
    setProjectMenuAnchorEl(event.currentTarget);
  }

  function handleCloseProjectMenu() {
    setProjectMenuAnchorEl(null);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      updateList(editingItemId, { title: editingTitle });
      setEditingItemId(null);
      inputRef.current = null;
    }
  }

  function handleBlur() {
    updateList(editingItemId, { title: editingTitle });
    setEditingItemId(null);
    // сбросить ref
    inputRef.current = null;
  }

  function handleAddToGeneralList(itemId) {
    updateList(itemId, { inGeneralList: 1 });
    setAnchorEl(null);
  }

  function handleDragEnd(event) {
    console.log('Drag ended', event);
    // TODO: Implement drag and drop logic here
  }


  return (
    <>
      <Button variant="outlined" onClick={handleUpdateAll} sx={{ mb: 1 }}>Обновить</Button>
      <DndContext onDragEnd={handleDragEnd}>
        <Box sx={{
          height: 'calc(100% - 50px)', // Вычитаем высоту кнопки
          overflowY: 'auto'
        }}>
          <ListsSection
            items={defaultLists}
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
            listsList={listsList} // Pass listsList and projects for GroupItem children lookup
          />
          <Divider />
          <ListsSection
            items={projects}
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
            listsList={listsList} // Pass listsList and projects for GroupItem children lookup
          />
          <Divider />
          <ListsSection
            items={listsList}
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
            listsList={listsList} // Pass listsList and projects for GroupItem children lookup
          />
        </Box>
      </DndContext>
      <ContextMenu
        anchorEl={anchorEl}
        item={listsList?.find(item => item.id === targetItemId) || projects?.find(item => item.id === targetItemId)}
        groupId={targetGroupId}
        onClose={handleCloseMenu}
        onEditClick={handleEditClick}
        onOpenGroupMenu={handleOpenGroupMenu}
        onOpenProjectMenu={handleOpenProjectMenu}
        onDeleteFromChildes={handleDeleteFromChildes}
        onChangeChildesOrder={handleChangeChildesOrder}
        onAddToGeneralList={handleAddToGeneralList}
        listsList={listsList} // Pass listsList and projects for ContextMenu to filter available groups/projects
      />

      {/* Submenu for groups */}
      <Menu
        anchorEl={groupMenuAnchorEl}
        open={Boolean(groupMenuAnchorEl)}
        onClose={handleCloseGroupMenu}
      >
        {listsList && listsList
          .filter(item => item.type === 'group' && !item.deleted) // Filter for active groups
          .map(group => (
            <MenuItem key={group.id} onClick={() => handleAction(group.id)}>
              {group.title}
            </MenuItem>
          ))}
      </Menu>

      {/* Submenu for projects */}
      <Menu
        anchorEl={projectMenuAnchorEl}
        open={Boolean(projectMenuAnchorEl)}
        onClose={handleCloseProjectMenu}
      >
        {projects?.map(project => (
          <MenuItem key={project.id} onClick={() => handleAction(project.id)}>
            {project.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}


ListsList.propTypes = {
  selectedListId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedListId: PropTypes.func,
  setSelectedTaskId: PropTypes.func,
  isNeedContextMenu: PropTypes.bool,
  updateAll: PropTypes.func,
  listsList: PropTypes.array,
  projects: PropTypes.array,
  defaultLists: PropTypes.array,
  updateList: PropTypes.func,
  updateEvents: PropTypes.func,
  linkListGroup: PropTypes.func,
  deleteFromChildes: PropTypes.func,
};
