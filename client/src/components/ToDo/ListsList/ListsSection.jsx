import { List, Divider } from '@mui/material';
import PropTypes from 'prop-types';
import ListItem from './ListItem';
import GroupItem from './GroupItem';

export default function ListsSection({
  items,
  sectionType,
  selectedListId,
  selectedTaskId,
  openGroups,
  onSelect,
  onToggleGroup,
  // Props for ListItem and GroupItem
  isNeedContextMenu,
  editingItemId,
  onContextMenu,
  inputRef,
  handleKeyDown,
  handleBlur,
  handleTitleChange,
  editingTitle,
  listsList, // Needed for GroupItem to find children
  projects, // Needed for GroupItem to find children
  onTaskDrop
}) {

  const renderItem = (item, parentId = null) => {
    const commonProps = {
      item,
      isEditing: editingItemId === item.id,
      onContextMenu: isNeedContextMenu ? (event) => onContextMenu(event, item, parentId) : undefined,
      inputRef,
      handleKeyDown,
      handleBlur,
      handleTitleChange,
      editingTitle,
    };

    if (item.type === 'group' || item.type === 'project') {
      return (
        <GroupItem
          key={item.id}
          isOpen={openGroups[item.id]}
          onToggle={() => onToggleGroup(item.id)}
          childrenLists={listsList.concat(projects)} // Provide all possible children
          showProgress={sectionType === 'projects'}
          renderListItem={(childItem) => renderItem(childItem, item.id)} // Pass renderItem recursively
          renderGroupItem={(childItem) => renderItem(childItem, item.id)} // Pass renderItem recursively
          isDraggable={sectionType !== 'default'}
          {
            ...commonProps
          }
        />
      );
    } else {
      return (
        <ListItem
          key={item.id}
          isSelected={selectedListId === item.id}
          selectedTaskId={selectedTaskId}
          onSelect={(event) => onSelect(event, item.id)}
          showProgress={false} // Lists don't show progress in the original renderListItem
          isDraggable={sectionType !== 'default'}
          onTaskDrop={onTaskDrop}
          {
            ...commonProps
          }
        />
      );
    }
  };

  return (
    <List sx={{ width: '100%', pt: 0 }} component="nav">
      {items?.map(item => {
        // Only render items that are inGeneralList and not deleted for the 'lists' section
        if (sectionType === 'lists') {
          if (item.inGeneralList && !item.deleted) {
            return renderItem(item);
          }
          return null;
        } else {
          return renderItem(item);
        }
      })}
    </List>
  );
}

ListsSection.propTypes = {
  items: PropTypes.array,
  sectionType: PropTypes.oneOf(['default', 'projects', 'lists']).isRequired,
  selectedListId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedTaskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  openGroups: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  onToggleGroup: PropTypes.func.isRequired,
  isNeedContextMenu: PropTypes.bool,
  editingItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onContextMenu: PropTypes.func.isRequired,
  inputRef: PropTypes.object,
  handleKeyDown: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  handleTitleChange: PropTypes.func.isRequired,
  editingTitle: PropTypes.string,
  listsList: PropTypes.array.isRequired,
  projects: PropTypes.array.isRequired,
  onTaskDrop: PropTypes.func,
};
