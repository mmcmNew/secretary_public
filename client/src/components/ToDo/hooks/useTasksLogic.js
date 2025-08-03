// hooks/useTasksLogic.js - Изолированная логика для работы с задачами
import { useState, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';

export const useTasksLogic = ({
  tasks = [],
  selectedList = null,
  selectedTaskId = null,
  onTaskSelect = null,
  onTaskToggle = null,
  onTaskUpdate = null,
  onSubtasksLoad = null,
  onCalendarUpdate = null,
  onSuccess = null,
  onError = null,
  calendarRange = null,
}) => {
  const [open, setOpen] = useState({});
  const [completedOpen, setCompletedOpen] = useState(true);

  // Мемоизированные вычисления для задач
  const { activeTasks, completedTasks } = useMemo(() => {
    if (!tasks || !selectedList) {
      return { activeTasks: [], completedTasks: [] };
    }

    const isMyDayList = selectedList?.id === 'my_day';
    
    if (isMyDayList) {
      return {
        activeTasks: tasks.filter(t => t.status_id !== 2),
        completedTasks: tasks.filter(t => t.status_id === 2),
      };
    }

    // Для обычных списков используем childes_order
    const activeTasksFromOrder = selectedList.childes_order
      ?.map(taskId => tasks.find(t => t.id === taskId && t.status_id !== 2))
      .filter(Boolean) || [];
    
    const completedTasksFromOrder = selectedList.childes_order
      ?.map(taskId => tasks.find(t => t.id === taskId && t.status_id === 2))
      .filter(Boolean) || [];

    return {
      activeTasks: activeTasksFromOrder,
      completedTasks: completedTasksFromOrder,
    };
  }, [tasks, selectedList]);

  // Обработчики событий
  const handleTaskToggle = useCallback(async (taskId, checked) => {
    if (!onTaskToggle) return;

    const status_id = checked ? 2 : 1;
    const updatedFields = { status_id };
    
    if (status_id === 2) {
      updatedFields.completed_at = dayjs().toISOString();
    }

    try {
      await onTaskToggle({ taskId, ...updatedFields, listId: selectedList?.id });
      if (onCalendarUpdate) await onCalendarUpdate(calendarRange);
      if (onSuccess) onSuccess('Статус задачи изменен');
    } catch (error) {
      if (onError) onError(error);
    }
  }, [onTaskToggle, onCalendarUpdate, onSuccess, onError, selectedList, calendarRange]);

  const handleTaskClick = useCallback(async (taskId) => {
    const willOpen = !open[taskId];
    setOpen(prev => ({ ...prev, [taskId]: willOpen }));

    if (willOpen && onSubtasksLoad) {
      const task = tasks.find(t => t.id === taskId);
      if (task?.childes_order?.length) {
        try {
          await onSubtasksLoad(taskId);
        } catch (error) {
          if (onError) onError(error);
        }
      }
    }
  }, [open, onSubtasksLoad, tasks, onError]);

  const handleTaskSelect = useCallback((taskId) => {
    if (onTaskSelect) onTaskSelect(taskId);
  }, [onTaskSelect]);

  const handleAddToMyDay = useCallback(async (taskId) => {
    if (!onTaskUpdate) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const today = dayjs().hour(12).minute(0).second(0).millisecond(0);
    const end = today.clone().add(1, 'hour');

    try {
      await onTaskUpdate({
        taskId: task.id,
        start: today.toISOString(),
        end: end.toISOString(),
      });
      if (onCalendarUpdate) await onCalendarUpdate(calendarRange);
      if (onSuccess) onSuccess('Добавлено в "Мой день"');
    } catch (error) {
      if (onError) onError(error);
    }
  }, [tasks, onTaskUpdate, onCalendarUpdate, onSuccess, onError, calendarRange]);

  return {
    // Состояние
    open,
    completedOpen,
    setCompletedOpen,
    activeTasks,
    completedTasks,
    
    // Обработчики
    handleTaskToggle,
    handleTaskClick,
    handleTaskSelect,
    handleAddToMyDay,
  };
};