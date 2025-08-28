import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
    useChangeTaskStatusMutation,
    useUpdateTaskMutation,
    useDeleteFromChildesMutation,
    useLinkTaskMutation,
} from '../../../../store/tasksSlice';
import { useUpdateListMutation } from '../../../../store/listsSlice';
import { setSelectedTaskId } from '../../../../store/todoLayoutSlice.js';

/**
 * Hook for managing task actions (status change, move, delete, etc.)
 */
export const useTaskActions = (selectedList, tasks, onSuccess, onError) => {
    const dispatch = useDispatch();

    // RTK Query Mutations
    const [changeTaskStatusMutation] = useChangeTaskStatusMutation();
    const [updateTaskMutation] = useUpdateTaskMutation();
    const [deleteFromChildesMutation] = useDeleteFromChildesMutation();
    const [linkTaskMutation] = useLinkTaskMutation();
    const [updateListMutation] = useUpdateListMutation();

    /**
     * Handle task status toggle (complete/uncomplete)
     */
    const handleToggle = useCallback(async (task_id, checked) => {
        if (!selectedList?.id) return;
        
        const is_completed = checked;
        try {
            await changeTaskStatusMutation({ 
                taskId: task_id, 
                is_completed: is_completed, 
                completed_at: checked ? new Date().toISOString() : null, 
                listId: selectedList.id 
            }).unwrap();
            
            if (onSuccess) onSuccess(`Task status changed`);
        } catch (err) {
            if (onError) onError(err);
        }
    }, [changeTaskStatusMutation, selectedList, onSuccess, onError]);

    /**
     * Handle task selection
     */
    const handleSelectTask = useCallback((taskId) => {
        dispatch(setSelectedTaskId(taskId));
    }, [dispatch, tasks]);

    /**
     * Add task to "My Day"
     */
    const handleAddToMyDay = useCallback(async (taskId) => {
        try {
            await updateTaskMutation({ taskId, isMyDay: true }).unwrap();
            if (onSuccess) onSuccess('Добавлено в "Мой день"');
        } catch (err) {
            if (onError) onError(err);
        }
    }, [updateTaskMutation, onSuccess, onError]);

    /**
     * Change task order in list
     */
    const handleChangeChildesOrder = useCallback(async (elementId, direction) => {
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
    }, [updateListMutation, selectedList, onSuccess, onError]);

    /**
     * Remove task from list
     */
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
    }, [deleteFromChildesMutation, selectedList, onSuccess, onError]);

    /**
     * Link or move task to another list
     */
    const handleToListAction = useCallback(async (targetId, actionType, sourceTaskId) => {
        const params = {
            task_id: sourceTaskId,
            list_id: targetId,
            action: actionType,
        };
        
        if (actionType === "move" && selectedList?.id) {
            params.source_list_id = selectedList.id;
        }

        try {
            await linkTaskMutation(params).unwrap();
            if (onSuccess) onSuccess('Задача перемещена/связана');
        } catch (err) {
            if (onError) onError(err);
        }
    }, [linkTaskMutation, selectedList, onSuccess, onError]);

    /**
     * Link task to current list
     */
    const handleUpToTask = useCallback((sourceTaskId) => {
        if (!selectedList?.id) return;
        handleToListAction(selectedList.id, "link", sourceTaskId);
    }, [selectedList, handleToListAction]);

    return {
        handleToggle,
        handleSelectTask,
        handleAddToMyDay,
        handleChangeChildesOrder,
        handleDeleteFromChildes,
        handleToListAction,
        handleUpToTask,
    };
};


