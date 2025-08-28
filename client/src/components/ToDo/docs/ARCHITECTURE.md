# ToDoLayoutUniversal - Архитектура и потоки данных

## 🏗️ Общая структура

```
ToDoLayoutUniversal (координатор)
├── ToDoListsPanel (списки)
├── ToDoTasksPanel (задачи) 
|   └── TasksList (список задач)
└── ToDoTaskEditorPanel (редактор задачи)
    └── TaskEditor (редактор задачи)
```

## 📊 Источники данных (Store)

### 1. **tasksSlice** - ЕДИНСТВЕННЫЙ источник истины для ВСЕХ задач
```javascript
{
  byId: {},           // ВСЕ задачи по ID (включая подзадачи!)
  allIds: [],         // Все ID задач
  selectedTaskId: null,
  loading: false,
  error: null,
  version: 0
}
```

**Важно**: Подзадачи - это обычные задачи, связанные с родительской задачей через `parent_id` или `childes_order`. НЕ нужен отдельный store для подзадач!

### 2. **todoLayoutSlice** - UI состояние (ТОЛЬКО ID!)
```javascript
{
  selectedListId: null,    // Выбранный список (ID)
  selectedTaskId: null,    // Выбранная задача (ID)
  expandedTasks: {},       // Раскрытые задачи
  openGroups: {}           // Открытые группы
  // ❌ НЕ храним объекты selectedList и selectedTask!
}
```

### 3. **RTK Query API** - автоматическое управление данными
- `useGetTasksQuery(listId)` - загрузка задач списка
- `useGetTasksByIds([id1, id2, ...])` - дозагрузка недостающих задач (включая подзадачи)
- `useUpdateTaskMutation` - обновление задачи (работает для ВСЕХ задач)
- `useChangeTaskStatusMutation` - изменение статуса (работает для ВСЕХ задач)
- `useAddSubtaskMutation` - добавление подзадачи (создает обычную задачу)
- `useDeleteTaskMutation` - удаление задачи

## 🔄 Потоки данных

### **Поток 1: Списки → Задачи**

```
1. ToDoListsPanel
   ↓ (dispatch setSelectedListId)
2. todoLayoutSlice (selectedListId)
   ↓ (useSelector)
3. ToDoTasksPanel
   ↓ (useGetTasksQuery(selectedListId))
4. RTK Query → Store (tasks.byId)
   ↓ (useSelector tasks.byId)
5. ToDoTasksPanel получает tasks
   ↓ (props tasks)
6. TasksList получает tasks через props
```

### **Поток 2: Выбор задачи → Редактор**

```
1. TasksList (клик по задаче)
   ↓ (dispatch setSelectedTaskId)
2. todoLayoutSlice (selectedTaskId)
   ↓ (useSelector)
3. ToDoTaskEditorPanel
   ↓ (useGetTasksQuery(selectedListId) → tasks.find)
4. Получает task объект
   ↓ (props task)
5. TaskEditor получает task через props
```

### **Поток 3: Загрузка подзадач (автоматическая)**

```
1. TaskEditor получает task с childes_order
   ↓ (проверка наличия подзадач в store)
2. Если подзадач нет → useGetTasksByIds(missingIds)
   ↓ (API запрос недостающих задач)
3. RTK Query → Store (tasks.byId) - подзадачи добавляются автоматически
   ↓ (все компоненты перерендериваются)
```

### **Поток 4: Обновление задачи → Обновление UI**

```
1. TaskEditor (изменение поля)
   ↓ (onChange callback)
2. ToDoTaskEditorPanel.handleTaskEditorChange
   ↓ (updateTask mutation)
3. RTK Query API call
   ↓ (ответ сервера)
4. Store автоматически обновляется через extraReducers
   ↓ (tasks.byId обновляется)
5. Все компоненты с useSelector автоматически перерендериваются
```

## 🎯 Роли компонентов

### **ToDoLayoutUniversal** - координатор
- **Задача**: Управление состоянием показа (списки/задачи/редактор)
- **Источник данных**: `useSelector(state => state.todoLayout)` (только ID!)
- **Действия**: Переключение между панелями
- **Дочерние компоненты**: ToDoListsPanel, ToDoTasksPanel, ToDoTaskEditorPanel

### **ToDoListsPanel** - управление списками
- **Задача**: Отображение и управление списками/группами/проектами
- **Источник данных**: `useGetListsQuery()`, `useSelector(state => state.todoLayout.selectedListId)`
- **Действия**: 
  - Выбор списка (`setSelectedListId`)
  - CRUD операции со списками
- **Дочерние компоненты**: ListsList

### **ToDoTasksPanel** - управление задачами
- **Задача**: Отображение списка задач выбранного списка
- **Источник данных**: `useGetTasksQuery(selectedListId)`, `useSelector(state => state.todoLayout.selectedListId)`
- **Действия**:
  - Добавление новой задачи
  - Редактирование названия списка
