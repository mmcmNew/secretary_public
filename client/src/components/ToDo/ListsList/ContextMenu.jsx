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
  const isProject = projects?.find(project => project.id === item?.id);

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      {item && isList && (
        [
          <MenuItem key="rename" onClick={() => {
            onEditClick(item.id);
            onClose();
          }}>Переименовать</MenuItem>,
          <MenuItem
            key="moveToGroup"
            onClick={(event) => {
              onOpenGroupMenu(event, 'move');
              onClose();
            }}
          >
            Переместить в группу
          </MenuItem>,
          <MenuItem
            key="linkToGroup"
            onClick={(event) => {
              onOpenGroupMenu(event, 'link');
              onClose();
            }}
          >
            Связать с группой
          </MenuItem>,
          <MenuItem
            key="moveToProject"
            onClick={(event) => {
              onOpenProjectMenu(event, 'move');
              onClose();
            }}
          >
            Переместить в проект
          </MenuItem>,
          <MenuItem
            key="linkToProject"
            onClick={(event) => {
              onOpenProjectMenu(event, 'link');
              onClose();
            }}
          >
            Связать с проектом
          </MenuItem>,
          <Divider key="divider1" />,
          <MenuItem key="moveUp"
            onClick={() => {
              onChangeChildesOrder(item.id, 'up', groupId);
              onClose();
            }}>
            Переместить выше</MenuItem>,
          <MenuItem key="moveDown"
            onClick={() => {
              onChangeChildesOrder(item.id, 'down', groupId);
              onClose();
            }}>
            Переместить ниже</MenuItem>,
          <MenuItem key="toggleInList"
            onClick={() => {
              onDeleteFromChildes(item.id, groupId);
              onClose();
            }}>
            Удалить из этой группы
          </MenuItem>
        ]
      )}

      {item && isGroup && (
        [
          <MenuItem key="rename" onClick={() => {
            onEditClick(item.id);
            onClose();
          }}>Переименовать</MenuItem>,
          <MenuItem key="moveToProject"
            onClick={(event) => {
              onOpenProjectMenu(event, 'move');
              onClose();
            }}>
            Переместить в проект
          </MenuItem>,
          <MenuItem key="linkToProject"
            onClick={(event) => {
              onOpenProjectMenu(event, 'link');
              onClose();
            }}>
            Связать с проектом
          </MenuItem>,
          <Divider key="divider2" />,
          <MenuItem key="moveUp"
            onClick={() => {
              onChangeChildesOrder(item.id, 'up', groupId);
              onClose();
            }}>
            Переместить выше</MenuItem>,
          <MenuItem key="moveDown"
            onClick={() => {
              onChangeChildesOrder(item.id, 'down', groupId);
              onClose();
            }}>
            Переместить ниже</MenuItem>,
          <MenuItem key="toggleInList" onClick={() => {
            onDeleteFromChildes(item.id, groupId);
            onClose();
          }}>
            Удалить из этой группы
          </MenuItem>
        ]
      )}

      {item && !item.inGeneralList && !isProject && (
        [
          <MenuItem key="ingenetallist" onClick={() => {
            onAddToGeneralList(item.id);
            onClose();
          }}>Добавить в основной список</MenuItem>,
        ]
      )}

      {item && isProject && (
        [
          <MenuItem key="rename" onClick={() => {
            onEditClick(item.id);
            onClose();
          }}>Переименовать</MenuItem>,
          <MenuItem key="moveUp"
            onClick={() => {
              onChangeChildesOrder(item.id, 'up'); // Projects don't have a groupId for ordering within their own list
              onClose();
            }}>
            Переместить выше</MenuItem>,
          <MenuItem key="moveDown"
            onClick={() => {
              onChangeChildesOrder(item.id, 'down'); // Projects don't have a groupId for ordering within their own list
              onClose();
            }}>
            Переместить ниже</MenuItem>
        ]
      )}

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
