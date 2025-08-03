// hooks/useListsLogic.js - Изолированная логика для работы со списками
import { useState, useCallback, useMemo } from 'react';

export const useListsLogic = ({
  listsList,
  defaultLists,
  projects,
  listsObject = null, // Новый параметр для объекта ListsList
  selectedListId = null,
  onListSelect = null,
  onListUpdate = null,
  onListLink = null,
  onListDelete = null,
  onTaskLink = null,
  onRefresh = null,
  onSuccess = null,
  onError = null,
}) => {
  // Используем массивы из объекта listsObject, если он передан, иначе используем оригинальные параметры
  const lists = listsObject?.lists || listsList || [];
  const default_lists = listsObject?.default_lists || defaultLists || [];
  const projects_list = listsObject?.projects || projects || [];
  const [openGroups, setOpenGroups] = useState({});
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Мемоизированные вычисления
  const allLists = useMemo(() => {
    console.log(lists, default_lists, projects_list);
    return [...default_lists, ...projects_list, ...lists];
  }, [default_lists, projects_list, lists]);

  const selectedList = useMemo(() => {
    return allLists.find(list => list.id === selectedListId) || null;
  }, [allLists, selectedListId]);

  // Обработчики событий
  const handleToggleGroup = useCallback((id) => {
    setOpenGroups(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleListSelect = useCallback((listId) => {
    if (editingItemId) return;
    if (onListSelect) onListSelect(listId);
  }, [editingItemId, onListSelect]);

  const handleEditStart = useCallback((itemId, currentTitle) => {
    setEditingItemId(itemId);
    setEditingTitle(currentTitle);
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editingItemId || !onListUpdate) return;

    try {
      await onListUpdate({ listId: editingItemId, title: editingTitle });
      setEditingItemId(null);
      setEditingTitle('');
      if (onSuccess) onSuccess('Список обновлен');
    } catch (error) {
      if (onError) onError(error);
    }
  }, [editingItemId, editingTitle, onListUpdate, onSuccess, onError]);

  const handleEditCancel = useCallback(() => {
    setEditingItemId(null);
    setEditingTitle('');
  }, []);

  const handleOrderChange = useCallback(async (elementId, direction, groupId) => {
    if (!onListUpdate) return;

    try {
      // Логика изменения порядка элементов
      if (!groupId || String(elementId).startsWith('project_')) {
        // Работа с общим списком
        const generalList = String(elementId).startsWith('project_')
          ? projects_list
          : default_lists.filter(item => item.inGeneralList === 1 && !item.deleted);

        const index = generalList.findIndex(list => list.id === elementId);
        if (index === -1) return;

        const isValidMove = (direction === 'up' && index > 0) || 
                           (direction === 'down' && index < generalList.length - 1);
        if (!isValidMove) return;

        const replacedIndex = direction === 'up' ? index - 1 : index + 1;
        const replacedElement = generalList[replacedIndex];
        const currentElement = generalList[index];

        // Обмен порядковыми номерами
        await onListUpdate({ listId: elementId, order: replacedElement.order });
        await onListUpdate({ listId: replacedElement.id, order: currentElement.order });
      } else {
        // Работа с группой
        const targetGroup = allLists.find(group => group.id === groupId);
        if (!targetGroup?.childes_order) return;

        const index = targetGroup.childes_order.indexOf(elementId);
        if (index === -1) return;

        const newOrder = [...targetGroup.childes_order];
        if (direction === 'up' && index > 0) {
          [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        } else if (direction === 'down' && index < newOrder.length - 1) {
          [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
        }

        await onListUpdate({ listId: groupId, childes_order: newOrder });
      }

      if (onSuccess) onSuccess('Порядок изменен');
    } catch (error) {
      if (onError) onError(error);
    }
  }, [onListUpdate, projects_list, default_lists, allLists, onSuccess, onError]);

  const handleTaskDrop = useCallback(async (taskData, listId, action) => {
    if (!onTaskLink) return;

    try {
      const params = { task_id: taskData.id, list_id: listId, action };
      if (action === 'move' && taskData.lists_ids?.length) {
        params.source_list_id = taskData.lists_ids[0];
      }
      
      await onTaskLink(params);
      if (onSuccess) onSuccess(`Задача ${action === 'move' ? 'перемещена' : 'связана'}`);
    } catch (error) {
      if (onError) onError(error);
    }
  }, [onTaskLink, onSuccess, onError]);

  const handleListDrop = useCallback(async (listData, targetId, action) => {
    if (!onListLink) return;

    try {
      await onListLink({ source_id: listData.id, target_id: targetId });
      
      if (action === 'move' && onListDelete) {
        // Найти родительский элемент и удалить из него
        const parent = allLists.find(item => 
          item.childes_order?.includes(listData.id)
        );
        if (parent) {
          await onListDelete({ source_id: listData.id, group_id: parent.id });
        }
      }
      
      if (onSuccess) onSuccess(`Список ${action === 'move' ? 'перемещен' : 'связан'}`);
    } catch (error) {
      if (onError) onError(error);
    }
  }, [onListLink, onListDelete, allLists, onSuccess, onError]);

  return {
    // Состояние
    openGroups,
    editingItemId,
    editingTitle,
    setEditingTitle,
    selectedList,
    allLists,
    
    // Обработчики
    handleToggleGroup,
    handleListSelect,
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleOrderChange,
    handleTaskDrop,
    handleListDrop,
  };
};