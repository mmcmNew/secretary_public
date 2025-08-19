import { useState, memo, useCallback, useRef } from 'react';
import {
  Box,
  Divider,
} from '@mui/material';
import PropTypes from 'prop-types';
import ListsSection from './ListsList/ListsSection';
import ContextMenu from './ListsList/ContextMenu';
import useContextMenu from './hooks/useContextMenu';

function ListsList({
  lists = [],
  defaultLists = [],
  projects = [],
  isNeedContextMenu = false,
  selectedListId = null,
  onSelectList = () => {},
  onUpdateList = () => {},
  onDeleteList = () => {},
  openGroups = {},
  onToggleGroup = () => {},
  onDeleteFromChildes = () => {},
  onChangeChildesOrder = () => {},
  onAddToGeneralList = () => {},
  onLinkToList = () => {},
  onMoveToList = () => {},
}) {
  const { anchorEl, openMenu, closeMenu } = useContextMenu();
  const [targetItem, setTargetItem] = useState(null);
  const [targetParent, setTargetParent] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingItem, setEditingItem] = useState(null); // Новое состояние для сохранения редактируемого элемента
  const inputRef = useRef(null);

  const handleContextMenu = useCallback((event, item, parent = null) => {
    console.log('handleContextMenu called with item:', item, 'parent:', parent);
    openMenu(event);
    setTargetItem(item);
    setTargetParent(parent || null);
  }, [openMenu]);




  const handleCloseMenu = useCallback(() => {
    closeMenu();
    setTargetItem(null);
    // Не сбрасываем editingItem здесь — оно независимо от меню
  }, [closeMenu]);

  const handleEditStart = useCallback(() => {
    if (targetItem) {
      setEditingItemId(targetItem.id);
      setEditingTitle(targetItem.title);
      setEditingItem(targetItem); // Сохраняем копию targetItem для редактирования
      handleCloseMenu(); // Закрываем меню, но editingItem остаётся
    }
  }, [targetItem, handleCloseMenu]);

  const handleEditSave = useCallback(() => {
    if (editingItemId && editingItem && editingTitle.trim() !== '') {
      onUpdateList(editingItem.id, { 
        title: editingTitle,
        type: editingItem.type 
      });
    }
    // Сбрасываем состояния редактирования
    setEditingItemId(null);
    setEditingTitle('');
    setEditingItem(null);
  }, [editingItemId, editingTitle, onUpdateList, editingItem]);

  const handleBlur = useCallback(() => {
    handleEditSave(); // Сохраняем на blur
  }, [handleEditSave]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleEditSave();
    } else if (event.key === 'Escape') {
      setEditingItemId(null);
      setEditingTitle('');
      setEditingItem(null);
    }
  }, [handleEditSave]);

  const editState = {
    editingItemId,
    editingTitle,
    onTitleChange: (e) => setEditingTitle(e.target.value),
    onSave: handleEditSave,
    onCancel: handleBlur,
    inputRef,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflowY: 'auto'
      }}
    >
      <ListsSection
        title="Стандартные"
        items={defaultLists}
        sectionType="default"
        selectedListId={selectedListId}
        onSelect={onSelectList}
        isNeedContextMenu={false}
        editState={editState}
      />
      <Divider />
      <ListsSection
        title="Проекты"
        items={projects}
        sectionType="projects"
        selectedListId={selectedListId}
        openGroups={openGroups}
        onSelect={onSelectList}
        onToggleGroup={onToggleGroup}
        isNeedContextMenu={isNeedContextMenu}
        onContextMenu={handleContextMenu}
        editState={editState}
        listsList={projects}
      />
      <Divider />
      <ListsSection
        title="Списки и Группы"
        items={lists}
        sectionType="lists"
        selectedListId={selectedListId}
        openGroups={openGroups}
        onSelect={onSelectList}
        onToggleGroup={onToggleGroup}
        isNeedContextMenu={isNeedContextMenu}
        onContextMenu={handleContextMenu}
        editState={editState}
        listsList={lists}
      />
      <ContextMenu
        anchorEl={anchorEl}
        item={targetItem}
        parent={targetParent}
        onClose={handleCloseMenu}
        onEditClick={handleEditStart}
        onDeleteClick={() => {
          if (targetItem) onDeleteList(targetItem.id);
          handleCloseMenu();
        }}
        onMoveUp={() => {
          if (targetItem) onChangeChildesOrder(targetItem.id, 'up');
          handleCloseMenu();
        }}
        onMoveDown={() => {
          if (targetItem) onChangeChildesOrder(targetItem.id, 'down');
          handleCloseMenu();
        }}
        onDeleteFromChildes={onDeleteFromChildes}
        onChangeChildesOrder={onChangeChildesOrder}
        onAddToGeneralList={onAddToGeneralList}
        onLinkToList={onLinkToList}
        onMoveToList={onMoveToList}
        listsList={lists}
        projects={projects}
      />
    </Box>
  );
}

ListsList.propTypes = {
  lists: PropTypes.array.isRequired,
  defaultLists: PropTypes.array.isRequired,
  projects: PropTypes.array.isRequired,
  isNeedContextMenu: PropTypes.bool,
  selectedListId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectList: PropTypes.func,
  onUpdateList: PropTypes.func,
  onDeleteList: PropTypes.func,
  openGroups: PropTypes.object,
  onToggleGroup: PropTypes.func,
  onDeleteFromChildes: PropTypes.func,
  onChangeChildesOrder: PropTypes.func,
  onAddToGeneralList: PropTypes.func,
  onLinkToList: PropTypes.func,
  onMoveToList: PropTypes.func,
};

export default memo(ListsList);