- **Дочерние компоненты**: TasksList
- **Передача данных**: `tasks` → TasksList через props

### **ToDoTaskEditorPanel** - управление редактором
- **Задача**: Координация редактирования выбранной задачи
- **Источник данных**: `useGetTasksQuery(selectedListId)` → `tasks.find(selectedTaskId)`
- **Действия**:
  - Обработка изменений от TaskEditor
  - Вызов API для обновления
  - Автоматическая дозагрузка недостающих подзадач
- **Дочерние компоненты**: TaskEditor
- **Передача данных**: `task`, `subtasks`, `taskFields` → TaskEditor через props

### **TasksList** - отображение задач (ПЕРЕИСПОЛЬЗУЕМЫЙ)
- **Задача**: Отображение списка задач с поддержкой иерархии
- **Источник данных**: ТОЛЬКО через props от ToDoTasksPanel
- **НЕ ДОЛЖЕН**: Обращаться к store напрямую
- **Действия**: Обработка кликов, drag&drop, контекстное меню
- **Дочерние компоненты**: TaskRow, CompletedTasksSection

### **TaskEditor** - редактирование задачи (ПЕРЕИСПОЛЬЗУЕМЫЙ)
- **Задача**: Форма редактирования задачи и подзадач
- **Источник данных**: ТОЛЬКО через props от ToDoTaskEditorPanel
- **НЕ ДОЛЖЕН**: Обращаться к store напрямую
- **Действия**: Редактирование полей, управление подзадачами
- **Дочерние компоненты**: TaskTitleSection, TaskFieldsSection

## ⚠️ Текущие проблемы архитектуры

### **Проблема 1: Нарушение принципа единственного источника истины**
```javascript
// ❌ ПЛОХО: TasksList получает tasks через props
<TasksList tasks={tasks} />

// ❌ ПЛОХО: TaskEditor получает task напрямую из store
const task = useSelector((state) => state.tasks.byId[selectedTaskId]);
```

**Правильно должно быть:**
```javascript
// ✅ ХОРОШО: Все данные через props
<TasksList tasks={tasks} />
<TaskEditor task={task} subtasks={subtasks} />
```

### **Проблема 2: Дублирование источников данных**
- `ToDoTasksPanel` получает `tasks` из `useGetTasksQuery`
- `ToDoTaskEditorPanel` получает `task` из `useSelector(state.tasks.byId)`
- **Результат**: Возможны расхождения в данных

### **Проблема 3: Дублирование объектов в todoLayoutSlice**
- `todoLayoutSlice` хранит `selectedList` и `selectedTask` объекты
- Но эти объекты уже есть в соответствующих store
- **Результат**: Дублирование данных, возможные расхождения

### **Проблема 4: Неправильная обработка подзадач** 🚨 КРИТИЧНО
- Подзадачи загружаются через `useGetSubtasksQuery` ❌
- Подзадачи НЕ попадают в основной `tasks.byId` store ❌
- **Проблема**: Подзадачи существуют в двух местах, возможны расхождения

**Правильно должно быть:**
```javascript
// ✅ ХОРОШО: Все задачи (включая подзадачи) в tasks.byId
const { data: tasks = [] } = useGetTasksQuery(selectedListId);

// Получаем подзадачи из основного store
const subtasks = useMemo(() => {
  if (!task?.childes_order) return [];
  return task.childes_order
    .map(id => tasks.find(t => t.id === id))
    .filter(Boolean);
}, [task?.childes_order, tasks]);

// Дозагружаем недостающие подзадачи
useEffect(() => {
  if (task?.childes_order && tasks.length > 0) {
    const missingSubtasks = task.childes_order.filter(id => 
      !tasks.find(t => t.id === id)
    );
    if (missingSubtasks.length > 0) {
      getTasksByIds(missingSubtasks); // Автоматически добавляет в tasks.byId
    }
  }
}, [task?.childes_order, tasks, getTasksByIds]);
```

### **Проблема 5: Разрыв синхронизации**
- `TaskEditor` обновляет задачу → API обновляет store
- Но `TasksList` получает данные через props, а не из store
- **Результат**: `TasksList` видит старые данные

### **Проблема 6: Лишние перерендеры**
- Передача новых объектов через props может вызывать лишние рендеры
- Отсутствие оптимизации с `useMemo`, `React.memo`, `useCallback`

## 🔧 План исправления

### **Этап 1: Убрать прямые обращения к store**
- `TaskEditor` должен получать ВСЕ данные через props
- `TasksList` уже получает данные через props (хорошо)

### **Этап 2: Очистить todoLayoutSlice**
- Убрать `selectedList` и `selectedTask` объекты
- Оставить только ID (`selectedListId`, `selectedTaskId`)
- Получать объекты по ID из соответствующих store

