# Стратегия синхронизации календаря

## Обзор

Эта документация описывает оптимизированную стратегию синхронизации для компонентов календаря, которая включает в себя:

1. Отслеживание pending операций для предотвращения конфликтов между optimistic updates и WebSocket обновлениями
2. Систему генерации уникальных ID операций
3. Улучшенную обработку WebSocket обновлений с проверкой на конфликты
4. Автоматическую очистку операций через таймауты

## Архитектура

### Основные компоненты

1. **useCalendarSync.js** - Хук для управления синхронизацией календаря
2. **useCalendar.js** - Хук для управления календарной логикой (в компонентах календаря)
3. **CalendarLayout.jsx** - Основной компонент календаря
4. **CalendarComponent.jsx** - Компонент отображения календаря

### Поток данных

```
WebSocket обновления → useCalendarSync → CalendarLayout → CalendarComponent
Пользовательские действия → CalendarComponent → useCalendar → useCalendarSync → API → Сервер
```

## Реализация

### Отслеживание pending операций

Для предотвращения конфликтов между optimistic updates и WebSocket обновлениями используется система отслеживания pending операций:

```javascript
const pendingOperations = useRef(new Map());
```

Каждая операция регистрируется с уникальным ID и временем начала:

```javascript
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
```

### Генерация уникальных ID операций

Для каждой операции генерируется уникальный ID:

```javascript
const generateOperationId = useCallback(() => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}, []);
```

### Обработка WebSocket обновлений

При получении WebSocket обновлений проверяется наличие pending операций:

```javascript
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
```

### Optimistic Updates

При выполнении операций используются optimistic updates с проверкой на конфликты:

```javascript
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
```

## Преимущества

1. **Предотвращение конфликтов** - Система отслеживания pending операций предотвращает конфликты между optimistic updates и WebSocket обновлениями
2. **Уникальные ID** - Генерация уникальных ID операций обеспечивает точное отслеживание каждой операции
3. **Автоматическая очистка** - Автоматическая очистка операций через таймауты предотвращает утечки памяти
4. **Улучшенная отзывчивость** - Optimistic updates обеспечивают мгновенную реакцию на действия пользователя

## Использование

Для использования новой системы синхронизации достаточно подключить хук `useCalendar` в компоненте `CalendarLayout`:

```javascript
import useCalendar from './hooks/useCalendar';

export default function CalendarLayout({ onSuccess, onError }) {
  const calendarProps = useCalendar({ onSuccess, onError });
  
  return (
    <CalendarComponent {...calendarProps} />
  );
}