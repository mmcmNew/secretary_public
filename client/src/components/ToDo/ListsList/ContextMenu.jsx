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
  // onLinkToList,
  // onMoveToList,
  // listsList,
  // projects
}) {
  const isList = item?.type === 'list';
  const isGroup = item?.type === 'group';
  const isProject = item?.type === 'project';

  const handleAction = (action) => {
    onClose();
    action();
  };

  const commonItems = () => [
    <MenuItem key="rename" onClick={() => handleAction(() => onEditClick(item.id))} aria-label="Переименовать">
      Переименовать
    </MenuItem>,
    <Divider key="divider" />,
    <MenuItem key="moveUp" onClick={() => handleAction(() => onChangeChildesOrder(item.id, 'up', groupId))} aria-label="Переместить выше">
      Переместить выше
    </MenuItem>,
    <MenuItem key="moveDown" onClick={() => handleAction(() => onChangeChildesOrder(item.id, 'down', groupId))} aria-label="Переместить ниже">
      Переместить ниже
    </MenuItem>
  ];

  let menuItems = [];
  if (item && isList) {
    menuItems = [
      ...commonItems(),
      <MenuItem key="moveToGroup" onClick={onOpenGroupMenu} aria-label="Переместить в группу">
        Переместить в группу
      </MenuItem>,
      <MenuItem key="linkToGroup" onClick={onOpenGroupMenu} aria-label="Связать с группой">
        Связать с группой
      </MenuItem>,
      <MenuItem key="moveToProject" onClick={onOpenProjectMenu} aria-label="Переместить в проект">
        Переместить в проект
      </MenuItem>,
      <MenuItem key="linkToProject" onClick={onOpenProjectMenu} aria-label="Связать с проектом">
        Связать с проектом
      </MenuItem>,
      <Divider key="divider2" />,
      <MenuItem key="deleteFromGroup" onClick={() => handleAction(() => onDeleteFromChildes(item.id, groupId))} aria-label="Удалить из этой группы">
        Удалить из этой группы
      </MenuItem>
    ];
  } else if (item && isGroup) {
    menuItems = [
      ...commonItems(),
      <MenuItem key="moveToProject" onClick={onOpenProjectMenu} aria-label="Переместить в проект">
        Переместить в проект
      </MenuItem>,
      <MenuItem key="linkToProject" onClick={onOpenProjectMenu} aria-label="Связать с проектом">
        Связать с проектом
      </MenuItem>,
      <Divider key="divider3" />,
      <MenuItem key="deleteFromGroup" onClick={() => handleAction(() => onDeleteFromChildes(item.id, groupId))} aria-label="Удалить из этой группы">
        Удалить из этой группы
      </MenuItem>
    ];
  } else if (item && isProject) {
    menuItems = [
      <MenuItem key="rename" onClick={() => handleAction(() => onEditClick(item.id))} aria-label="Переименовать">
        Переименовать
      </MenuItem>,
      <Divider key="divider" />,
      <MenuItem key="moveUp" onClick={() => handleAction(() => onChangeChildesOrder(item.id, 'up'))} aria-label="Переместить выше">
        Переместить выше
      </MenuItem>,
      <MenuItem key="moveDown" onClick={() => handleAction(() => onChangeChildesOrder(item.id, 'down'))} aria-label="Переместить ниже">
        Переместить ниже
      </MenuItem>
    ];
  } else if (item && !item.inGeneralList) {
    menuItems = [
      <MenuItem key="addToGeneral" onClick={() => handleAction(() => onAddToGeneralList(item.id))} aria-label="Добавить в основной список">
        Добавить в основной список
      </MenuItem>
    ];
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      aria-label="Контекстное меню"
      dense // Для компактности при длинных списках
    >
      {menuItems}
    </Menu>
  );
}

// PropTypes без изменений

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
  onLinkToList: PropTypes.func.isRequired,
  onMoveToList: PropTypes.func.isRequired,
  listsList: PropTypes.array.isRequired,
  projects: PropTypes.array.isRequired
};
