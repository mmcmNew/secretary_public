# Calendar Components

Компоненты для работы с календарем и управления задачами.

## Основные компоненты

### CalendarLayout.jsx ⭐ (Рекомендуемый)
Оптимизированный основной компонент календаря с использованием кастомного хука useCalendar.

**Особенности:**
- Использует состояние из TasksContext
- Все функции реализованы корректно
- Мемоизация для производительности
- Упрощенная архитектура

**Использование:**
```jsx
import CalendarLayout from './components/Calendar/CalendarLayout';

<CalendarLayout
  containerId="calendar-container"
  handleDatesSet={handleDatesSet}
  calendarSettingsProp={settings}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### CalendarWithContext.jsx
Обертка для CalendarLayout с контекстом ошибок.

### CalendarComponent.jsx
Компонент календаря с пропсами для настройки. Используется внутри CalendarLayout.

### Calendar.jsx (Устаревший)
Старая версия календаря. Используется только в TestPage.jsx. 
**Рекомендуется заменить на CalendarLayout.**

## Диалоги

### TaskDialog.jsx
Диалог для редактирования задач и экземпляров повторяющихся задач.

### NewTaskDialog.jsx
Диалог для создания новых задач.

### SettingsDialog.jsx
Диалог настроек календаря.

## Хуки

### hooks/useCalendar.js
Кастомный хук, инкапсулирующий всю логику календаря:
- Управление состоянием
- Обработка событий
- Взаимодействие с API
- Мемоизация данных

## Тесты

### __tests__/CalendarLayout.test.jsx
Тесты для основного компонента CalendarLayout.

## Документация

### docs/
Папка с подробной документацией по оптимизации компонентов.

## Миграция

### С Calendar.jsx на CalendarLayout.jsx

**Было:**
```jsx
import Calendar from './components/Calendar/Calendar';
<Calendar />
```

**Стало:**
```jsx
import CalendarLayout from './components/Calendar/CalendarLayout';
<CalendarLayout
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### Преимущества миграции:
- ✅ Все функции работают корректно
- ✅ Лучшая производительность (меньше ререндеров)
- ✅ Централизованное управление состоянием
- ✅ Легче тестировать и поддерживать
- ✅ Современная архитектура с хуками

## Архитектура

```
CalendarLayout (UI компонент)
    ↓
useCalendar (бизнес-логика)
    ↓
TasksContext (состояние и API)
```

## Зависимости

- @fullcalendar/* - библиотека календаря
- @mui/material - UI компоненты
- React hooks - для состояния и эффектов
- TasksContext - для управления задачами