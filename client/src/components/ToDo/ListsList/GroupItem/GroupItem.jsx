
import {
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
  Badge
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import PropTypes from 'prop-types';

import EditableTitle from '../EditableTitle';
import { StyledListItemButton, GroupLine, GroupChildrenWrapper } from './GroupItem.styles';

export default function GroupItem({
  group,
  isSelected,
  // onSelect,
  onContextMenu,
  isEditing,
  editingTitle,
  onTitleChange,
  onKeyDown,
  onBlur,
  inputRef,
  children,
  open = false,
  onToggle
}) {
  const handleToggle = (e) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  };

  const renderStatus = () => {
    if (group.childes_order && group.childes_order.length !== 0) {
      return group.unfinished_tasks_count !== 0 ? (
        <Badge
          badgeContent={group.unfinished_tasks_count}
          color="primary"
          sx={{ mr: 1 }}
          aria-label="Незавершённые задачи"
        />
      ) : (
        <CheckIcon fontSize="small" sx={{ color: 'green' }} aria-label="Все задачи завершены" />
      );
    }
    return null;
  };

  return (
    <div style={{ position: 'relative' }}>
      <StyledListItemButton
        selected={isSelected}
        onClick={handleToggle}
        onContextMenu={onContextMenu}
        aria-expanded={open}
        aria-label={group.title}
      >
        <ListItemIcon sx={{ minWidth: 35 }} onClick={handleToggle}>
          {open ? <ExpandLess aria-hidden="true" /> : <ExpandMore aria-hidden="true" />}
        </ListItemIcon>

        {isEditing ? (
          <EditableTitle
            value={editingTitle}
            onChange={onTitleChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            inputRef={inputRef}
            sx={{ flex: 1, border: 'none' }} // Seamless editing
            aria-label="Редактировать название группы"
          />
        ) : (
          <ListItemText primary={group.title} sx={{ mr: 2 }} />
        )}

        {renderStatus()}

        {onContextMenu && (
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
            aria-label="Открыть контекстное меню"
          >
            <MoreVertIcon />
          </IconButton>
        )}
      </StyledListItemButton>

      {group.childes_order?.length > 0 && (
        <GroupLine open={open} />
      )}

      <Collapse in={open} timeout="auto" unmountOnExit>
        <GroupChildrenWrapper>
          {children}
        </GroupChildrenWrapper>
      </Collapse>
    </div>
  );
}

GroupItem.propTypes = {
  group: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
  onContextMenu: PropTypes.func,
  isEditing: PropTypes.bool,
  editingTitle: PropTypes.string,
  onTitleChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  onBlur: PropTypes.func,
  inputRef: PropTypes.object,
  children: PropTypes.node,
  open: PropTypes.bool,
  onToggle: PropTypes.func
};
