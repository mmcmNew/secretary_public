import { useEffect, useRef, useState } from 'react';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  TextField,
  LinearProgress,
  Box,
  IconButton
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  ExpandLess,
  ExpandMore,
  FormatListBulleted,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import FilterNoneIcon from '@mui/icons-material/FilterNone';
import CheckIcon from '@mui/icons-material/Check';
import PropTypes from 'prop-types';

export default function GroupItem({
  item,
  isOpen,
  onToggle,
  isEditing,
  onEdit,
  onCancelEdit,
  childrenLists,
  isDraggable = true,
  showProgress = false,
  onContextMenu,
  inputRef,
  handleKeyDown,
  handleBlur,
  handleTitleChange,
  editingTitle,
  renderListItem,
  renderGroupItem,
  onDragStart,
  onListDrop
}) {

  let progress = 0;
  if (showProgress) {
    progress = (item.tasks_count - item.unfinished_tasks_count) / item.tasks_count * 100;
  }

  const groupItemContent = (
    <div key={item.id}>
      <ListItemButton
        onClick={onToggle}
        onContextMenu={onContextMenu}
      >
        <ListItemIcon sx={{ minWidth: 35 }}>
          {item.type === 'project' ? <AccountTreeIcon /> : <FilterNoneIcon />}
        </ListItemIcon>

        {isEditing ? (
          <TextField
            size="small"
            sx={{ p: 0, m: 0, width: '100%' }}
            value={editingTitle}
            onClick={(event) => event.stopPropagation()}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            inputRef={inputRef}
          />
        ) : (
          <ListItemText primary={item.title} />
        )}
        {progress === 100 ? <CheckIcon fontSize="small" style={{ color: 'green' }} /> : null}
        {isOpen ? <ExpandLess /> : <ExpandMore />}
        {onContextMenu && (
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )}
      </ListItemButton>
      {showProgress && progress !== 100 && item.tasks_count !== 0 &&(
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ m: 0 }}
        />
      )}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <List component="nav" sx={{ ml: 1.5 }}>
          {item.childes_order.map((childId) => {
            const child = childrenLists?.find((child) => child?.id === childId);
            if (child) {
              return child.type === 'group'
                ? renderGroupItem(child)
                : renderListItem(child);
            }
            return null;
          })}
        </List>
      </Collapse>
    </div>
  );

  return groupItemContent;
}

GroupItem.propTypes = {
  item: PropTypes.object.isRequired,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  isEditing: PropTypes.bool,
  onEdit: PropTypes.func,
  onCancelEdit: PropTypes.func,
  childrenLists: PropTypes.array,
  isDraggable: PropTypes.bool,
  showProgress: PropTypes.bool,
  onContextMenu: PropTypes.func,
  inputRef: PropTypes.object,
  handleKeyDown: PropTypes.func,
  handleBlur: PropTypes.func,
  handleTitleChange: PropTypes.func,
  editingTitle: PropTypes.string,
  renderListItem: PropTypes.func.isRequired,
  renderGroupItem: PropTypes.func.isRequired,
  onDragStart: PropTypes.func,
  onListDrop: PropTypes.func
};
