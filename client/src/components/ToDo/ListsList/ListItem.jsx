import { useEffect, useRef, useState } from 'react';
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  TextField,
  LinearProgress,
} from '@mui/material';
import {
  FormatListBulleted
} from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import PropTypes from 'prop-types';


export default function ListItem({
  item,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onCancelEdit,
  isDraggable = true,
  showProgress = false,
  onContextMenu,
  inputRef,
  handleKeyDown,
  handleBlur,
  handleTitleChange,
  editingTitle,
  selectedTaskId,
  onTaskDrop,
  onDragStart
}) {



  let progress = 0;
  if (showProgress) {
    if (Array.isArray(item.childes_order) && item.childes_order.length > 0) {
      const unfinishedTasks = typeof item.unfinished_tasks_count === 'number' ? item.unfinished_tasks_count : 0;
      progress = ((item.childes_order.length - unfinishedTasks) / item.childes_order.length) * 100;
    }
  }

  const listItemContent = (
    <div key={`div_${item.id}`}>
      <ListItemButton
        selected={isSelected}
        onClick={onSelect}
        onContextMenu={onContextMenu}
      >
        <ListItemIcon sx={{ minWidth: 35 }}>
          <FormatListBulleted />
        </ListItemIcon>
        {isEditing ? (
          <TextField
            size="small"
            sx={{ p: 0, m: 0, width: '100%' }}
            value={editingTitle}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            inputRef={inputRef}
          />
        ) : (
          <ListItemText primary={item.title} sx={{ mr: 2 }} />
        )}
        {item.childes_order && item.childes_order.length !== 0 && (
          item.unfinished_tasks_count !== 0 ? (
            <Badge badgeContent={item.unfinished_tasks_count} color="primary" sx={{ mr: 1 }} />
          ) : (
            <CheckIcon fontSize="small" style={{ color: 'green' }} />
          )
        )}
      </ListItemButton>
      {showProgress && item.unfinished_tasks_count !== 0 && (
        <LinearProgress
          key={item.id}
          variant="determinate"
          value={progress}
          sx={{ m: 0 }}
        />
      )}
    </div>
  );

  return listItemContent;
}

ListItem.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  isEditing: PropTypes.bool,
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  onCancelEdit: PropTypes.func,
  isDraggable: PropTypes.bool,
  showProgress: PropTypes.bool,
  onContextMenu: PropTypes.func,
  inputRef: PropTypes.object,
  handleKeyDown: PropTypes.func,
  handleBlur: PropTypes.func,
  handleTitleChange: PropTypes.func,
  editingTitle: PropTypes.string,
  selectedTaskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onTaskDrop: PropTypes.func,
  onDragStart: PropTypes.func
};
