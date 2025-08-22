import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { tasksApi } from '../../store/tasksSlice';
import { listsApi } from '../../store/listsSlice';
import { createAuthorizedStore } from './rtk-test-setup';

describe('Tasks RTK API - Add Task Extended', () => {
  let store;

  beforeAll(async () => {
    store = await createAuthorizedStore();
    // Pre-fetch lists to have them in the store for testing.
    await store.dispatch(listsApi.endpoints.getLists.initiate()).unwrap();
  });

  afterAll(() => {
    store.dispatch(tasksApi.util.resetApiState());
    store.dispatch(listsApi.util.resetApiState());
  });

  it('should increment unfinished_tasks_count for a standard list when a task is added', async () => {
    const listId = 'tasks';
    
    const initialListsData = listsApi.endpoints.getLists.select()(store.getState()).data;
    // console.log('Initial:', initialListsData);
    const initialList = initialListsData?.default_lists?.find(l => l.id === listId);
    const initialCount = initialList ? initialList.unfinished_tasks_count : 0;
    // console.log('Initial List:', initialList, 'unfinished_tasks_count:', initialCount);

    const newTask = { listId, title: 'New Unfinished Task' };
    // console.log('Adding new task:', newTask);
    await store.dispatch(tasksApi.endpoints.addTask.initiate(newTask)).unwrap();

    // After invalidation, RTK Query will refetch getLists. We need to wait for that.
    // The store should be updated automatically. Let's select the data again.
    const finalListsData = listsApi.endpoints.getLists.select()(store.getState()).data;
    const finalList = finalListsData?.default_lists?.find(l => l.id === listId);
    const finalCount = finalList?.unfinished_tasks_count;
    // console.log('Final unfinished_list:', finalList, 'unfinished_tasks_count:', finalCount);

    expect(finalCount).toBe(initialCount + 1);
  });

  it('should update a custom list completely when a task is added to it', async () => {
    const newListData = { name: 'Custom List for Task Test', type: 'list' };
    const createListResult = await store.dispatch(listsApi.endpoints.addObject.initiate(newListData)).unwrap();
    const customListId = createListResult.new_object.id;
    // console.log('Created Custom List:', createListResult.new_object);

    const newTask = { listId: customListId, title: 'Task in Custom List' };
    const addTaskResult = await store.dispatch(tasksApi.endpoints.addTask.initiate(newTask)).unwrap();
    // console.log('Added Task:', addTaskResult.task);

    const returnedList = addTaskResult.task_list;
    expect(returnedList).toBeDefined();
    expect(returnedList.id).toBe(customListId);
    // console.log('Returned List from addTask:', returnedList);

    const finalListsData = listsApi.endpoints.getLists.select()(store.getState()).data;
    const updatedListInStore = finalListsData?.lists.find(l => l.id === customListId);
    // console.log('Updated List in Store:', updatedListInStore);
    
    expect(updatedListInStore).toBeDefined();
    expect(updatedListInStore).toEqual(returnedList);
    expect(updatedListInStore.unfinished_tasks_count).toBe(1);
    // console.log('Updated List in Store:', updatedListInStore);
    expect(updatedListInStore.childes_order).toContain(addTaskResult.task.id);
  });

  it('should increment unfinished_tasks_count for important list when an important task is added', async () => {
    const listId = 'important';
    
    const initialListsData = listsApi.endpoints.getLists.select()(store.getState()).data;
    const initialList = initialListsData?.default_lists?.find(l => l.id === listId);
    const initialCount = initialList ? initialList.unfinished_tasks_count : 0;
    console.log('Initial Important List:', initialList, 'unfinished_tasks_count:', initialCount);

    // Add a task to 'tasks' but mark it as important
    const newTask = { listId: 'tasks', title: 'New Important Task', is_important: true };
    console.log('Adding important task:', newTask);
    await store.dispatch(tasksApi.endpoints.addTask.initiate(newTask)).unwrap();

    const finalListsData = listsApi.endpoints.getLists.select()(store.getState()).data;
    const finalList = finalListsData?.default_lists?.find(l => l.id === listId);
    const finalCount = finalList?.unfinished_tasks_count;
    console.log('Final Important List:', finalList, 'unfinished_tasks_count:', finalCount);

    expect(finalCount).toBe(initialCount + 1);
  });

  it('should not increment unfinished_tasks_count when a completed task is added', async () => {
    const listId = 'tasks';
    
    const initialListsData = listsApi.endpoints.getLists.select()(store.getState()).data;
    const initialList = initialListsData?.default_lists?.find(l => l.id === listId);
    const initialCount = initialList ? initialList.unfinished_tasks_count : 0;
    // console.log('94 Initial List:', initialList, 'unfinished_tasks_count:', initialCount);

    const newTask = { listId, title: 'New Completed Task', is_completed: true };
    // console.log('94 Adding completed task:', newTask);
    await store.dispatch(tasksApi.endpoints.addTask.initiate(newTask)).unwrap();

    const finalListsData = listsApi.endpoints.getLists.select()(store.getState()).data;
    // console.log('94 Final Lists Data:', finalListsData);
    const finalList = finalListsData?.default_lists?.find(l => l.id === listId);
    const finalCount = finalList?.unfinished_tasks_count;
    // console.log('94 Final unfinished_list:', finalList, 'unfinished_tasks_count:', finalCount);

    expect(finalCount).toBe(initialCount);
  });
});