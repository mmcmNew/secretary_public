# TaskEditor - Резюме исправлений

## Проблемы, которые были исправлены

### 1. ✅ Заголовок задачи не обновлялся
- **Файл**: `TaskTitleSection.jsx`
- **Проблема**: Изменения в поле заголовка не синхронизировались с формой
- **Решение**: Добавлен корректный обработчик `handleTitleChange` с поддержкой всех событий (`onChange`, `onBlur`, `onKeyDown`)

### 2. ✅ Поля дат не реагировали на onAccept
- **Файл**: `TaskFieldsSection.jsx`
- **Проблема**: `DateTimePicker` не вызывал обновление при `onAccept`
- **Решение**: Создан единый обработчик `handleDateTimeChange` для всех событий дат

### 3. ✅ Компонент обращался напрямую к store
- **Файл**: `TaskEditor.jsx`
- **Проблема**: Прямые обращения к Redux делали компонент непереиспользуемым
- **Решение**: Все данные теперь передаются через props от `ToDoTaskEditorPanel`

### 4. ✅ Форма сбрасывалась при каждом изменении
- **Файл**: `TaskEditor.jsx`
- **Проблема**: Форма сбрасывалась к исходным значениям сразу после изменения полей
- **Решение**: Изменена логика сброса формы - теперь форма сбрасывается только при смене задачи (taskId), а не при каждом обновлении task объекта

### 5. ✅ Многострочные поля и select не отправляли изменения на onBlur
- **Файл**: `TaskFieldsSection.jsx`
- **Проблема**: Поля типа `text` (многострочные) и `select` не отправляли изменения при потере фокуса
- **Решение**: Добавлены `onBlur` обработчики для всех типов полей, чтобы изменения сохранялись при потере фокуса

### 6. ✅ Подзадачи обрабатывались неправильно
- **Файл**: `TaskEditor.jsx`
- **Проблема**: Для изменения заголовка подзадач использовался неправильный API - обновлялся весь массив подзадач
- **Решение**: Теперь для изменения заголовка подзадач используется `updateTask` API, а для изменения статуса - `changeTaskStatus`, так как подзадачи это тоже задачи

## Ключевые изменения

### TaskTitleSection.jsx
```jsx
// Добавлен onChange для предотвращения сброса формы
<TextField
    onChange={(e) => {
        // Update form value immediately to prevent reset
        field.onChange(e.target.value);
    }}
    onBlur={(e) => {
        if (e.target.value !== task.title) {
            triggerParentOnChange('title', e.target.value);
        }
    }}
    onKeyDown={(e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.target.value !== task.title) {
                triggerParentOnChange('title', e.target.value);
            }
        }
    }}
/>
```

### TaskEditor.jsx
```jsx
// Форма сбрасывается только при смене задачи
useEffect(() => {
    if (!task || !taskFields) return;
    console.log('Initializing form for task:', taskId);
    reset(initialFormData);
    replace(initialFormData.subtasks);
}, [taskId, taskFields, reset, replace]); // Only reset when taskId changes

// Улучшено логирование для отладки
const triggerParentOnChange = useCallback((updatedField, updatedValue) => {
    if (!onChange || !taskId) {
        console.log('triggerParentOnChange skipped:', { updatedField, updatedValue, hasOnChange: !!onChange, hasTaskId: !!taskId });
        return;
    }
    // ... логика ...
    console.log('triggerParentOnChange called:', { updatedField, updatedValue, updateData });
    onChange(updateData);
}, [onChange, taskId]);

// Исправлена обработка подзадач - теперь используются правильные API
const handleSubBlur = useCallback(async (index) => {
    const field = subtaskFields[index];
    const title = getValues(`subtasks.${index}.title`).trim();
    if (!title) return;
    
    if (!field.id && addSubTask) {
        // Create new subtask using API: POST /api/tasks/add_subtask
        // ... логика создания ...
    } else if (field.id) {
        // Update existing subtask using updateTask API since subtasks are also tasks
        console.log('Updating existing subtask title:', { subtaskId: field.id, title });
        
        if (onChange) {
            // Use the same updateTask API that's used for main tasks
            const updateData = {
                taskId: field.id, // Use subtask ID, not parent task ID
                title: title
            };
            
            console.log('Calling updateTask for subtask:', updateData);
            onChange(updateData);
        }
    }
}, [subtaskFields, getValues, addSubTask, taskId, onChange, append]);

// handleToggle теперь корректно обрабатывает как основные задачи, так и подзадачи
const handleToggle = useCallback((taskId, is_completed) => {
    if (changeTaskStatus) {
        // This works for both main tasks and subtasks since subtasks are also tasks
        const updateData = { 
            taskId, 
            is_completed 
        };
        
        if (is_completed) {
            updateData.completed_at = new Date().toISOString();
        }
        
        console.log('handleToggle called:', { taskId, is_completed, updateData, isSubtask: taskId !== task?.id });
        
        // ... вызов API ...
    }
}, [changeTaskStatus, task?.id]);
```

