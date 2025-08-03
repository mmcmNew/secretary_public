# Использование результатов серверных тестов в клиентских тестах

## Обзор

Этот документ описывает, как использовать результаты серверных тестов в клиентских тестах для ToDo-приложения. Результаты серверных тестов сохраняются в формате JSON и могут быть использованы для имитации API-вызовов в клиентских тестах.

## Структура файла результатов

Файл результатов тестов содержит информацию о каждом тестовом случае, включая:

1. Маршрут API
2. HTTP-метод
3. Входные данные (запрос)
4. Ожидаемый ответ
5. Результаты проверок

## Пример использования в клиентских тестах

### Импорт результатов тестов

```javascript
// Импорт результатов тестов
import testResults from '../server/app/tests/test_results.json';

// Получение данных для конкретного теста
const getTestData = (testName) => {
  const testCase = testResults.test_cases.find(tc => tc.name === testName);
  if (!testCase) {
    throw new Error(`Тест "${testName}" не найден в результатах`);
  }
  return testCase;
};
```

### Пример теста с использованием результатов серверных тестов

```javascript
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import ToDoLayoutUniversal from '../src/components/ToDo/ToDoLayoutUniversal';
import testResults from '../server/app/tests/test_results.json';

// Mock для API-вызовов
jest.mock('../src/components/ToDo/API/apiHandlers', () => {
  const originalModule = jest.requireActual('../src/components/ToDo/API/apiHandlers');
  
  return {
    ...originalModule,
    fetchLists: jest.fn(() => {
      // Получаем данные из результатов серверных тестов
      const testData = testResults.test_cases.find(tc => tc.name === 'test_get_lists_success');
      if (testData && testData.response.status === 200) {
        return Promise.resolve(testData.response.body);
      }
      return Promise.reject(new Error('Failed to fetch lists'));
    }),
    addTask: jest.fn((taskData) => {
      // Получаем данные из результатов серверных тестов
      const testData = testResults.test_cases.find(tc => tc.name === 'test_add_task_success');
      if (testData && testData.response.status === 200) {
        return Promise.resolve({
          ...testData.response.body,
          task: {
            ...testData.response.body.task,
            ...taskData
          }
        });
      }
      return Promise.reject(new Error('Failed to add task'));
    })
  };
});

describe('ToDoLayoutUniversal with server test data', () => {
  test('renders lists from server test data', async () => {
    const { getByText } = render(<ToDoLayoutUniversal />);
    
    // Проверяем, что списки из результатов серверных тестов отображаются
    const testData = testResults.test_cases.find(tc => tc.name === 'test_get_lists_success');
    if (testData && testData.response.body.lists) {
      for (const list of testData.response.body.lists) {
        await waitFor(() => {
          expect(getByText(list.title)).toBeInTheDocument();
        });
      }
    }
  });

  test('adds task using server test data', async () => {
    const { getByPlaceholderText, getByText } = render(<ToDoLayoutUniversal />);
    
    // Создаем задачу
    const input = getByPlaceholderText('Добавить задачу');
    const taskTitle = 'Новая задача из тестовых данных';
    
    // Имитируем ввод и отправку задачи
    fireEvent.change(input, { target: { value: taskTitle } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    // Проверяем, что задача добавлена с использованием данных из серверных тестов
    const testData = testResults.test_cases.find(tc => tc.name === 'test_add_task_success');
    if (testData) {
      await waitFor(() => {
        expect(getByText(taskTitle)).toBeInTheDocument();
      });
    }
  });
});
```

## Сопоставление маршрутов API с тестовыми данными

### Получение списков (/tasks/get_lists)

```javascript
// Использование результатов теста test_get_lists_success
const listsTestData = testResults.test_cases.find(
  tc => tc.name === 'test_get_lists_success' && tc.route === '/tasks/get_lists'
);

const mockFetchLists = () => {
  if (listsTestData && listsTestData.status === 'passed') {
    return Promise.resolve(listsTestData.response.body);
  }
  return Promise.reject(new Error('Failed to fetch lists'));
};
```

### Добавление задачи (/tasks/add_task)

```javascript
// Использование результатов теста test_add_task_success
const addTaskTestData = testResults.test_cases.find(
  tc => tc.name === 'test_add_task_success' && tc.route === '/tasks/add_task'
);

const mockAddTask = (taskData) => {
  if (addTaskTestData && addTaskTestData.status === 'passed') {
    return Promise.resolve({
      ...addTaskTestData.response.body,
      task: {
        ...addTaskTestData.response.body.task,
        ...taskData
      }
    });
  }
  return Promise.reject(new Error('Failed to add task'));
};
```

### Редактирование задачи (/tasks/edit_task)

