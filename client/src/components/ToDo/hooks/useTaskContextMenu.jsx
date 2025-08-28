import { useState, useCallback, useSelector } from "react";
import { useDispatch } from "react-redux";
import { useChangeTaskStatusMutation, useLinkTaskMutation, useDeleteFromChildesMutation } from "../../store/tasksSlice";
import { useUpdateListMutation } from "../../store/listsSlice";
import { setContextTarget, clearContextTarget } from "../../store/todoLayoutSlice";

export function useTaskContextMenu({ onSuccess, onError, selectedList }) {
    const dispatch = useDispatch();
    const [anchorEl, setAnchorEl] = useState(null);
    const [listsMenuAnchorEl, setListsMenuAnchorEl] = useState(null);
    const [actionType, setActionType] = useState(null);
    
    // RTK Query Mutations
    const [changeTaskStatusMutation] = useChangeTaskStatusMutation();
    const [linkTaskMutation] = useLinkTaskMutation();
    const [deleteFromChildesMutation] = useDeleteFromChildesMutation();
    const [updateListMutation] = useUpdateListMutation();

    // Получаем targetItemId из store.contextTarget
    const targetItemId = useSelector((state) => state.todoLayout.contextTarget?.id);

    const handleContextMenu = useCallback((event, item) => {
        setAnchorEl(event.currentTarget);
        // store only id and menuType; anchorEl remains local in hook
        dispatch(setContextTarget({ id: item.id, menuType: 'task' }));
    }, [dispatch]);

    const handleCloseMenu = useCallback(() => {
        setListsMenuAnchorEl(null);
        setAnchorEl(null);
        setActionType(null);
        dispatch(clearContextTarget());
    }, [dispatch]);

    const handleOpenListsMenu = useCallback((event, actionTypeParam) => {
        setActionType(actionTypeParam);
        setListsMenuAnchorEl(event.currentTarget);
    }, []);

    const handleAddToMyDayClick = useCallback(async () => {
        try {
            await changeTaskStatusMutation({ taskId: targetItemId, isMyDay: true }).unwrap();
            if (onSuccess) onSuccess('Добавлено в "Мой день"');
        } catch (err) {
            if (onError) onError(err);
        }
        handleCloseMenu();
    }, [changeTaskStatusMutation, targetItemId, onSuccess, onError, handleCloseMenu]);

    const handleUpToTask = useCallback(() => {
        if (!selectedList?.id) return;
        handleToListAction(selectedList.id, "link");
    }, [selectedList, handleToListAction]);

    const handleToListAction = useCallback(async (targetId, actionTypeName = null) => {
        const finalActionType = actionTypeName || actionType;
        const params = {
            task_id: targetItemId,
            list_id: targetId,
            action: finalActionType,
        };
        if (finalActionType === "move" && selectedList?.id) {
            params.source_list_id = selectedList.id;
        }

        try {
            await linkTaskMutation(params).unwrap();
            if (onSuccess) onSuccess('Задача перемещена/связана');
        } catch (err) {
            if (onError) onError(err);
        }
        handleCloseMenu();
    }, [actionType, selectedList, targetItemId, linkTaskMutation, onSuccess, onError, handleCloseMenu]);

    const handleChangeChildesOrder = useCallback(async (elementId, direction) => {
        handleCloseMenu();
        if (!selectedList || !selectedList.childes_order) return;

        const newChildesOrder = [...selectedList.childes_order];
        const index = newChildesOrder.indexOf(elementId);

        if (index === -1) return;

        if (direction === "up" && index > 0) {
            [newChildesOrder[index - 1], newChildesOrder[index]] = [newChildesOrder[index], newChildesOrder[index - 1]];
        } else if (direction === "down" && index < newChildesOrder.length - 1) {
            [newChildesOrder[index + 1], newChildesOrder[index]] = [newChildesOrder[index], newChildesOrder[index + 1]];
        } else {
            return;
        }

        try {
            await updateListMutation({ listId: selectedList.id, childes_order: newChildesOrder }).unwrap();
            if (onSuccess) onSuccess('Порядок задачи изменен');
        } catch (err) {
            if (onError) onError(err);
        }
    }, [selectedList, updateListMutation, onSuccess, onError, handleCloseMenu]);

    const handleDeleteFromChildes = useCallback(async (elementId) => {
        if (!selectedList?.id) return;
        try {
            await deleteFromChildesMutation({
                source_id: `task_${elementId}`,
                group_id: selectedList.id,
            }).unwrap();
            if (onSuccess) onSuccess('Задача удалена из списка');
        } catch (err) {
            if (onError) onError(err);
        }
        handleCloseMenu();
    }, [selectedList, deleteFromChildesMutation, onSuccess, onError, handleCloseMenu]);

    return {
        anchorEl,
        listsMenuAnchorEl,
        actionType,
        handleContextMenu,
        handleCloseMenu,
        handleOpenListsMenu,
        handleAddToMyDayClick,
        handleUpToTask,
        handleToListAction,
        handleChangeChildesOrder,
        handleDeleteFromChildes,
    };
}