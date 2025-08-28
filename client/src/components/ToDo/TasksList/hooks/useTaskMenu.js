import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import useContextMenu from '../../hooks/useContextMenu';
import { setContextTarget, clearContextTarget } from '../../../../store/todoLayoutSlice.js';
import { buildHierarchicalMenu, renderMenuItems } from '../utils/menuUtils';

/**
 * Hook for managing task context menus
 */
export const useTaskMenu = (listsList, projects, selectedList, taskActions) => {
    const dispatch = useDispatch();
    const { anchorEl, openMenu, closeMenu } = useContextMenu();

    // Local state for lists menu
    const [listsMenuAnchorEl, setListsMenuAnchorEl] = useState(null);
    const [actionType, setActionType] = useState(null);

    /**
     * Handle context menu open
     */
    const handleContextMenu = useCallback((event, item) => {
        openMenu(event);
        dispatch(setContextTarget({ id: item.id, menuType: 'task' }));
    }, [openMenu, dispatch]);

    /**
     * Handle context menu close
     */
    const handleCloseMenu = useCallback(() => {
        setListsMenuAnchorEl(null);
        closeMenu();
        setActionType(null);
        dispatch(clearContextTarget());
    }, [closeMenu, dispatch]);

    /**
     * Open lists selection menu
     */
    const handleOpenListsMenu = useCallback((event, actionTypeParam) => {
        setActionType(actionTypeParam);
        setListsMenuAnchorEl(event.currentTarget);
    }, []);

    /**
     * Close lists selection menu
     */
    const handleCloseListsMenu = useCallback(() => {
        setListsMenuAnchorEl(null);
    }, []);

    /**
     * Handle list selection from menu
     */
    const handleListSelection = useCallback((listId) => {
        taskActions.handleToListAction(listId, actionType);
        handleCloseMenu();
    }, [taskActions, actionType, handleCloseMenu]);

    /**
     * Build menu items for lists selection
     */
    const listsMenuItems = useCallback(() => {
        const menuItems = buildHierarchicalMenu(listsList, projects, handleListSelection);
        return renderMenuItems(menuItems);
    }, [listsList, projects, handleListSelection]);

    return {
        // Context menu state
        anchorEl,
        listsMenuAnchorEl,
        actionType,
        
        // Context menu handlers
        handleContextMenu,
        handleCloseMenu,
        handleOpenListsMenu,
        handleCloseListsMenu,
        
        // Menu items
        listsMenuItems,
    };
};


