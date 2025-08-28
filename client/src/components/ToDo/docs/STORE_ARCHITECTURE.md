# Правильная организация Redux Store и RTK Query

## 🎯 **Принципы организации**

### **1. Единственный источник истины для данных**
- **RTK Query** = управление API данными (загрузка, кеширование, синхронизация)
- **Redux Store** = только UI состояние и глобальное состояние приложения
- **НЕТ дублирования** данных между RTK Query и Redux

### **2. Разделение ответственности**
- **RTK Query** = данные с сервера (задачи, списки, пользователи)
- **Redux** = состояние интерфейса (выбранные элементы, открытые панели, настройки)

### **3. Автоматическая синхронизация**
- RTK Query автоматически обновляет Redux store
- Все компоненты автоматически перерендериваются при изменении данных

### **4. Умное версионирование** 🆕
- **WebSocket** = мгновенные уведомления об изменениях
- **Автоматическая проверка** = при каждом запросе сравниваем версии
- **Fallback механизм** = если WebSocket не работает, данные все равно синхронизируются

## 🏗️ **Структура Store**

### **Текущая структура (ПРАВИЛЬНО):**
```javascript
// store/store.js
{
  // ✅ RTK Query API (единственный источник данных)
  [apiSlice.reducerPath]: apiSlice.reducer,    // Задачи, списки, аутентификация
  
  // ✅ Redux (только UI состояние + версионирование)
  tasks: tasksSlice,                           // ТОЛЬКО version для проверки актуальности
  todoLayout: todoLayoutSlice,                 // selectedListId, selectedTaskId
  auth: authSlice,                             // user, isAuthenticated
}
```

### **Правильная структура:**
```javascript
// store/store.js
export const store = configureStore({
  reducer: {
    // RTK Query API (единственный источник данных)
    [apiSlice.reducerPath]: apiSlice.reducer,    // Задачи, списки, аутентификация
    
    // Redux (только UI состояние + версионирование)
    tasks: tasksSlice,                           // ТОЛЬКО version для проверки актуальности
    todoLayout: todoLayoutSlice,                 // selectedListId, selectedTaskId, expandedTasks
    auth: authSlice,                             // user, isAuthenticated, permissions
    ui: uiSlice,                                 // theme, sidebarCollapsed, notifications
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
```

## 🔄 **Система версионирования**

### **1. Двойная защита синхронизации**

```javascript
// ✅ WebSocket: мгновенные уведомления
socket.on('data_updated', (data) => {
  if (data.tasksVersion > currentTasksVersion) {
    dispatch(setTasksVersion(data.tasksVersion));
    dispatch(tasksApi.util.invalidateTags(['Task']));
  }
});

// ✅ Автоматическая проверка: при каждом запросе
getTasks: builder.query({
  query: (listId) => `/api/tasks/get_tasks?list_id=${listId}`,
  async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
    const { data } = await queryFulfilled;
    // ✅ Сравниваем версии сервера и клиента
    if (data.version !== getState().tasks.version) {
      console.log(`🔄 Версия обновлена: ${getState().tasks.version} → ${data.version}`);
      dispatch(setTasksVersion(data.version));
      dispatch(tasksApi.util.invalidateTags(['Task']));
    }
  },
})
```

### **2. Как работает версионирование**

```javascript
// 1. Клиент запрашивает данные
const { data: tasks } = useGetTasksQuery(selectedListId);

// 2. RTK Query отправляет запрос на сервер
GET /api/tasks/get_tasks?list_id=123

// 3. Сервер возвращает данные + версию
{
  "tasks": [...],
  "version": 42  // ✅ Версия данных на сервере
}

// 4. RTK Query сравнивает версии
if (serverVersion !== clientVersion) {
  // ✅ Обновляет локальную версию
  dispatch(setTasksVersion(serverVersion));
  // ✅ Инвалидирует кэш для перезагрузки
  dispatch(tasksApi.util.invalidateTags(['Task']));
}

// 5. Все компоненты автоматически перерендериваются
```

### **3. Преимущества двойной защиты**

- ✅ **WebSocket работает** = мгновенная синхронизация
- ✅ **WebSocket не работает** = автоматическая проверка при запросах
- ✅ **Нет лишних запросов** = проверка только при реальных запросах
- ✅ **Автоматическое восстановление** = если данные устарели

## 🔧 **Этапы реорганизации Store**

### **Этап 1: Убрать дублирующие slice** ✅ ВЫПОЛНЕНО
```javascript
// ❌ УБРАНО: дублирование данных в tasksSlice
// ✅ ОСТАВЛЕНО: только версионирование
export const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    version: 0,  // ✅ ТОЛЬКО версия для проверки актуальности
  },
  reducers: {
    setTasksVersion: (state, action) => {
      state.version = action.payload;
    },
  },
});
```

### **Этап 2: Упростить todoLayoutSlice**
```javascript
// todoLayoutSlice.js - ТОЛЬКО UI состояние
const initialState = {
  // ✅ ТОЛЬКО ID и UI флаги
  selectedListId: null,
  selectedTaskId: null,
  expandedTasks: {},
  openGroups: {},
  contextTarget: { id: null, menuType: null },
  
  // ❌ НЕ храним объекты
  // selectedList: null,     // УБРАТЬ!
  // selectedTask: null,     // УБРАТЬ!
};
```

