// hooks/useTasks.js
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// import api from '../../../utils/api';

export const useTasks = ({ onError, setLoading }) => {
  // // const queryClient = useQueryClient();
  // const [tasks, setTasks] = useState({ data: [], loading: false, error: null });
  // const [selectedTaskId, setSelectedTaskId] = useState(null);
  // const [taskFields, setTaskFields] = useState({});
  
  // // Отслеживание pending операций для предотвращения конфликтов
  // const pendingOperations = useRef(new Map());
  // const lastServerUpdate = useRef(Date.now());

  // // // Мутации
  // // const addTaskMutation = useMutation({
  // //   mutationFn: (params) => api.post('/tasks/add_task', params),
  // // });
  // // const updateTaskMutation = useMutation({
  // //   mutationFn: (params) => api.put('/tasks/edit_task', params),
  // // });
  // // const deleteTaskMutation = useMutation({
  // //   mutationFn: (params) => api.delete('/tasks/del_task', params),
  // // });
  // // const changeStatusMutation = useMutation({
  // //   mutationFn: (params) => api.put('/tasks/change_status', params),
  // // });

  // // Генерация уникального ID для операции
  // const generateOperationId = useCallback(() => {
  //   return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // }, []);

  // // Проверка, не конфликтует ли операция с WebSocket обновлением
  // const shouldApplyOptimisticUpdate = useCallback((taskId, operationType) => {
  //   const operationKey = `${taskId}_${operationType}`;
  //   const pendingOp = pendingOperations.current.get(operationKey);
    
  //   // Если есть pending операция и она недавняя (< 5 сек), не применяем optimistic update
  //   if (pendingOp && (Date.now() - pendingOp.timestamp) < 5000) {
  //     return false;
  //   }
    
  //   return true;
  // }, []);

  // // Регистрация pending операции
  // const registerPendingOperation = useCallback((taskId, operationType, operationId) => {
  //   const operationKey = `${taskId}_${operationType}`;
  //   pendingOperations.current.set(operationKey, {
  //     id: operationId,
  //     timestamp: Date.now(),
  //     taskId,
  //     operationType
  //   });
    
  //   // Автоматическая очистка через 10 секунд
  //   setTimeout(() => {
  //     const current = pendingOperations.current.get(operationKey);
  //     if (current && current.id === operationId) {
  //       pendingOperations.current.delete(operationKey);
  //     }
  //   }, 10000);
  // }, []);

  // // Очистка pending операции
  // const clearPendingOperation = useCallback((taskId, operationType) => {
  //   const operationKey = `${taskId}_${operationType}`;
  //   pendingOperations.current.delete(operationKey);
  // }, []);

  // // Обработка WebSocket обновлений
  // const handleWebSocketUpdate = useCallback((updatedTasks) => {
  //   const now = Date.now();
    
  //   setTasks(prev => {
  //     const newData = [...prev.data];
  //     let hasChanges = false;
      
  //     updatedTasks.forEach(updatedTask => {
  //       const existingIndex = newData.findIndex(t => t.id === updatedTask.id);
        
  //       // Проверяем, есть ли pending операции для этой задачи
  //       const hasPendingUpdate = Array.from(pendingOperations.current.values())
  //         .some(op => op.taskId === updatedTask.id && (now - op.timestamp) < 3000);
        
  //       if (!hasPendingUpdate) {
  //         if (existingIndex !== -1) {
  //           // Обновляем существующую задачу
  //           newData[existingIndex] = { ...newData[existingIndex], ...updatedTask };
  //           hasChanges = true;
  //         } else {
  //           // Добавляем новую задачу
  //           newData.push(updatedTask);
  //           hasChanges = true;
  //         }
  //       }
  //     });
      
  //     if (hasChanges) {
  //       lastServerUpdate.current = now;
  //       return { ...prev, data: newData };
  //     }
      
  //     return prev;
  //   });
  // }, []);

  // // const addTask = useCallback(async (params) => {
  // //   const operationId = generateOperationId();
  // //   const tempId = `temp_${operationId}`;
    
  // //   // Создаем временную задачу для optimistic update
  // //   const tempTask = {
  // //     ...params.task,
  // //     id: tempId,
  // //     created_at: new Date().toISOString(),
  // //     updated_at: new Date().toISOString(),
  // //   };
    
  // //   try {
  // //     // Optimistic update только если нет конфликтующих операций
  // //     if (shouldApplyOptimisticUpdate(tempId, 'add')) {
  // //       setTasks(prev => ({ ...prev, data: [tempTask, ...prev.data] }));
  // //       registerPendingOperation(tempId, 'add', operationId);
  // //     }
      
  // //     const res = await addTaskMutation.mutateAsync(params);
      
  // //     if (res.task) {
  // //       setTasks(prev => ({
  // //         ...prev,
  // //         data: prev.data.map(t => t.id === tempId ? res.task : t)
  // //       }));
  // //     }
      
  // //     clearPendingOperation(tempId, 'add');
  // //     return res;
  // //   } catch (err) {
  // //     // Откат optimistic update
  // //     setTasks(prev => ({
  // //       ...prev,
  // //       data: prev.data.filter(t => t.id !== tempId)
  // //     }));
  // //     clearPendingOperation(tempId, 'add');
  // //     onError?.(err);
  // //     throw err;
  // //   }
  // // }, [addTaskMutation, onError, shouldApplyOptimisticUpdate, registerPendingOperation, clearPendingOperation, generateOperationId]);

  // const updateTask = useCallback(async (params) => {
  //   const operationId = generateOperationId();
  //   const taskIndex = tasks.data.findIndex(t => t.id === params.taskId);
  //   const previousTask = taskIndex !== -1 ? tasks.data[taskIndex] : null;
    
  //   try {
  //     // Optimistic update только если нет конфликтующих операций
  //     if (previousTask && shouldApplyOptimisticUpdate(params.taskId, 'update')) {
  //       const updatedTask = { ...previousTask, ...params };
  //       setTasks(prev => ({
  //         ...prev,
  //         data: prev.data.map(t => t.id === params.taskId ? updatedTask : t)
  //       }));
  //       registerPendingOperation(params.taskId, 'update', operationId);
  //     }
      
  //     // const res = await updateTaskMutation.mutateAsync(params);
      
  //     if (res.task) {
  //       setTasks(prev => ({
  //         ...prev,
  //         data: prev.data.map(t => t.id === params.taskId ? { ...t, ...res.task } : t)
  //       }));
  //     }
      
  //     clearPendingOperation(params.taskId, 'update');
  //     return res;
  //   } catch (err) {
  //     // Откат optimistic update
  //     if (previousTask) {
  //       setTasks(prev => ({
  //         ...prev,
  //         data: prev.data.map(t => t.id === params.taskId ? previousTask : t)
  //       }));
  //     }
  //     clearPendingOperation(params.taskId, 'update');
  //     onError?.(err);
  //     throw err;
  //   }
  // }, [updateTaskMutation, onError, tasks.data, shouldApplyOptimisticUpdate, registerPendingOperation, clearPendingOperation, generateOperationId]);

  // const deleteTask = useCallback(async (params) => {
  //   const operationId = generateOperationId();
  //   const taskToDelete = tasks.data.find(t => t.id === params.taskId);
    
  //   try {
  //     // Optimistic update только если нет конфликтующих операций
  //     if (shouldApplyOptimisticUpdate(params.taskId, 'delete')) {
  //       setTasks(prev => ({
  //         ...prev,
  //         data: prev.data.filter(t => t.id !== params.taskId)
  //       }));
  //       registerPendingOperation(params.taskId, 'delete', operationId);
  //     }
      
  //     const res = await deleteTaskMutation.mutateAsync(params);
  //     clearPendingOperation(params.taskId, 'delete');
  //     return res;
  //   } catch (err) {
  //     // Откат optimistic update
  //     if (taskToDelete) {
  //       setTasks(prev => ({
  //         ...prev,
  //         data: [...prev.data, taskToDelete].sort((a, b) => a.id - b.id)
  //       }));
  //     }
  //     clearPendingOperation(params.taskId, 'delete');
  //     onError?.(err);
  //     throw err;
  //   }
  // }, [deleteTaskMutation, onError, tasks.data, shouldApplyOptimisticUpdate, registerPendingOperation, clearPendingOperation, generateOperationId]);

  // const changeTaskStatus = useCallback(async (params) => {
  //   const operationId = generateOperationId();
  //   const previousTasks = tasks.data;
    
  //   try {
  //     // Optimistic update только если нет конфликтующих операций
  //     if (shouldApplyOptimisticUpdate(params.taskId, 'status')) {
  //       setTasks(prev => ({
  //         ...prev,
  //         data: prev.data.map(t =>
  //           t.id === params.taskId
  //             ? { ...t, status_id: params.status_id, completed_at: params.completed_at || new Date().toISOString() }
  //             : t
  //         )
  //       }));
  //       registerPendingOperation(params.taskId, 'status', operationId);
  //     }
      
  //     const res = await changeStatusMutation.mutateAsync(params);
      
  //     if (res.changed_ids) {
  //       setTasks(prev => ({
  //         ...prev,
  //         data: prev.data.map(t =>
  //           res.changed_ids.includes(t.id)
  //             ? { ...t, status_id: params.status_id, completed_at: params.completed_at || new Date().toISOString() }
  //             : t
  //         )
  //       }));
  //     }
      
  //     clearPendingOperation(params.taskId, 'status');
  //     return res;
  //   } catch (err) {
  //     // Откат optimistic update
  //     setTasks(prev => ({ ...prev, data: previousTasks }));
  //     clearPendingOperation(params.taskId, 'status');
  //     onError?.(err);
  //     throw err;
  //   }
  // }, [changeStatusMutation, onError, tasks.data, shouldApplyOptimisticUpdate, registerPendingOperation, clearPendingOperation, generateOperationId]);

  // const fetchTasks = useCallback(async (listId) => {
  //   if (!listId) return;
  //   try {
  //     setLoading?.(true);
  //     const { data } = await api.get(`/tasks/get_tasks?list_id=${listId}`);
  //     setTasks({ data: data.tasks || [], loading: false, error: null });
      
  //     // Получаем taskFields, если они еще не загружены
  //     if (Object.keys(taskFields).length === 0) {
  //       try {
  //         const fieldsResponse = await api.get('/tasks/fields_config');
  //         setTaskFields(fieldsResponse.data || {});
  //       } catch (err) {
  //         console.error('Error fetching task fields:', err);
  //         onError?.(err);
  //       }
  //     }
  //   } catch (err) {
  //     onError?.(err);
  //     setTasks(prev => ({ ...prev, loading: false, error: err }));
  //   } finally {
  //     setLoading?.(false);
  //   }
  // }, [onError, setLoading, taskFields]);

  // Очистка pending операций при размонтировании
  // useEffect(() => {
  //   return () => {
  //     pendingOperations.current.clear();
  //   };
  // }, []);

  return {
    // tasks,
    // selectedTaskId,
    // setSelectedTaskId,
    // addTask,
    // updateTask,
    // deleteTask,
    // changeTaskStatus,
    // fetchTasks,
    // taskFields,
    // handleWebSocketUpdate,
  };
};