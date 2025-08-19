import { useState } from 'react';
import { Menu, MenuItem, Divider } from '@mui/material';
import PropTypes from 'prop-types';

export default function ContextMenu({
   anchorEl,
   item,
   parent,
   groupId,
   onClose,
   onEditClick,
   onDeleteFromChildes,
   onChangeChildesOrder,
   onAddToGeneralList,
   onLinkToList,
   onMoveToList,
   listsList,
   projects
  }) {
   const isList = item?.type === 'list';
   const isGroup = item?.type === 'group';
   const isProject = item?.type === 'project';
   const [subMenuAnchorEl, setSubMenuAnchorEl] = useState(null);
   const [subMenuType, setSubMenuType] = useState(null);
   const [subMenuAction, setSubMenuAction] = useState(null);

   const handleAction = (action, ...args) => {
     onClose();
     action(...args);
   };

   const handleOpenSubMenu = (event, type, action) => {
     event.stopPropagation();
     setSubMenuAnchorEl(event.currentTarget);
     setSubMenuType(type);
     setSubMenuAction(action);
   };

   const handleCloseSubMenu = () => {
     setSubMenuAnchorEl(null);
     setSubMenuType(null);
     setSubMenuAction(null);
   };

   const handleSubMenuAction = (targetId) => {
     const sourceType = item.type;
     const sourceId = item.id;
     const targetType = subMenuType;
     
     // include parent info for server when available
     // Use parent info if available, otherwise fall back to groupId
     const source_parent_id = parent?.id || null;
     const source_parent_type = parent?.type || null;

     if (subMenuAction === 'move') {
       onMoveToList(sourceType, sourceId, targetType, targetId, { source_parent_id, source_parent_type });
     } else if (subMenuAction === 'link') {
       onLinkToList(sourceType, sourceId, targetType, targetId, { source_parent_id, source_parent_type });
     }
     handleCloseSubMenu();
     onClose();
   };

   const commonItems = () => [
     <MenuItem key="rename" onClick={() => handleAction(onEditClick, item.id)} aria-label="Переименовать">
        Переименовать
      </MenuItem>,
      <Divider key="divider" />,
     <MenuItem key="moveUp" onClick={() => handleAction(onChangeChildesOrder, item.id, 'up', groupId)} aria-label="Переместить выше">
        Переместить выше
      </MenuItem>,
     <MenuItem key="moveDown" onClick={() => handleAction(onChangeChildesOrder, item.id, 'down', groupId)} aria-label="Переместить ниже">
        Переместить ниже
      </MenuItem>
   ];

   let menuItems = [];
   if (item && isList) {
     menuItems = [
       ...commonItems(),
       <MenuItem key="moveToGroup" onClick={(e) => handleOpenSubMenu(e, 'group', 'move')} aria-label="Переместить в группу">
         Переместить в группу
       </MenuItem>,
       <MenuItem key="linkToGroup" onClick={(e) => handleOpenSubMenu(e, 'group', 'link')} aria-label="Связать с группой">
         Связать с группой
       </MenuItem>,
       <MenuItem key="moveToProject" onClick={(e) => handleOpenSubMenu(e, 'project', 'move')} aria-label="Переместить в проект">
         Переместить в проект
       </MenuItem>,
       <MenuItem key="linkToProject" onClick={(e) => handleOpenSubMenu(e, 'project', 'link')} aria-label="Связать с проектом">
         Связать с проектом
       </MenuItem>,
       <Divider key="divider2" />,
       <MenuItem key="deleteFromGroup" onClick={() => handleAction(onDeleteFromChildes, item.id, groupId)} aria-label="Удалить из этой группы">
          Удалить из этой группы
        </MenuItem>
      ];
    } else if (item && isGroup) {
     menuItems = [
       ...commonItems(),
       <MenuItem key="moveToProject" onClick={(e) => handleOpenSubMenu(e, 'project', 'move')} aria-label="Переместить в проект">
         Переместить в проект
       </MenuItem>,
       <MenuItem key="linkToProject" onClick={(e) => handleOpenSubMenu(e, 'project', 'link')} aria-label="Связать с проектом">
         Связать с проектом
       </MenuItem>,
       <Divider key="divider3" />,
       <MenuItem key="deleteFromGroup" onClick={() => handleAction(onDeleteFromChildes, item.id, groupId)} aria-label="Удалить из этой группы">
          Удалить из этой группы
        </MenuItem>
      ];
    } else if (item && isProject) {
     menuItems = [
       <MenuItem key="rename" onClick={() => handleAction(onEditClick, item.id)} aria-label="Переименовать">
          Переименовать
        </MenuItem>,
        <Divider key="divider" />,
       <MenuItem key="moveUp" onClick={() => handleAction(onChangeChildesOrder, item.id, 'up')} aria-label="Переместить выше">
          Переместить выше
        </MenuItem>,
       <MenuItem key="moveDown" onClick={() => handleAction(onChangeChildesOrder, item.id, 'down')} aria-label="Переместить ниже">
          Переместить ниже
        </MenuItem>
      ];
    } else if (item && !item.in_general_list) {
     menuItems = [
       <MenuItem key="addToGeneral" onClick={() => handleAction(onAddToGeneralList, item.id)} aria-label="Добавить в основной список">
          Добавить в основной список
        </MenuItem>
      ];
    }

   return (
      <>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={onClose}
          aria-label="Контекстное меню"
        >
          {menuItems}
        </Menu>

        <Menu
          anchorEl={subMenuAnchorEl}
          open={Boolean(subMenuAnchorEl)}
          onClose={handleCloseSubMenu}
          aria-label="Подменю"
        >
          {(subMenuType === "group" ? listsList : projects)?.map((list) => {
            if (!list || list.type !== "group") return null;

            return (
              <MenuItem key={list.id} onClick={() => handleSubMenuAction(list.id)}>
                {list.title}
              </MenuItem>
            );
          })}
        </Menu>
      </>
    );
  }

// PropTypes без изменений

ContextMenu.propTypes = {
   anchorEl: PropTypes.object,
   item: PropTypes.object,
   parent: PropTypes.shape({
     id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
     type: PropTypes.string,
     childes_order: PropTypes.arrayOf(PropTypes.string)
   }),
   groupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
   onClose: PropTypes.func.isRequired,
   onEditClick: PropTypes.func.isRequired,
   onDeleteFromChildes: PropTypes.func.isRequired,
   onChangeChildesOrder: PropTypes.func.isRequired,
   onAddToGeneralList: PropTypes.func.isRequired,
   onLinkToList: PropTypes.func.isRequired,
   onMoveToList: PropTypes.func.isRequired,
   listsList: PropTypes.array.isRequired,
   projects: PropTypes.array.isRequired
 };
