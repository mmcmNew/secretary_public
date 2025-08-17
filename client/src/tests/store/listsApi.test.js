import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { listsApi } from '../../store/listsSlice';
import { createAuthorizedStore } from './rtk-test-setup';

describe('Lists RTK API', () => {
  let store;

  beforeAll(async () => {
    store = await createAuthorizedStore();
  });

  afterEach(() => {
    store.dispatch(listsApi.util.resetApiState());
  });

  describe('getLists', () => {
    it('should return a list of lists', async () => {
      const result = await store.dispatch(
        listsApi.endpoints.getLists.initiate()
      ).unwrap();
      console.log('getLists result:', result);

      expect(result).toBeTypeOf('object');
      expect(Array.isArray(result.lists)).toBe(true);
      expect(Array.isArray(result.projects)).toBe(true);
      expect(Array.isArray(result.default_lists)).toBe(true);
      
      // Проверка структуры объектов в массивах
      // Проверка default_lists
      if (result.default_lists.length > 0) {
        const defaultList = result.default_lists[0];
        expect(defaultList.id).toBeDefined();
        expect(defaultList.title).toBeDefined();
        expect(defaultList.type).toBeDefined();
        expect(Array.isArray(defaultList.childes_order)).toBe(true);
        expect(typeof defaultList.unfinished_tasks_count).toBe('number');
      }
      
      // Проверка lists
      if (result.lists.length > 0) {
        const list = result.lists[0];
        expect(list.id).toBeDefined();
        expect(list.title).toBeDefined();
        expect(list.type).toBeDefined();
        expect(list.order).toBeDefined();
        expect(typeof list.order).toBe('number');
        expect(list.in_general_list).toBeDefined();
        expect(typeof list.in_general_list).toBe('boolean');
        expect(Array.isArray(list.childes_order)).toBe(true);
        expect(typeof list.deleted).toBe('boolean');
        expect(typeof list.unfinished_tasks_count).toBe('number');
      }
      
      // Проверка projects
      if (result.projects.length > 0) {
        const project = result.projects[0];
        expect(project.id).toBeDefined();
        expect(project.title).toBeDefined();
        expect(project.type).toBe('project');
        expect(project.order).toBeDefined();
        expect(typeof project.order).toBe('number');
        expect(Array.isArray(project.childes_order)).toBe(true);
        expect(project.deleted).toBeDefined();
        expect(typeof project.deleted).toBe('boolean');
        // expect(typeof project.background_tasks_count).toBe('number');
        // expect(typeof project.important_tasks_count).toBe('number');
        expect(typeof project.unfinished_tasks_count).toBe('number');
      }
    });
  
  });

  describe('getListsTree', () => {
    it('should return a tree structure of lists', async () => {
      const result = await store.dispatch(
        listsApi.endpoints.getListsTree.initiate()
      ).unwrap();

      expect(result).toBeTypeOf('object');
      expect(Array.isArray(result)).toBe(true);
      
      // Проверка структуры корневых элементов дерева
      if (result.length > 0) {
        const rootElement = result[0];
        expect(rootElement.id).toBeDefined();
        expect(rootElement.name).toBeDefined();
        expect(rootElement.rootId).toBeDefined();
        expect(Array.isArray(rootElement.data)).toBe(true);
        
        // Проверка структуры дочерних элементов
        if (rootElement.data.length > 0) {
          const childElement = rootElement.data[0];
          expect(childElement.id).toBeDefined();
          expect(childElement.parent).toBeDefined();
          expect(childElement.text).toBeDefined();
          expect(typeof childElement.droppable).toBe('boolean');
          expect(childElement.data).toBeDefined();
          expect(childElement.data.rootId).toBeDefined();
          expect(childElement.data.type).toBeDefined();
          expect(typeof childElement.data.unfinished_tasks_count).toBe('number');
        }
      }
    });
  });

  describe('addObject', () => {
    it('should add a new list and return it', async () => {
      const newList = {
        title: 'New Test List',
        type: 'list',
      };
      const result = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();

      expect(result).toBeDefined();
      expect(result.new_object).toBeDefined();
      expect(result.new_object.title).toBe(newList.title);
      
      // Проверка дополнительных полей из ответа API
      expect(result.new_object.id).toBeDefined();
      expect(typeof result.new_object.id).toBe('string');
      expect(result.new_object.type).toBe('list');
      expect(result.new_object.order).toBeDefined();
      expect(typeof result.new_object.order).toBe('number');
      expect(result.new_object.in_general_list).toBeDefined();
      expect(typeof result.new_object.in_general_list).toBe('boolean');
      expect(Array.isArray(result.new_object.childes_order)).toBe(true);
      expect(result.new_object.deleted).toBeDefined();
      expect(typeof result.new_object.deleted).toBe('boolean');
      expect(result.new_object.background_tasks_count).toBeDefined();
      expect(typeof result.new_object.background_tasks_count).toBe('number');
      expect(result.new_object.important_tasks_count).toBeDefined();
      expect(typeof result.new_object.important_tasks_count).toBe('number');
      expect(result.new_object.unfinished_tasks_count).toBeDefined();
      expect(typeof result.new_object.unfinished_tasks_count).toBe('number');
    });
  });

  describe('updateList', () => {
    it('should update an existing list and return the updated list', async () => {
      // First, create a list to update
      const newList = { name: 'List to Update', type: 'list' };
      const createResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();
      const listId = createResult.new_object.id;

      const updatedTitle = 'Updated List Name';
      const updateData = { listId: listId, title: updatedTitle, type: 'list' };

      // The mutation should return the updated list
      const updateResult = await store.dispatch(
        listsApi.endpoints.updateList.initiate(updateData)
      ).unwrap();

      expect(updateResult).toBeDefined();
      expect(updateResult.updated_list).toBeDefined();
      expect(updateResult.updated_list.id).toBe(listId);
      expect(updateResult.updated_list.title).toBe(updatedTitle);
      
      // Проверка дополнительных полей из ответа API
      expect(updateResult.updated_list.type).toBe('list');
      expect(updateResult.updated_list.order).toBeDefined();
      expect(typeof updateResult.updated_list.order).toBe('number');
      expect(updateResult.updated_list.in_general_list).toBeDefined();
      expect(typeof updateResult.updated_list.in_general_list).toBe('boolean');
      expect(Array.isArray(updateResult.updated_list.childes_order)).toBe(true);
      expect(updateResult.updated_list.deleted).toBeDefined();
      expect(typeof updateResult.updated_list.deleted).toBe('boolean');
      expect(updateResult.updated_list.background_tasks_count).toBeDefined();
      expect(typeof updateResult.updated_list.background_tasks_count).toBe('number');
      expect(updateResult.updated_list.important_tasks_count).toBeDefined();
      expect(typeof updateResult.updated_list.important_tasks_count).toBe('number');
      expect(updateResult.updated_list.unfinished_tasks_count).toBeDefined();
      expect(typeof updateResult.updated_list.unfinished_tasks_count).toBe('number');

      // Also, re-fetch the lists to verify the update is persisted
      const getResult = await store.dispatch(
        listsApi.endpoints.getLists.initiate()
      ).unwrap();

      const updatedList = getResult.lists.find(list => list.id === listId);
      expect(updatedList).toBeDefined();
      expect(updatedList.title).toBe(updatedTitle);
    });
  });

  describe('deleteList', () => {
    it('should delete an existing list', async () => {
      // First, create a list to delete
      const newList = { name: 'List to Delete', type: 'list' };
      const createResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();
      const listId = createResult.new_object.id;

      const deleteData = {
        item_id: listId,
        source_id: listId,
        source_type: 'list',
      };
      const deleteResult = await store.dispatch(
        listsApi.endpoints.deleteFromChildes.initiate(deleteData)
      ).unwrap();

      expect(deleteResult).toBeDefined();
      expect(deleteResult.success).toBe(true);
    });
  });

  describe('linkItems', () => {
    it('should link a list to a group', async () => {
      // First, create a group
      const newGroup = {
        title: 'Test Group for List',
        type: 'group',
      };
      const createGroupResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newGroup)
      ).unwrap();
      const groupId = createGroupResult.new_object.id;

      // Then, create a list
      const newList = {
        title: 'Test List for Group',
        type: 'list',
      };
      const createListResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();
      const listId = createListResult.new_object.id;

      // Link the list to the group
      const linkData = {
        source_type: 'list',
        source_id: listId,
        target_type: 'group',
        target_id: groupId,
      };
      const linkResult = await store.dispatch(
        listsApi.endpoints.linkItems.initiate(linkData)
      ).unwrap();

      expect(linkResult).toBeDefined();
      expect(linkResult.success).toBe(true);
    });

    it('should link a group to a project', async () => {
      // First, create a project
      const newProject = {
        title: 'Test Project for Group',
        type: 'project',
      };
      const createProjectResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newProject)
      ).unwrap();
      const projectId = createProjectResult.new_object.id;

      // Then, create a group
      const newGroup = {
        title: 'Test Group for Project',
        type: 'group',
      };
      const createGroupResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newGroup)
      ).unwrap();
      const groupId = createGroupResult.new_object.id;

      // Link the group to the project
      const linkData = {
        source_type: 'group',
        source_id: groupId,
        target_type: 'project',
        target_id: projectId,
      };
      const linkResult = await store.dispatch(
        listsApi.endpoints.linkItems.initiate(linkData)
      ).unwrap();

      expect(linkResult).toBeDefined();
      expect(linkResult.success).toBe(true);
    });

    it('should link a list to a project', async () => {
      // First, create a project
      const newProject = {
        title: 'Test Project for List',
        type: 'project',
      };
      const createProjectResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newProject)
      ).unwrap();
      const projectId = createProjectResult.new_object.id;

      // Then, create a list
      const newList = {
        title: 'Test List for Project',
        type: 'list',
      };
      const createListResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();
      const listId = createListResult.new_object.id;

      // Link the list to the project
      const linkData = {
        source_type: 'list',
        source_id: listId,
        target_type: 'project',
        target_id: projectId,
      };
      const linkResult = await store.dispatch(
        listsApi.endpoints.linkItems.initiate(linkData)
      ).unwrap();

      expect(linkResult).toBeDefined();
      expect(linkResult.success).toBe(true);
    });
  });

  describe('moveItems', () => {
    it('should move a list from one group to another and verify removal from the old place', async () => {
      // Create first group
      const firstGroup = {
        title: 'First Group',
        type: 'group',
      };
      const createFirstGroupResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(firstGroup)
      ).unwrap();
      const firstGroupId = createFirstGroupResult.new_object.id;

      // Create second group
      const secondGroup = {
        title: 'Second Group',
        type: 'group',
      };
      const createSecondGroupResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(secondGroup)
      ).unwrap();
      const secondGroupId = createSecondGroupResult.new_object.id;

      // Create list
      const newList = {
        title: 'Test List to Move',
        type: 'list',
      };
      const createListResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();
      const listId = createListResult.new_object.id;

      // Link list to first group
      const linkToFirstData = {
        source_type: 'list',
        source_id: listId,
        target_type: 'group',
        target_id: firstGroupId,
      };
      await store.dispatch(
        listsApi.endpoints.linkItems.initiate(linkToFirstData)
      ).unwrap();

      // Verify list is in first group
      let listsResult = await store.dispatch(
        listsApi.endpoints.getLists.initiate()
      ).unwrap();
      let firstGroupInResult = listsResult.lists.find(g => g.id === firstGroupId);
      expect(firstGroupInResult.childes_order).toContain(listId);

      // Move list to second group
      const moveData = {
        source_type: 'list',
        source_id: listId,
        target_type: 'group',
        target_id: secondGroupId,
        source_parent_id: firstGroupId,
        source_parent_type: 'group',
      };
      const moveResult = await store.dispatch(
        listsApi.endpoints.moveItems.initiate(moveData)
      ).unwrap();

      expect(moveResult).toBeDefined();
      expect(moveResult.success).toBe(true);

      // Verify list is in second group and not in first group
      listsResult = await store.dispatch(
        listsApi.endpoints.getLists.initiate()
      ).unwrap();
      firstGroupInResult = listsResult.lists.find(g => g.id === firstGroupId);
      const secondGroupInResult = listsResult.lists.find(g => g.id === secondGroupId);
      
      expect(firstGroupInResult.childes_order).not.toContain(listId);
      expect(secondGroupInResult.childes_order).toContain(listId);
    });

    it('should move a list from a group to a project and verify removal from the old place', async () => {
      // Create group
      const group = {
        title: 'Group for List',
        type: 'group',
      };
      const createGroupResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(group)
      ).unwrap();
      const groupId = createGroupResult.new_object.id;

      // Create project
      const project = {
        title: 'Project for List',
        type: 'project',
      };
      const createProjectResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(project)
      ).unwrap();
      const projectId = createProjectResult.new_object.id;

      // Create list
      const newList = {
        title: 'Test List to Move to Project',
        type: 'list',
      };
      const createListResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();
      const listId = createListResult.new_object.id;

      // Link list to group
      const linkToGroupData = {
        source_type: 'list',
        source_id: listId,
        target_type: 'group',
        target_id: groupId,
      };
      await store.dispatch(
        listsApi.endpoints.linkItems.initiate(linkToGroupData)
      ).unwrap();

      // Verify list is in group
      let listsResult = await store.dispatch(
        listsApi.endpoints.getLists.initiate()
      ).unwrap();
      let groupInResult = listsResult.lists.find(g => g.id === groupId);
      expect(groupInResult.childes_order).toContain(listId);

      // Move list to project
      const moveData = {
        source_type: 'list',
        source_id: listId,
        target_type: 'project',
        target_id: projectId,
        source_parent_id: groupId,
        source_parent_type: 'group',
      };
      const moveResult = await store.dispatch(
        listsApi.endpoints.moveItems.initiate(moveData)
      ).unwrap();

      expect(moveResult).toBeDefined();
      expect(moveResult.success).toBe(true);

      // Verify list is in project and not in group
      listsResult = await store.dispatch(
        listsApi.endpoints.getLists.initiate()
      ).unwrap();
      groupInResult = listsResult.lists.find(g => g.id === groupId);
      const projectInResult = listsResult.projects.find(p => p.id === projectId);
      
      expect(groupInResult.childes_order).not.toContain(listId);
      expect(projectInResult.childes_order).toContain(listId);
    });

    it('should move a list to the general list', async () => {
      // Create list
      const newList = {
        title: 'Test List for General List',
        type: 'list',
      };
      const createListResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();
      const listId = createListResult.new_object.id;

      // Move list to general list
      const moveData = {
        item_id: listId,
        in_general_list: true,
      };
      const moveResult = await store.dispatch(
        listsApi.endpoints.addToGeneralList.initiate(moveData)
      ).unwrap();

      expect(moveResult).toBeDefined();
      expect(moveResult.success).toBe(true);

      // Verify list is in general list
      const listsResult = await store.dispatch(
        listsApi.endpoints.getLists.initiate()
      ).unwrap();
      const listInResult = listsResult.lists.find(l => l.id === listId);
      expect(listInResult.in_general_list).toBe(true);
    });

    it('should remove a list from the general list', async () => {
      // Create list
      const newList = {
        title: 'Test List to Remove from General',
        type: 'list',
      };
      const createListResult = await store.dispatch(
        listsApi.endpoints.addObject.initiate(newList)
      ).unwrap();
      const listId = createListResult.new_object.id;

      // Add list to general list first
      await store.dispatch(
        listsApi.endpoints.addToGeneralList.initiate({
          item_id: listId,
          in_general_list: true,
        })
      ).unwrap();

      // Verify list is in general list
      let listsResult = await store.dispatch(
        listsApi.endpoints.getLists.initiate()
      ).unwrap();
      let listInResult = listsResult.lists.find(l => l.id === listId);
      expect(listInResult.in_general_list).toBe(true);

      // Remove list from general list
      const removeData = {
        source_id: listId,
        source_type: 'list',
      };
      const removeResult = await store.dispatch(
        listsApi.endpoints.deleteFromChildes.initiate(removeData)
      ).unwrap();

      expect(removeResult).toBeDefined();
      expect(removeResult.success).toBe(true);

      // Verify list is not in general list
      listsResult = await store.dispatch(
        listsApi.endpoints.getLists.initiate()
      ).unwrap();
      listInResult = listsResult.lists.find(l => l.id === listId);
      expect(listInResult.in_general_list).toBe(false);
    });
  });
});