import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { tasksApi } from '../../store/tasksSlice';
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
});