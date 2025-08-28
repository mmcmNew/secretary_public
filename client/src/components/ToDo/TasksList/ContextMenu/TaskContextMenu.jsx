import { memo } from "react";
import PropTypes from "prop-types";
import {
    Menu,
    MenuItem,
    Divider,
} from "@mui/material";

/**
 * Component for task context menu
 */
const TaskContextMenu = memo(function TaskContextMenu({
    anchorEl,
    open,
    onClose,
    onAddToMyDay,
    onOpenListsMenu,
    onUpToTask,
    onChangeChildesOrder,
    onDeleteFromChildes,
    listsList,
    selectedList,
    targetItemId,
}) {
    const hasLists = (listsList || []).filter((item) => item.type === "list").length > 0;
    // const isInListOrder = isTaskInListOrder({ id: targetItemId }, selectedList);

    if (!open) return null;

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
        >
            <MenuItem key="addToMyDay" onClick={onAddToMyDay}>
                Добавить в Мой день
            </MenuItem>
            
            {hasLists && [
                <MenuItem
                    key="moveToList"
                    onClick={(event) => onOpenListsMenu(event, "move")}
                >
                    Переместить в список
                </MenuItem>,
                <MenuItem
                    key="linkToList"
                    onClick={(event) => onOpenListsMenu(event, "link")}
                >
                    Связать со списком
                </MenuItem>,
            ]}
            
            {/* {!isInListOrder && [
                <MenuItem key="upToTask" onClick={onUpToTask}>
                    Поднять до задачи
                </MenuItem>,
            ]}
            
            {isInListOrder && [
                <Divider key="divider2" />,
                <MenuItem
                    key="moveUp"
                    onClick={() => onChangeChildesOrder(targetItemId, "up")}
                >
                    Переместить выше
                </MenuItem>,
                <MenuItem
                    key="moveDown"
                    onClick={() => onChangeChildesOrder(targetItemId, "down")}
                >
                    Переместить ниже
                </MenuItem>,
                <MenuItem
                    key="toggleInList"
                    onClick={() => onDeleteFromChildes(targetItemId)}
                >
                    Удалить из этого списка
                </MenuItem>,
            ]} */}
        </Menu>
    );
});

TaskContextMenu.propTypes = {
    anchorEl: PropTypes.object,
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onAddToMyDay: PropTypes.func.isRequired,
    onOpenListsMenu: PropTypes.func.isRequired,
    onUpToTask: PropTypes.func.isRequired,
    onChangeChildesOrder: PropTypes.func.isRequired,
    onDeleteFromChildes: PropTypes.func.isRequired,
    listsList: PropTypes.array,
    selectedList: PropTypes.object,
    targetItemId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default TaskContextMenu;


