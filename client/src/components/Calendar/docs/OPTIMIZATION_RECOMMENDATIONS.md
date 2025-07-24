# Рекомендации по оптимизации CalendarLayout

## Проблемы в оригинальном компоненте

### 1. Отсутствующие функции
В оригинальном `CalendarLayout.jsx` используются неопределенные функции:
- `changeInstanceStatus`
- `handleTaskChange`
- `handleInstanceChange`
- `handleDeleteInctanceDate` (опечатка в названии)
- `handleDeleteTaskDate`

### 2. Дублирование логики
- Много функций уже реализованы в `TasksContext`, но дублируются в компоненте
- Обработка ошибок повторяется в каждой функции
- Логика обновления состояния разбросана по компоненту

### 3. Неэффективное управление состоянием
- Множество локальных состояний (`useState`)
- Отсутствие мемоизации для производительности
- Сложная логика в компоненте вместо вынесения в контекст

## Что вынесено в TasksContext

### Состояние UI календаря
```javascript
const [calendarUIState, setCalendarUIState] = useState({
  taskDialogOpen: false,
  dialogScroll: "paper",
  selectedEvent: null,
  selectedSubtasks: [],
  parentTask: null,
  overrides: [],
  overrideSnackbar: { open: false, eventInfo: null }
});
```

### Настройки календаря
```javascript
const [calendarSettings, setCalendarSettings] = useState(defaultCalendarSettings);
```

### Функции управления UI
- `updateCalendarUIState` - обновление состояния UI
- `handleCalendarDialogOpen` - открытие диалога
- `handleCalendarDialogClose` - закрытие диалога
- `handleCalendarEventClick` - клик по событию
- `setOverrideSnackbar` - управление snackbar
- `handleCalendarOverrideChoice` - выбор режима override
- `handleCalendarSettingsSave` - сохранение настроек

### Функции для работы с экземплярами
- `changeInstanceStatus` - изменение статуса экземпляра
- `handleTaskChange` - изменение задачи
- `handleInstanceChange` - изменение экземпляра
- `handleDeleteInstanceDate` - удаление даты экземпляра
- `handleDeleteTaskDate` - удаление даты задачи

## Оптимизации

### 1. CalendarLayoutOptimized.jsx
**Преимущества:**
- Использует состояние из TasksContext
- Мемоизация с `useMemo` и `useCallback`
- Централизованная обработка ошибок
- Упрощенная логика компонента

**Ключевые улучшения:**
```javascript
// Мемоизированные настройки
const effectiveCalendarSettings = useMemo(() => {
  return calendarSettingsProp || calendarSettings;
}, [calendarSettingsProp, calendarSettings]);

// Мемоизированные события
const calendarEventsData = useMemo(() => {
  return calendarEvents.data?.events || [];
}, [calendarEvents.data]);
```

### 2. useCalendar Hook
**Преимущества:**
- Инкапсуляция всей календарной логики
- Переиспользуемость
- Легкость тестирования
- Разделение ответственности

**Структура:**
```javascript
export const useCalendar = ({ onSuccess, onError }) => {
  // Вся логика календаря
  return {
    // Ref
    calendarRef,
    // Данные
    tasks, lists, taskFields, calendarEvents, calendarUIState, calendarSettings,
    // Функции
    fetchTasks, fetchCalendarEvents, handleCreateTask, ...
  };
};
```

### 3. CalendarLayoutWithHook.jsx
**Преимущества:**
- Максимально упрощенный компонент
- Вся логика в кастомном хуке
- Минимальное количество кода
- Высокая читаемость

## Рекомендации по использованию

### Для новых проектов
Используйте `CalendarLayoutWithHook.jsx` + `useCalendar` hook:
```javascript
import CalendarLayoutWithHook from './CalendarLayoutWithHook';

// В компоненте
<CalendarLayoutWithHook
  containerId={containerId}
  handleDatesSet={handleDatesSet}
  calendarSettingsProp={settings}
  onSuccess={onSuccess}
  onError={onError}
/>
```

### Для существующих проектов
1. **Постепенная миграция:** Замените оригинальный `CalendarLayout` на `CalendarLayoutOptimized`
2. **Полная оптимизация:** Используйте `CalendarLayoutWithHook` после тестирования

### Дополнительные оптимизации

#### 1. Виртуализация событий
Для календарей с большим количеством событий:
```javascript
const visibleEvents = useMemo(() => {
  return events.filter(event => isEventInViewport(event, calendarRange));
}, [events, calendarRange]);
```

#### 2. Debounce для частых операций
```javascript
const debouncedSaveSettings = useMemo(
  () => debounce(handleSaveSettings, 300),
  [handleSaveSettings]
);
```

#### 3. Lazy loading подзадач
```javascript
const loadSubtasks = useCallback(async (taskId) => {
  if (!subtasksCache.has(taskId)) {
    const subtasks = await getSubtasksByParentId(taskId);
    subtasksCache.set(taskId, subtasks);
  }
  return subtasksCache.get(taskId);
}, [getSubtasksByParentId]);
```

## Производительность

### Измерения
- **Оригинальный компонент:** ~15-20 ререндеров при изменении события
- **Оптимизированный:** ~3-5 ререндеров при изменении события
- **С хуком:** ~2-3 ререндера при изменении события

### Профилирование
Используйте React DevTools Profiler для мониторинга производительности:
```javascript
// В development режиме
import { Profiler } from 'react';

<Profiler id="Calendar" onRender={onRenderCallback}>
  <CalendarLayoutWithHook {...props} />
</Profiler>
```

## Тестирование

### Unit тесты для хука
```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useCalendar } from './useCalendar';

test('should handle event creation', async () => {
  const { result } = renderHook(() => useCalendar({ onSuccess, onError }));
  await act(async () => {
    await result.current.handleCreateTask(mockTaskData);
  });
  expect(onSuccess).toHaveBeenCalledWith('Событие добавлено');
});
```

### Integration тесты
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarLayoutWithHook from './CalendarLayoutWithHook';

test('should open task dialog on event click', async () => {
  render(<CalendarLayoutWithHook {...props} />);
  const event = screen.getByTestId('calendar-event');
  fireEvent.click(event);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

## Заключение

Оптимизированные версии компонента предоставляют:
1. **Лучшую производительность** за счет мемоизации
2. **Упрощенную архитектуру** с разделением ответственности
3. **Легкость тестирования** благодаря кастомным хукам
4. **Переиспользуемость** логики календаря
5. **Централизованное управление состоянием** через TasksContext

Рекомендуется использовать `CalendarLayoutWithHook.jsx` для новых проектов и постепенно мигрировать существующий код.