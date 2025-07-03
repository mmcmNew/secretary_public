import { Menu, MenuItem, Divider } from '@mui/material';
import PropTypes from 'prop-types';

export default function ContextMenu({
  anchorEl,
  item,
  groupId,
  onClose,
  onEditClick,
  onOpenGroupMenu,
  onOpenProjectMenu,
  onDeleteFromChildes,
  onChangeChildesOrder,
  onAddToGeneralList,
  listsList,
  projects
}) {

  const isList = item?.type === 'list';
  const isGroup = item?.type === 'group';
  const isProject = item?.type === 'project';

  const handleAction = (action) => {
    action();
    onClose();
  };

  const renderCommonItems = () => [
    <MenuItem key="rename" onClick={() => handleAction(() => onEditClick(item.id))}>
      Переименовать
    </MenuItem>,
    <Divider key="divider" />,
    <MenuItem key="moveUp" onClick={() => handleAction(() => onChangeChildesOrder(item.id, 'up', groupId))}>
      Переместить выше
    </MenuItem>,
    <MenuItem key="moveDown" onClick={() => handleAction(() => onChangeChildesOrder(item.id, 'down', groupId))}>
      Переместить ниже
    </MenuItem>
  ];

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      {item && isList && [
        ...renderCommonItems(),
        <MenuItem key="moveToGroup" onClick={(e) => handleAction(() => onOpenGroupMenu(e, 'move'))}>
          Переместить в группу
        </MenuItem>,
        <MenuItem key="linkToGroup" onClick={(e) => handleAction(() => onOpenGroupMenu(e, 'link'))}>
          Связать с группой
        </MenuItem>,
        <MenuItem key="moveToProject" onClick={(e) => handleAction(() => onOpenProjectMenu(e, 'move'))}>
          Переместить в проект
        </MenuItem>,
        <MenuItem key="linkToProject" onClick={(e) => handleAction(() => onOpenProjectMenu(e, 'link'))}>
          Связать с проектом
        </MenuItem>,
        <Divider key="divider2" />,
        <MenuItem key="deleteFromGroup" onClick={() => handleAction(() => onDeleteFromChildes(item.id, groupId))}>
          Удалить из этой группы
        </MenuItem>
      ]}

      {item && isGroup && [
        ...renderCommonItems(),
        <MenuItem key="moveToProject" onClick={(e) => handleAction(() => onOpenProjectMenu(e, 'move'))}>
          Переместить в проект
        </MenuItem>,
        <MenuItem key="linkToProject" onClick={(e) => handleAction(() => onOpenProjectMenu(e, 'link'))}>
          Связать с проектом
        </MenuItem>,
        <Divider key="divider3" />,
        <MenuItem key="deleteFromGroup" onClick={() => handleAction(() => onDeleteFromChildes(item.id, groupId))}>
          Удалить из этой группы
        </MenuItem>
      ]}

      {item && !item.inGeneralList && !isList && !isGroup && !isProject && [
        <MenuItem key="addToGeneral" onClick={() => handleAction(() => onAddToGeneralList(item.id))}>
          Добавить в основной список
        </MenuItem>
      ]}

      {item && isProject && [
        <MenuItem key="rename" onClick={() => handleAction(() => onEditClick(item.id))}>
          Переименовать
        </MenuItem>,
        <Divider key="divider" />,
        <MenuItem key="moveUp" onClick={() => handleAction(() => onChangeChildesOrder(item.id, 'up'))}>
          Переместить выше
        </MenuItem>,
        <MenuItem key="moveDown" onClick={() => handleAction(() => onChangeChildesOrder(item.id, 'down'))}>
          Переместить ниже
        </MenuItem>
      ]}

    </Menu>
  );
}

ContextMenu.propTypes = {
  anchorEl: PropTypes.object,
  item: PropTypes.object,
  groupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func.isRequired,
  onEditClick: PropTypes.func.isRequired,
  onOpenGroupMenu: PropTypes.func.isRequired,
  onOpenProjectMenu: PropTypes.func.isRequired,
  onDeleteFromChildes: PropTypes.func.isRequired,
  onChangeChildesOrder: PropTypes.func.isRequired,
  onAddToGeneralList: PropTypes.func.isRequired,
  listsList: PropTypes.array.isRequired,
  projects: PropTypes.array.isRequired
};
