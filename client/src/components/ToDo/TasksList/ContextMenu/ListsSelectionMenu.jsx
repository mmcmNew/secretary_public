import { memo } from "react";
import PropTypes from "prop-types";
import { Menu } from "@mui/material";

/**
 * Component for lists selection menu
 */
const ListsSelectionMenu = memo(function ListsSelectionMenu({
    anchorEl,
    open,
    onClose,
    children,
}) {
    if (!open) return null;

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
        >
            {children}
        </Menu>
    );
});

ListsSelectionMenu.propTypes = {
    anchorEl: PropTypes.object,
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node,
};

export default ListsSelectionMenu;


