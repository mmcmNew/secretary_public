import { List } from '@mui/material'; // Добавьте useMemo
import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { useMemo } from 'react';

import ListItem from './ListItem/ListItem';
import GroupItem from './GroupItem/GroupItem';

export default function ListsSection({
  items,
  selectedListId,
  onSelect,
  onToggleGroup,
  openGroups,
  isNeedContextMenu,
  onContextMenu,
  editState,
}) {
  const isItemSelected = useCallback(
    (item) => {
      if (selectedListId === item.id || selectedListId === item.realId) return true;

      return item.childes_order?.some(
        (childId) =>
          childId === selectedListId || childId === editState.editingItemId
      );
    },
    [selectedListId, editState.editingItemId]
  );

  const renderItem = useMemo(() => (item, parentId = null) => { // Memoize для perf
    if (item.type === 'group' || item.type === 'project') {
      const isOpen = openGroups[item.realId || item.id] ?? false;

      return (
        <GroupItem
          key={item.id}
          group={item}
          isSelected={isItemSelected(item)}
          onSelect={(e) => onToggleGroup && onToggleGroup(item.realId || item.id)}
          onContextMenu={
            isNeedContextMenu
              ? (e) => onContextMenu(e, item, parentId)
              : undefined
          }
          isEditing={editState.editingItemId === item.id}
          editingTitle={editState.editingTitle}
          onTitleChange={editState.onTitleChange}
          onKeyDown={editState.onKeyDown}
          onBlur={editState.onBlur}
          inputRef={editState.inputRef}
          open={isOpen}
          onToggle={() => onToggleGroup && onToggleGroup(item.realId || item.id)}
        >
          {item.childes_order?.map((childId) => {
            const childItem = items.find((i) => i.id === childId || i.realId === childId);
            return childItem ? renderItem(childItem, item.id) : null;
          })}
        </GroupItem>
      );
    }

    return (
      <ListItem
        key={item.id}
        item={item}
        isSelected={
          selectedListId === item.id || selectedListId === item.realId
        }
        onSelect={(e) => onSelect(e, item.realId || item.id)}
        onContextMenu={
          isNeedContextMenu
            ? (e) => onContextMenu(e, item, parentId)
            : undefined
        }
        isEditing={editState.editingItemId === item.id}
        editingTitle={editState.editingTitle}
        onTitleChange={editState.onTitleChange}
        onKeyDown={editState.onKeyDown}
        onBlur={editState.onBlur}
        inputRef={editState.inputRef}
      />
    );
  }, [
    items,
    selectedListId,
    isItemSelected,
    onSelect,
    onToggleGroup,
    openGroups,
    isNeedContextMenu,
    onContextMenu,
    editState,
  ]);

  return (
    <List sx={{ width: '100%', pt: 0, pb: 0 }} component="nav" aria-label="Секция списков">
      {items?.map((item) => renderItem(item))}
    </List>
  );
}

ListsSection.propTypes = {
  items: PropTypes.array.isRequired,
  selectedListId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func.isRequired,
  onToggleGroup: PropTypes.func,
  openGroups: PropTypes.object,
  isNeedContextMenu: PropTypes.bool,
  onContextMenu: PropTypes.func,
  editState: PropTypes.shape({
    editingItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    editingTitle: PropTypes.string,
    onTitleChange: PropTypes.func,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    inputRef: PropTypes.object,
    onKeyDown: PropTypes.func,
    onBlur: PropTypes.func,
  }).isRequired,
};