### **Этап 3: Обновить компоненты**
```javascript
// ToDoTasksPanel.jsx
function ToDoTasksPanel() {
  const { selectedListId } = useSelector((state) => state.todoLayout);
  
  // ✅ ЕДИНЫЙ ИСТОЧНИК: RTK Query
  const { data: tasks = [] } = useGetTasksQuery(selectedListId, {
    skip: !selectedListId,
  });
  
  // ✅ ПОЛУЧАЕМ selectedList по ID
  const { data: listsData } = useGetListsQuery();
  const selectedList = useMemo(() => {
    if (!selectedListId || !listsData) return null;
    return listsData.lists.find(l => l.id === selectedListId) || 
           listsData.default_lists.find(l => l.id === selectedListId);
  }, [selectedListId, listsData]);
  
  return <TasksList tasks={tasks} selectedList={selectedList} />;
}
```

## 📊 **Потоки данных**

### **1. Загрузка данных:**
```
1. Компонент вызывает useGetTasksQuery(selectedListId)
2. RTK Query делает API запрос
3. RTK Query автоматически обновляет store[apiSlice.reducerPath]
4. Все компоненты с useGetTasksQuery перерендериваются
5. ✅ АВТОМАТИЧЕСКАЯ проверка версии при каждом запросе
```

### **2. Обновление данных:**
```
1. Компонент вызывает updateTask mutation
2. RTK Query отправляет API запрос
3. RTK Query автоматически обновляет store[apiSlice.reducerPath]
4. Все компоненты с useGetTasksQuery перерендериваются
```

### **3. UI состояние:**
```
1. Компонент вызывает setSelectedListId(123)
2. Redux обновляет state.todoLayout.selectedListId
3. Все компоненты с useSelector перерендериваются
4. Компоненты получают новые данные через RTK Query
```

### **4. Синхронизация версий:** 🆕
```
1. WebSocket получает уведомление о новой версии
2. Обновляется state.tasks.version
3. Инвалидируется кэш задач
4. Все компоненты перерендериваются с новыми данными
5. ✅ Fallback: при следующем запросе проверяется версия
```

## 🎯 **Преимущества правильной архитектуры**

### **1. Нет дублирования данных**
- Данные хранятся только в RTK Query
- Redux содержит только UI состояние + версионирование

### **2. Автоматическая синхронизация**
- RTK Query автоматически обновляет store
- Все компоненты автоматически перерендериваются

### **3. Умное версионирование** 🆕
- WebSocket для мгновенных обновлений
- Автоматическая проверка при каждом запросе
- Двойная защита от рассинхронизации

### **4. Простота отладки**
- Один источник данных для API
- Четкое разделение ответственности
- Понятная система версионирования

### **5. Производительность**
- RTK Query оптимизирует кеширование
- Автоматическая инвалидация кеша
- Нет лишних запросов

## 🚨 **Что НЕ делать**

### **❌ НЕ дублируйте данные:**
```javascript
// ❌ ПЛОХО: данные в двух местах
const tasks = useSelector((state) => state.tasks.byId);
const { data: tasks } = useGetTasksQuery(selectedListId);

// ✅ ХОРОШО: только RTK Query
const { data: tasks = [] } = useGetTasksQuery(selectedListId);
```

### **❌ НЕ храните объекты в UI slice:**
```javascript
// ❌ ПЛОХО: дублирование объектов
{
  selectedListId: 123,
  selectedList: { id: 123, title: "Мой список", ... } // УБРАТЬ!
}

// ✅ ХОРОШО: только ID
{
  selectedListId: 123,
  // selectedList убран!
}
```

### **❌ НЕ обращайтесь к store напрямую:**
```javascript
// ❌ ПЛОХО: прямое обращение к store
const task = useSelector((state) => state.tasks.byId[selectedTaskId]);

// ✅ ХОРОШО: через RTK Query
const { data: tasks } = useGetTasksQuery(selectedListId);
const task = tasks.find(t => t.id === selectedTaskId);
```

### **❌ НЕ игнорируйте версионирование:** 🆕
```javascript
// ❌ ПЛОХО: только WebSocket
socket.on('data_updated', () => {
  dispatch(tasksApi.util.invalidateTags(['Task']));
});

// ✅ ХОРОШО: двойная защита
// 1. WebSocket для мгновенных обновлений
// 2. Автоматическая проверка версии при запросах
```

## 🔄 **Порядок реорганизации**

1. ✅ **Убрать дублирующие slice** - ВЫПОЛНЕНО
2. **Упростить** `todoLayoutSlice` (только UI состояние)
3. **Обновить** компоненты для использования RTK Query
4. **Протестировать** синхронизацию данных
5. **Оптимизировать** производительность

## 📝 **Итоговая структура**

```javascript
// store/store.js
export const store = configureStore({
  reducer: {
    // RTK Query API (единственный источник данных)
    [apiSlice.reducerPath]: apiSlice.reducer,    // Задачи, списки, аутентификация
    
    // Redux (только UI состояние + версионирование)
    tasks: tasksSlice,                           // ТОЛЬКО version для проверки актуальности
    todoLayout: todoLayoutSlice,                 // selectedListId, selectedTaskId, expandedTasks
    auth: authSlice,                             // user, isAuthenticated, permissions
    ui: uiSlice,                                 // theme, sidebarCollapsed, notifications
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
```

## 🎉 **Результат**

После реорганизации у вас будет:
- ✅ Единственный источник истины для данных (RTK Query)
- ✅ Четкое разделение ответственности
- ✅ Автоматическая синхронизация
- ✅ Умное версионирование с двойной защитой 🆕
- ✅ Простота отладки и поддержки
- ✅ Оптимизированная производительность
- ✅ НЕТ дублирования данных
- ✅ Автоматическое восстановление при рассинхронизации 🆕
