import {
  ListItemIcon,
  ListItemText,
  Badge,
  IconButton,
} from '@mui/material';
import {
  FormatListBulleted,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import PropTypes from 'prop-types';

import EditableTitle from '../EditableTitle';
import { StyledListItemButton } from './ListItem.styles';

export default function ListItem({
  item,
  isSelected,
  onSelect,
  onContextMenu,
  isEditing,
  editingTitle,
  onTitleChange,
  onKeyDown,
  onBlur,
  inputRef,
}) {
  const renderStatus = () => {
    if (item.childes_order && item.childes_order.length !== 0) {
      return item.unfinished_tasks_count !== 0 ? (
        <Badge
          badgeContent={item.unfinished_tasks_count}
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

  const handleClick = (e) => {
    if (!isEditing) {
      onSelect(e);
    }
  };

  return (
    <StyledListItemButton
      selected={isSelected}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      aria-selected={isSelected}
      aria-label={item.title}
    >
      <ListItemIcon sx={{ minWidth: 35 }}>
        <FormatListBulleted aria-hidden="true" />
      </ListItemIcon>

      {isEditing ? (
        <EditableTitle
          value={editingTitle}
          onChange={onTitleChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          inputRef={inputRef}
          sx={{ flex: 1, border: 'none' }} // Inline стиль для seamless editing
          aria-label="Редактировать название списка"
        />
      ) : (
        <ListItemText primary={item.title} sx={{ mr: 2 }} />
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
  );
}

ListItem.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onContextMenu: PropTypes.func,
  isEditing: PropTypes.bool,
  editingTitle: PropTypes.string,
  onTitleChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  onBlur: PropTypes.func,
  inputRef: PropTypes.object,
};
