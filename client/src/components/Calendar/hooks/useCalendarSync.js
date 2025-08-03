// hooks/useCalendarSync.js - Улучшенная стратегия синхронизации календаря
import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../utils/api';

export const useCalendarSync = ({ onError, setLoading }) => {
  const queryClient = useQueryClient();
  const [calendarEvents, setCalendarEvents] = useState({ data: { events: [] }, loading: false, error: null });
  const [calendarSettings, setCalendarSettings] = useState({
    slotDuration: 30,
    timeRange: [8, 24],
    currentView: "timeGridWeek",
  });
  
  // Отслеживание pending операций для предотвращения конфликтов
  const pendingOperations = useRef(new Map());
  const lastServerUpdate = useRef(Date.now());
  
  // Мутации
  const addEventMutation = useMutation({
    mutationFn: (params) => api.post('/tasks/add_task', params),
  });
  const updateEventMutation = useMutation({
    mutationFn: (params) => api.put('/tasks/edit_task', params),
  });
  const deleteEventMutation = useMutation({
    mutationFn: (params) => api.delete('/tasks/del_task', params),
  });
  const patchInstanceMutation = useMutation({
    mutationFn: (params) => api.patch('/tasks/instance', params),
  });

  // Генерация уникального ID для операции
  const generateOperationId = useCallback(() => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Проверка, не конфликтует ли операция с WebSocket обновлением
  const shouldApplyOptimisticUpdate = useCallback((eventId, operationType) => {
    const operationKey = `${eventId}_${operationType}`;
    const pendingOp = pendingOperations.current.get(operationKey);
    
    // Если есть pending операция и она недавняя (< 5 сек), не применяем optimistic update
    if (pendingOp && (Date.now() - pendingOp.timestamp) < 5000) {
      return false;
    }
    
    return true;
  }, []);

  // Регистрация pending операции
  const registerPendingOperation = useCallback((eventId, operationType, operationId) => {
    const operationKey = `${eventId}_${operationType}`;
    pendingOperations.current.set(operationKey, {
      id: operationId,
      timestamp: Date.now(),
      eventId,
      operationType
    });
    
    // Автоматическая очистка через 10 секунд
    setTimeout(() => {
      const current = pendingOperations.current.get(operationKey);
      if (current && current.id === operationId) {
        pendingOperations.current.delete(operationKey);
      }
    }, 10000);
  }, []);

  // Очистка pending операции
  const clearPendingOperation = useCallback((eventId, operationType) => {
    const operationKey = `${eventId}_${operationType}`;
    pendingOperations.current.delete(operationKey);
  }, []);

  // Обработка WebSocket обновлений
  const handleWebSocketUpdate = useCallback((updatedEvents) => {
    const now = Date.now();
    
    setCalendarEvents(prev => {
      const newData = { ...prev.data };
      newData.events = [...newData.events];
      let hasChanges = false;
      
      updatedEvents.forEach(updatedEvent => {
        const existingIndex = newData.events.findIndex(e => e.id === updatedEvent.id);
        
        // Проверяем, есть ли pending операции для этого события
        const hasPendingUpdate = Array.from(pendingOperations.current.values())
          .some(op => op.eventId === updatedEvent.id && (now - op.timestamp) < 3000);
        
        if (!hasPendingUpdate) {
          if (existingIndex !== -1) {
            // Обновляем существующее событие
            newData.events[existingIndex] = { ...newData.events[existingIndex], ...updatedEvent };
            hasChanges = true;
          } else {
            // Добавляем новое событие
            newData.events.push(updatedEvent);
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        lastServerUpdate.current = now;
        return { ...prev, data: newData };
      }
      
      return prev;
    });
  }, []);

  const addEvent = useCallback(async (params) => {
    const operationId = generateOperationId();
    const tempId = `temp_${operationId}`;
    
    // Создаем временное событие для optimistic update
    const tempEvent = {
      ...params.task,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    try {
      // Optimistic update только если нет конфликтующих операций
      if (shouldApplyOptimisticUpdate(tempId, 'add')) {
        setCalendarEvents(prev => ({
          ...prev,
          data: {
            ...prev.data,
            events: [tempEvent, ...prev.data.events]
          }
        }));
        registerPendingOperation(tempId, 'add', operationId);
      }
      
      const res = await addEventMutation.mutateAsync(params);
      
      if (res.task) {
        setCalendarEvents(prev => ({
          ...prev,
          data: {
            ...prev.data,
            events: prev.data.events.map(e => e.id === tempId ? res.task : e)
          }
        }));
      }
      
      clearPendingOperation(tempId, 'add');
      return res;
    } catch (err) {
      // Откат optimistic update
      setCalendarEvents(prev => ({
        ...prev,
        data: {
          ...prev.data,
          events: prev.data.events.filter(e => e.id !== tempId)
        }
      }));
      clearPendingOperation(tempId, 'add');
      onError?.(err);
      throw err;
    }
  }, [addEventMutation, onError, shouldApplyOptimisticUpdate, registerPendingOperation, clearPendingOperation, generateOperationId]);

  const updateEvent = useCallback(async (params) => {
    const operationId = generateOperationId();
    const eventIndex = calendarEvents.data.events.findIndex(e => e.id === params.taskId);
    const previousEvent = eventIndex !== -1 ? calendarEvents.data.events[eventIndex] : null;
    
    try {
      // Optimistic update только если нет конфликтующих операций
      if (previousEvent && shouldApplyOptimisticUpdate(params.taskId, 'update')) {
        const updatedEvent = { ...previousEvent, ...params };
        setCalendarEvents(prev => ({
          ...prev,
          data: {
            ...prev.data,
            events: prev.data.events.map(e => e.id === params.taskId ? updatedEvent : e)
          }
        }));
        registerPendingOperation(params.taskId, 'update', operationId);
      }
      
      const res = await updateEventMutation.mutateAsync(params);
      
      if (res.task) {
        setCalendarEvents(prev => ({
          ...prev,
          data: {
            ...prev.data,
            events: prev.data.events.map(e => e.id === params.taskId ? { ...e, ...res.task } : e)
          }
        }));
      }
      
      clearPendingOperation(params.taskId, 'update');
      return res;
    } catch (err) {
      // Откат optimistic update
      if (previousEvent) {
        setCalendarEvents(prev => ({
          ...prev,
          data: {
            ...prev.data,
            events: prev.data.events.map(e => e.id === params.taskId ? previousEvent : e)
          }
        }));
      }
      clearPendingOperation(params.taskId, 'update');
      onError?.(err);
      throw err;
    }
  }, [updateEventMutation, onError, calendarEvents.data.events, shouldApplyOptimisticUpdate, registerPendingOperation, clearPendingOperation, generateOperationId]);

  const deleteEvent = useCallback(async (params) => {
    const operationId = generateOperationId();
    const eventToDelete = calendarEvents.data.events.find(e => e.id === params.taskId);
    
    try {
      // Optimistic update только если нет конфликтующих операций
      if (shouldApplyOptimisticUpdate(params.taskId, 'delete')) {
        setCalendarEvents(prev => ({
          ...prev,
          data: {
            ...prev.data,
            events: prev.data.events.filter(e => e.id !== params.taskId)
          }
        }));
        registerPendingOperation(params.taskId, 'delete', operationId);
      }
      
      const res = await deleteEventMutation.mutateAsync(params);
      clearPendingOperation(params.taskId, 'delete');
      return res;
    } catch (err) {
      // Откат optimistic update
      if (eventToDelete) {
        setCalendarEvents(prev => ({
          ...prev,
          data: {
            ...prev.data,
            events: [...prev.data.events, eventToDelete].sort((a, b) => a.id - b.id)
          }
        }));
      }
      clearPendingOperation(params.taskId, 'delete');
      onError?.(err);
      throw err;
    }
  }, [deleteEventMutation, onError, calendarEvents.data.events, shouldApplyOptimisticUpdate, registerPendingOperation, clearPendingOperation, generateOperationId]);

  const patchInstance = useCallback(async (params) => {
    const operationId = generateOperationId();
    const eventIndex = calendarEvents.data.events.findIndex(e => e.id === params.parent_task_id);
    const previousEvent = eventIndex !== -1 ? calendarEvents.data.events[eventIndex] : null;
    
    try {
      // Optimistic update только если нет конфликтующих операций
      if (previousEvent && shouldApplyOptimisticUpdate(params.parent_task_id, 'patch')) {
        // Для экземпляров мы не изменяем основное событие, а создаем override
        // Поэтому optimistic update будет просто установка флага обновления
        registerPendingOperation(params.parent_task_id, 'patch', operationId);
      }
      
      const res = await patchInstanceMutation.mutateAsync(params);
      clearPendingOperation(params.parent_task_id, 'patch');
      return res;
    } catch (err) {
      clearPendingOperation(params.parent_task_id, 'patch');
      onError?.(err);
      throw err;
    }
  }, [patchInstanceMutation, onError, calendarEvents.data.events, shouldApplyOptimisticUpdate, registerPendingOperation, clearPendingOperation, generateOperationId]);

  const fetchCalendarEvents = useCallback(async (range) => {
    if (!range || !range.start || !range.end) return;
    try {
      setLoading?.(true);
      const params = new URLSearchParams(range);
      const { data } = await api.get(`/tasks/get_calendar_events?${params}`);
      setCalendarEvents({ data, loading: false, error: null });
    } catch (err) {
      onError?.(err);
      setCalendarEvents(prev => ({ ...prev, loading: false, error: err }));
    } finally {
      setLoading?.(false);
    }
  }, [onError, setLoading]);

  const handleCalendarSettingsSave = useCallback((settings, containerId, handleUpdateContent) => {
    setCalendarSettings(settings);
    handleUpdateContent?.(containerId, { calendarSettingsProp: settings });
  }, []);

  // Очистка pending операций при размонтировании
  useEffect(() => {
    return () => {
      pendingOperations.current.clear();
    };
  }, []);

  return {
    calendarEvents,
    calendarSettings,
    addEvent,
    updateEvent,
    deleteEvent,
    patchInstance,
    fetchCalendarEvents,
    handleCalendarSettingsSave,
    handleWebSocketUpdate,
  };
};