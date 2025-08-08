import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';

const DropActionMenu = ({ open, anchorPosition, onClose, onAction, sourceType, targetType }) => {
  const getActionText = (action) => {
    if (action === 'link') {
      if (sourceType === 'list' && targetType === 'group') return 'Связать со группой';
      if (sourceType === 'list' && targetType === 'project') return 'Связать с проектом';
      if (sourceType === 'group' && targetType === 'project') return 'Связать с проектом';
    }
    if (action === 'move') {
      if (sourceType === 'list' && targetType === 'group') return 'Переместить в группу';
      if (sourceType === 'list' && targetType === 'project') return 'Переместить в проект';
      if (sourceType === 'group' && targetType === 'project') return 'Переместить в проект';
    }
    return action;
  };

  const handleAction = (action) => {
    onAction(action);
    onClose();
  };

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      slotProps={{
        paper: {
          sx: {
            minWidth: 200,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)'
          }
        }
      }}
    >
      <MenuItem onClick={() => handleAction('link')}>
        <ListItemIcon>
          <LinkIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={getActionText('link')} />
      </MenuItem>
      <MenuItem onClick={() => handleAction('move')}>
        <ListItemIcon>
          <DriveFileMoveIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={getActionText('move')} />
      </MenuItem>
    </Menu>
  );
};

export default DropActionMenu;