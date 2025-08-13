import { useState, memo, useCallback, useRef } from 'react';
import {
  Box,
  Divider,
  Menu,
  MenuItem
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
  const [listMenuAnchorEl, setListMenuAnchorEl] = useState(null);
  const [menuActionType, setMenuActionType] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef(null);

  const handleContextMenu = useCallback((event, item) => {
    openMenu(event);
    setTargetItem(item);
  }, [openMenu]);

  const handleOpenSubMenu = (event, actionType) => {
    setListMenuAnchorEl(event.currentTarget);
    setMenuActionType(actionType);
  };

  const handleCloseSubMenu = () => {
    setListMenuAnchorEl(null);
    setMenuActionType(null);
  };

  const handleSubMenuAction = (targetListId) => {
    if (menuActionType === 'move') {
      onMoveToList(targetItem.id, targetListId);
    } else if (menuActionType === 'link') {
      onLinkToList(targetItem.id, targetListId);
    }
    handleCloseSubMenu();
    handleCloseMenu();
  };

  const handleCloseMenu = useCallback(() => {
    closeMenu();
    setTargetItem(null);
    setEditingItemId(null);
    setEditingTitle('');
  }, [closeMenu]);

  const handleEditStart = useCallback(() => {
    if (targetItem) {
      setEditingItemId(targetItem.id);
      setEditingTitle(targetItem.title);
      closeMenu();
    }
  }, [targetItem, closeMenu, onSelectList]);

  const handleEditSave = useCallback(() => {
    console.log('handleEditSave called', { editingItemId, targetItem, editingTitle });
    if (editingItemId && targetItem) {
      console.log('Updating list', { targetItem, editingTitle });
      onUpdateList(targetItem.realId || targetItem.id, { title: editingTitle });
    } else {
      console.log('Not updating list - missing editingItemId or targetItem', { editingItemId, targetItem });
    }
    console.log('Resetting edit state');
    setEditingItemId(null);
    setEditingTitle('');
  }, [editingItemId, editingTitle, onUpdateList, targetItem]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleEditSave();
    } else if (event.key === 'Escape') {
      setEditingItemId(null);
      setEditingTitle('');
    }
  }, [handleEditSave]);

  const handleBlur = useCallback(() => {
    console.log('handleBlur called');
    handleEditSave();
  }, [handleEditSave]);

  const editState = {
    editingItemId,
    editingTitle,
    onTitleChange: (e) => setEditingTitle(e.target.value),
    onSave: handleEditSave,
    onCancel: handleBlur, // Using handleBlur to save on exit
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
        onClose={handleCloseMenu}
        onEditClick={handleEditStart}
        onDeleteClick={() => {
          if (targetItem) onDeleteList(targetItem);
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
        onOpenGroupMenu={(e) => handleOpenSubMenu(e, 'group')}
        onOpenProjectMenu={(e) => handleOpenSubMenu(e, 'project')}
        onDeleteFromChildes={onDeleteFromChildes}
        onChangeChildesOrder={onChangeChildesOrder}
        onAddToGeneralList={onAddToGeneralList}
        listsList={lists}
        projects={projects}
      />
      <Menu
        anchorEl={listMenuAnchorEl}
        open={Boolean(listMenuAnchorEl)}
        onClose={handleCloseSubMenu}
      >
        {(menuActionType === 'group' ? lists : projects).map((list) => (
          <MenuItem key={list.id} onClick={() => handleSubMenuAction(list.id)}>
            {list.title}
          </MenuItem>
        ))}
      </Menu>
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
