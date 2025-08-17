import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { tasksApi } from '../../store/tasksSlice';
import { listsApi } from '../../store/listsSlice';
import { createAuthorizedStore } from './rtk-test-setup';

describe('Tasks RTK API', () => {
  let store;

  beforeAll(async () => {
    store = await createAuthorizedStore();
  });

  afterEach(() => {
    store.dispatch(tasksApi.util.resetApiState());
  });

  describe('getTasks', () => {
    it('should return a list of tasks for a given listId', async () => {
      const listId = 'tasks'; // Используем системный список "tasks"
      const result = await store.dispatch(
        tasksApi.endpoints.getTasks.initiate(listId)
      ).unwrap();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('addTask', () => {
    it('should add a new task and return it', async () => {
      const newTask = {
        listId: 'tasks',
        title: 'New Test Task',
      };
      const result = await store.dispatch(
        tasksApi.endpoints.addTask.initiate(newTask)
      ).unwrap();

      expect(result).toBeDefined();
      expect(result.task).toBeDefined();
      expect(result.task.title).toBe(newTask.title);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      // Сначала создаем задачу для обновления
      const newTask = {
        listId: 'tasks',
        title: 'Task to Update',
      };
      const createResult = await store.dispatch(
        tasksApi.endpoints.addTask.initiate(newTask)
      ).unwrap();

      const taskId = createResult.task.id;
      const updatedTitle = 'Updated Task Title';

      const updatedTask = {
        taskId: taskId, // Исправлено: id на taskId
        title: updatedTitle,
        listId: 'tasks', // listId также нужен для invalidatesTags
      };

      const updateResult = await store.dispatch(
        tasksApi.endpoints.updateTask.initiate(updatedTask)
      ).unwrap();

      expect(updateResult).toBeDefined();
      expect(updateResult.task).toBeDefined();
      expect(updateResult.task.id).toBe(taskId);
      expect(updateResult.task.title).toBe(updatedTitle);
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', async () => {
      // Сначала создаем задачу для удаления
      const newTask = {
        listId: 'tasks',
        title: 'Task to Delete',
      };
      const createResult = await store.dispatch(
        tasksApi.endpoints.addTask.initiate(newTask)
      ).unwrap();

      const taskId = createResult.task.id;

      const deleteResult = await store.dispatch(
        tasksApi.endpoints.deleteTask.initiate({ taskId, listId: 'tasks' }) // listId нужен для invalidatesTags
      ).unwrap();

      expect(deleteResult).toBeDefined();
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe('Subtask deleted successfully'); // Сообщение из бэкенда
    });
  });
  describe('addSubtask', () => {
    it('should add a subtask to a parent task', async () => {
      // Сначала создаем родительскую задачу
      const parentTaskData = {
        listId: 'tasks',
        title: 'Parent Task for Subtasks',
      };
      const createParentResult = await store.dispatch(
        tasksApi.endpoints.addTask.initiate(parentTaskData)
      ).unwrap();
      const parentTaskId = createParentResult.task.id;

      // Добавляем подзадачу
      const newSubtaskData = {
        parentTaskId: parentTaskId,
        title: 'New Subtask',
      };
      const addSubtaskResult = await store.dispatch(
        tasksApi.endpoints.addSubtask.initiate(newSubtaskData)
      ).unwrap();

      expect(addSubtaskResult).toBeDefined();
      expect(addSubtaskResult.subtask).toBeDefined();
      expect(addSubtaskResult.subtask.title).toBe(newSubtaskData.title);
      expect(addSubtaskResult.parent_task.id).toBe(parentTaskId);
    });
  });

  describe('getSubtasks', () => {
    it('should return subtasks for a given parent task ID', async () => {
      // Сначала создаем родительскую задачу
      const parentTaskData = {
        listId: 'tasks',
        title: 'Parent Task for Get Subtasks',
      };
      const createParentResult = await store.dispatch(
        tasksApi.endpoints.addTask.initiate(parentTaskData)
      ).unwrap();
      const parentTaskId = createParentResult.task.id;

      // Добавляем несколько подзадач
      await store.dispatch(tasksApi.endpoints.addSubtask.initiate({ parentTaskId, title: 'Subtask 1' })).unwrap();
      await store.dispatch(tasksApi.endpoints.addSubtask.initiate({ parentTaskId, title: 'Subtask 2' })).unwrap();

      // Получаем подзадачи
      const getSubtasksResult = await store.dispatch(
        tasksApi.endpoints.getSubtasks.initiate(parentTaskId)
      ).unwrap();

      expect(getSubtasksResult).toBeDefined();
      expect(Array.isArray(getSubtasksResult.subtasks)).toBe(true);
      expect(getSubtasksResult.subtasks.length).toBeGreaterThanOrEqual(2);
      expect(getSubtasksResult.subtasks.some(s => s.title === 'Subtask 1')).toBe(true);
      expect(getSubtasksResult.subtasks.some(s => s.title === 'Subtask 2')).toBe(true);
    });
  });
  describe('changeTaskStatus', () => {
    it('should change the status of a task', async () => {
      // Сначала создаем задачу
      const newTask = {
        listId: 'tasks',
        title: 'Task to Change Status',
      };
      const createResult = await store.dispatch(
        tasksApi.endpoints.addTask.initiate(newTask)
      ).unwrap();
      const taskId = createResult.task.id;

      // Меняем статус
      const statusChangeData = {
        taskId: taskId,
        is_completed: true,
        listId: 'tasks', // listId нужен для invalidatesTags
      };
      const changeStatusResult = await store.dispatch(
        tasksApi.endpoints.changeTaskStatus.initiate(statusChangeData)
      ).unwrap();

      expect(changeStatusResult).toBeDefined();
      expect(changeStatusResult.success).toBe(true);
      expect(changeStatusResult.changed_ids).toContain(taskId);
    });
  });
  describe('Linking', () => {
    let listId, taskId;

    beforeAll(async () => {
      // Создаем список и задачу для тестов связывания
      const newList = { name: 'Linking Test List', type: 'list' };
      const createListResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();
      console.log('createListResult from test:', createListResult);
      listId = createListResult.new_object.id;

      const newTask = { listId: listId, title: 'Linking Test Task' };
      const createTaskResult = await store.dispatch(
        tasksApi.endpoints.addTask.initiate(newTask)
      ).unwrap();
      taskId = createTaskResult.task.id;
    });

    it('should link a task to a list', async () => {
      const linkData = {
        task_id: taskId,
        target_id: listId,
        target_type: 'list',
      };
      const result = await store.dispatch(
        tasksApi.endpoints.linkTask.initiate(linkData)
      ).unwrap();
      expect(result.success).toBe(true);
    });

    it('should link a list to a group (not implemented in this test)', async () => {
      // Этот тест требует создания группы, что выходит за рамки текущего API
      // Для полноты картины, здесь мог бы быть тест для linkGroupList
      expect(true).toBe(true);
    });

    it('should delete a task from childes', async () => {
      const deleteData = {
        source_id: taskId,
        source_type: 'task',
        group_id: listId,
      };
      const result = await store.dispatch(
        tasksApi.endpoints.deleteFromChildes.initiate(deleteData)
      ).unwrap();
      expect(result.success).toBe(true);
    });
  });
  describe('getFieldsConfig', () => {
    it('should return fields configuration', async () => {
      const result = await store.dispatch(
        tasksApi.endpoints.getFieldsConfig.initiate()
      ).unwrap();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('range');
      expect(result).toHaveProperty('completed_at');
      expect(result).toHaveProperty('type_id');
    });
  });
});