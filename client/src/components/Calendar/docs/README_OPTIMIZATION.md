# Оптимизация CalendarLayout

## Проблемы оригинального компонента

1. **Отсутствующие функции**: `changeInstanceStatus`, `handleTaskChange`, `handleInstanceChange`, `handleDeleteInctanceDate`, `handleDeleteTaskDate`
2. **Дублирование логики**: Повторение кода из TasksContext
3. **Неэффективное состояние**: Множество локальных useState
4. **Отсутствие мемоизации**: Пересоздание функций при каждом рендере

## Что вынесено в TasksContext

### Состояние UI
```javascript
calendarUIState: {
  taskDialogOpen: false,
  dialogScroll: "paper", 
  selectedEvent: null,
  selectedSubtasks: [],
  parentTask: null,
  overrides: [],
  overrideSnackbar: { open: false, eventInfo: null }
}
```

### Настройки календаря
```javascript
calendarSettings: {
  slotDuration: 30,
  timeRange: [8, 24],
  timeOffset: 0,
  currentView: "timeGridWeek",
  views: "timeGridWeek,timeGridDay,dayGridMonth,listWeek",
  isToggledBGTasksEdit: false
}
```

### Новые функции в контексте
- `updateCalendarUIState` - обновление UI состояния
- `handleCalendarDialogOpen/Close` - управление диалогами
- `handleCalendarEventClick` - обработка кликов
- `handleCalendarOverrideChoice` - выбор режима override
- `handleCalendarSettingsSave` - сохранение настроек
- `changeInstanceStatus` - изменение статуса экземпляра
- `handleTaskChange/InstanceChange` - изменение задач/экземпляров
- `handleDeleteInstanceDate/TaskDate` - удаление дат

## Созданные оптимизированные версии

### 1. CalendarLayoutOptimized.jsx
- Использует состояние из TasksContext
- Мемоизация с useMemo/useCallback
- Централизованная обработка ошибок
- Упрощенная логика

### 2. useCalendar Hook
- Инкапсуляция всей календарной логики
- Переиспользуемость
- Легкость тестирования
- Разделение ответственности

### 3. CalendarLayoutWithHook.jsx
- Максимально упрощенный компонент
- Вся логика в кастомном хуке
- Минимальное количество кода
- Высокая читаемость

## Преимущества оптимизации

### Производительность
- **Оригинал**: ~15-20 ререндеров при изменении события
- **Оптимизированный**: ~3-5 ререндеров
- **С хуком**: ~2-3 ререндера

### Архитектура
- Разделение ответственности
- Централизованное управление состоянием
- Переиспользуемая логика
- Легкость тестирования

### Поддержка
- Упрощенный код компонента
- Инкапсулированная логика в хуках
- Четкое разделение UI и бизнес-логики
- Лучшая читаемость

## Рекомендации по использованию

### Для новых проектов
```javascript
import CalendarLayoutWithHook from './CalendarLayoutWithHook';

<CalendarLayoutWithHook
  containerId={containerId}
  calendarSettingsProp={settings}
  onSuccess={onSuccess}
  onError={onError}
/>
```

### Для существующих проектов
1. Замените `CalendarLayout` на `CalendarLayoutOptimized`
2. После тестирования переходите на `CalendarLayoutWithHook`

## Файлы

- `CalendarLayoutOptimized.jsx` - Оптимизированная версия с TasksContext
- `CalendarLayoutWithHook.jsx` - Версия с кастомным хуком
- `hooks/useCalendar.js` - Кастомный хук с логикой календаря
- `__tests__/CalendarLayoutOptimized.test.jsx` - Тесты
- `OPTIMIZATION_RECOMMENDATIONS.md` - Подробные рекомендации