```javascript
// Использование результатов теста test_edit_task_success
const editTaskTestData = testResults.test_cases.find(
  tc => tc.name === 'test_edit_task_success' && tc.route === '/tasks/edit_task'
);

const mockEditTask = (taskData) => {
  if (editTaskTestData && editTaskTestData.status === 'passed') {
    return Promise.resolve({
      ...editTaskTestData.response.body,
      task: {
        ...editTaskTestData.response.body.task,
        ...taskData
      }
    });
  }
  return Promise.reject(new Error('Failed to edit task'));
};
```

## Обработка различных сценариев

### Успешные ответы

```javascript
const handleSuccessResponse = (testName) => {
  const testData = testResults.test_cases.find(tc => tc.name === testName);
  if (testData && testData.status === 'passed') {
    return Promise.resolve(testData.response.body);
  }
  return Promise.reject(new Error(`Test ${testName} failed`));
};
```

### Ошибки и исключения

```javascript
const handleErrorResponse = (testName) => {
  const testData = testResults.test_cases.find(tc => tc.name === testName);
  if (testData && testData.status === 'failed') {
    return Promise.reject(new Error(testData.error || 'API call failed'));
  }
  return Promise.reject(new Error(`Test ${testName} did not fail as expected`));
};
```

## Рекомендации по использованию

1. **Синхронизация данных**: Убедитесь, что данные в результатах тестов соответствуют ожидаемой структуре в клиентском приложении.

2. **Обработка версий**: При изменении API убедитесь, что формат результатов тестов также обновлен.

3. **Мокирование зависимостей**: Используйте результаты тестов для мокирования внешних зависимостей в клиентских тестах.

4. **Проверка статуса тестов**: Всегда проверяйте статус тестов перед использованием их результатов.

5. **Документирование**: Документируйте, какие тесты используются в клиентских тестах и для каких целей.

## Пример полного теста компонента

```javascript
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import TasksList from '../src/components/ToDo/TasksList';
import testResults from '../server/app/tests/test_results.json';

// Mock контекста задач
const mockTasksContext = {
  tasks: [],
  selectedListId: '1',
  fetchTasks: jest.fn(),
  addTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn()
};

jest.mock('../src/components/ToDo/hooks/useTasks', () => () => mockTasksContext);

describe('TasksList with server test data', () => {
  beforeEach(() => {
    // Сброс моков перед каждым тестом
    mockTasksContext.fetchTasks.mockClear();
    mockTasksContext.addTask.mockClear();
  });

  test('displays tasks from server test data', async () => {
    // Получаем тестовые данные для получения задач
    const getTasksTest = testResults.test_cases.find(
      tc => tc.name === 'test_get_tasks_success' && tc.route === '/tasks/get_tasks'
    );

    if (getTasksTest && getTasksTest.status === 'passed') {
      // Настраиваем мок для возврата тестовых данных
      mockTasksContext.fetchTasks.mockImplementation(() => {
        mockTasksContext.tasks = getTasksTest.response.body.tasks;
        return Promise.resolve(getTasksTest.response.body);
      });

      const { getByText } = render(<TasksList />);

      // Вызываем загрузку задач
      await waitFor(() => {
        expect(mockTasksContext.fetchTasks).toHaveBeenCalledWith('1');
      });

      // Проверяем отображение задач из тестовых данных
      for (const task of getTasksTest.response.body.tasks) {
        await waitFor(() => {
          expect(getByText(task.title)).toBeInTheDocument();
        });
      }
    }
  });

  test('adds new task and updates list', async () => {
    // Получаем тестовые данные для добавления задачи
    const addTaskTest = testResults.test_cases.find(
      tc => tc.name === 'test_add_task_success' && tc.route === '/tasks/add_task'
    );

    if (addTaskTest && addTaskTest.status === 'passed') {
      // Настраиваем мок для добавления задачи
      mockTasksContext.addTask.mockImplementation((taskData) => {
        const newTask = {
          ...addTaskTest.response.body.task,
          ...taskData,
          id: Date.now() // Уникальный ID для новой задачи
        };
        mockTasksContext.tasks = [...mockTasksContext.tasks, newTask];
        return Promise.resolve(addTaskTest.response.body);
      });

      const { getByPlaceholderText, getByText } = render(<TasksList />);
      
      // Создаем новую задачу
      const input = getByPlaceholderText('Добавить задачу');
      const taskTitle = 'Новая задача';
      
      fireEvent.change(input, { target: { value: taskTitle } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      
      // Проверяем, что задача добавлена
      await waitFor(() => {
        expect(mockTasksContext.addTask).toHaveBeenCalled();
      });
      
      // Проверяем отображение новой задачи
      await waitFor(() => {
        expect(getByText(taskTitle)).toBeInTheDocument();
      });
    }
  });
});
```

Этот подход позволяет эффективно использовать результаты серверных тестов для создания более точных и надежных клиентских тестов, обеспечивая согласованность между серверной и клиентской частями приложения.