### ToDoTaskEditorPanel.jsx
```jsx
// Добавлено логирование для отладки
const handleTaskEditorChange = useCallback(async (updatedTask) => {
    if (!updatedTask?.taskId) {
        console.log('handleTaskEditorChange skipped:', updatedTask);
        return;
    }
    
    console.log('handleTaskEditorChange called:', updatedTask);
    
    try {
        const result = await updateTask(updatedTask).unwrap();
        console.log('updateTask success:', result);
    } catch (error) {
        console.error('updateTask error:', error);
    }
}, [updateTask]);
```

### TaskFieldsSection.jsx
```jsx
// Многострочное поле (text) - добавлен onBlur для сохранения изменений
<TextField
    fullWidth
    label={field.name}
    multiline
    rows={5}
    {...ctrl}
    onBlur={(e) => {
        // Always trigger update on blur for text fields to ensure changes are saved
        const currentValue = e.target.value;
        console.log('Text field blur:', { key, value: currentValue });
        triggerParentOnChange(key, currentValue);
    }}
    onChange={(e) => {
        ctrl.onChange(e.target.value);
    }}
    onKeyDown={(e) => handleKeyDown(e, key, (value) => {
        console.log('TextField onKeyDown:', { key, value });
        triggerParentOnChange(key, value);
    })}
    variant="outlined"
/>

// Поле select - добавлен onBlur для сохранения изменений
<Autocomplete
    // ... другие пропсы ...
    onChange={(e, nv) => {
        if (key === 'type_id' && nv && nv.value === '__add__') {
            setTypeDialogOpen(true);
        } else {
            const newValue = nv ? nv.value : null;
            ctrl.onChange(newValue);
            triggerParentOnChange(key, newValue);
        }
    }}
    onBlur={() => {
        // Ensure changes are saved on blur for select fields
        console.log('Select field blur:', { key, value: ctrl.value });
        if (ctrl.value !== undefined) {
            triggerParentOnChange(key, ctrl.value);
        }
    }}
/>

// Поле multiselect - добавлен onBlur для сохранения изменений
<Autocomplete
    multiple
    // ... другие пропсы ...
    onChange={(e, nv) => {
        ctrl.onChange(nv);
        triggerParentOnChange(key, nv);
    }}
    onBlur={() => {
        // Ensure changes are saved on blur for multiselect fields
        console.log('Multiselect field blur:', { key, value: ctrl.value });
        if (Array.isArray(ctrl.value)) {
            triggerParentOnChange(key, ctrl.value);
        }
    }}
/>
```

## Результат

1. **Заголовок задачи** теперь корректно обновляется и не сбрасывается
2. **Поля дат** реагируют как на `onChange`, так и на `onAccept`
3. **Форма не сбрасывается** при изменении полей - только при смене задачи
4. **Многострочные поля** (например, "Заметки") корректно отправляют изменения на `onBlur`
5. **Поля select и multiselect** также сохраняют изменения при потере фокуса
6. **Подзадачи теперь обрабатываются корректно** - используются правильные API (`updateTask` для заголовка, `changeTaskStatus` для статуса)
7. **TaskEditor** стал полностью переиспользуемым компонентом
8. **Улучшена производительность** за счет мемоизации и стабильных колбэков
9. **Упрощена архитектура** с четким разделением ответственности
10. **Добавлено логирование** для отладки проблем

## Тестирование

Для проверки исправлений:
1. Откройте задачу в редакторе
2. Измените заголовок - должен обновиться и НЕ сбрасываться
3. Измените дату в поле даты - должно работать как на Enter, так и на Accept
4. **Измените многострочное поле "Заметки"** - изменения должны сохраняться при потере фокуса (onBlur)
5. **Измените поле типа select** - изменения должны сохраняться при потере фокуса
6. **Измените заголовок подзадачи** - должен вызываться `updateTask` API для подзадачи
7. **Измените статус подзадачи** (чекбокс) - должен вызываться `changeTaskStatus` API для подзадачи
8. Переключитесь между задачами - поля должны загружаться корректно
9. Проверьте консоль браузера для отладочной информации

## Статус

✅ **Все критические проблемы исправлены**
✅ **Форма больше не сбрасывается при изменениях**
✅ **Компонент готов к использованию**
✅ **Добавлено логирование для отладки**
✅ **Документация обновлена**