### **Этап 3: Централизовать получение данных**
- `ToDoTaskEditorPanel` должен получать `task` из того же источника, что и `ToDoTasksPanel`
- Использовать `useGetTasksQuery` для получения актуальных данных

### **Этап 4: Исправить обработку подзадач** 🚨 ПРИОРИТЕТ
- **УБРАТЬ** `useGetSubtasksQuery` полностью
- **ИСПОЛЬЗОВАТЬ** `useGetTasksByIds` для дозагрузки недостающих подзадач
- **ВСЕ подзадачи** должны быть в `tasks.byId`
- **Подзадачи** - это обычные задачи, обновляются через `updateTask`

### **Этап 5: Оптимизировать рендеринг**
- Использовать `useMemo` для объектов в родительских компонентах
- Добавить `React.memo` для переиспользуемых компонентов
- Использовать `useCallback` для функций

### **Этап 6: Обеспечить синхронизацию**
- После API вызовов данные автоматически обновляются в store
- Все компоненты с `useSelector` автоматически перерендериваются
- Компоненты с props получают обновленные данные от родителя

## 📋 Ключевые принципы для исправления

1. **Единственный источник истины**: Store `tasks.byId` для ВСЕХ задач
2. **Подзадачи = обычные задачи**: Нет отдельного store, нет отдельного API
3. **Поток данных сверху вниз**: Store → Компоненты-прокладки → Переиспользуемые компоненты
4. **Переиспользуемые компоненты**: НЕ обращаются к store, получают данные через props
5. **Компоненты-прокладки**: Получают данные из store и передают вниз
6. **Автоматическая синхронизация**: RTK Query обновляет store, все компоненты перерендериваются
7. **Оптимизация производительности**: Использование `useMemo`, `React.memo`, `useCallback`
8. **Отсутствие дублирования**: В store храним только ID, объекты получаем по ID

## 🔍 Отладочная информация

### **Логи для проверки потоков данных:**
```javascript
// В ToDoTasksPanel
console.log('ToDoTasksPanel tasks:', tasks);

// В ToDoTaskEditorPanel  
console.log('ToDoTaskEditorPanel task:', task);

// В TasksList
console.log('TasksList received tasks:', tasks);

// В TaskEditor
console.log('TaskEditor received task:', task);
```

### **Проверка синхронизации:**
1. Изменить задачу в TaskEditor
2. Проверить, что store обновился
3. Проверить, что TasksList получил обновленные данные
4. Проверить, что UI обновился везде

### **Проверка производительности:**
1. Открыть React DevTools Profiler
2. Изменить задачу
3. Проверить, что перерендерились только нужные компоненты
4. Убедиться в отсутствии лишних рендеров

### **Проверка подзадач:**
1. Открыть задачу с подзадачами
2. Проверить, что подзадачи загрузились в `tasks.byId`
3. Изменить подзадачу
4. Проверить, что изменения применились через `updateTask`
5. Убедиться, что подзадачи обновились везде

## 🚀 Оптимизация рендеринга

### **useMemo для объектов:**
```javascript
const memoizedTask = useMemo(() => task, [task?.id, task?.version]);
const memoizedSubtasks = useMemo(() => subtasks, [
  subtasks?.length, 
  subtasks?.map(s => s.id + s.version).join(',')
]);
```

### **React.memo для компонентов:**
```javascript
const TaskEditor = React.memo(({ task, subtasks, ... }) => {
  // Компонент
}, (prevProps, nextProps) => {
  return (
    prevProps.task?.id === nextProps.task?.id &&
    prevProps.task?.version === nextProps.task?.version &&
    prevProps.subtasks?.length === nextProps.subtasks?.length
  );
});
```

### **useCallback для функций:**
```javascript
const handleTaskChange = useCallback((updatedTask) => {
  // Логика обновления
}, [updateTask]);
```

## 🎯 **Ключевое понимание подзадач**

```javascript
// ❌ НЕПРАВИЛЬНО: Отдельный API для подзадач
const { data: subtasks = [] } = useGetSubtasksQuery(selectedTaskId);

// ✅ ПРАВИЛЬНО: Подзадачи из основного store
const subtasks = useMemo(() => {
  if (!task?.childes_order) return [];
  return task.childes_order
    .map(id => tasks.find(t => t.id === id))
    .filter(Boolean);
}, [task?.childes_order, tasks]);

// ✅ ПРАВИЛЬНО: Дозагрузка недостающих подзадач
const [getTasksByIds] = useLazyGetTasksByIdsQuery();
useEffect(() => {
  if (task?.childes_order && tasks.length > 0) {
    const missingSubtasks = task.childes_order.filter(id => 
      !tasks.find(t => t.id === id)
    );
    if (missingSubtasks.length > 0) {
      getTasksByIds(missingSubtasks); // Автоматически в tasks.byId
    }
  }
}, [task?.childes_order, tasks, getTasksByIds]);
```
