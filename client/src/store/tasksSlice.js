import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import { listsApi } from './listsSlice';

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    selectedTaskId: null,
    loading: false,
    error: null,
    version: 0,
    isFetching: false,
  },
  reducers: {
    setTasksVersion: (state, action) => {
      state.version = action.payload;
    },
  },
});

export const { setSelectedTaskId, setTasksVersion } = tasksSlice.actions;

export default tasksSlice.reducer;

export const tasksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: (listId) => `/api/tasks/get_tasks?list_id=${listId}`,
      providesTags: (result, error, listId) => [{ type: 'Task', id: listId }],
      transformResponse: (response) => {
        return response.tasks || [];
      },
    }),
    getTasksByIds: builder.query({
      query: (ids) => `/api/tasks/get_tasks_by_ids?ids=${ids.join(',')}`,
      providesTags: (result, error, ids) => ids.map(id => ({ type: 'Task', id })),
    }),
    addTask: builder.mutation({
      query: (newTask) => ({
        url: '/api/tasks/add_task',
        method: 'POST',
        body: newTask,
      }),
      async onQueryStarted(newTask, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData('getTasks', newTask.listId, () => {})
        );
        try {
          const { data: addedTaskResponse } = await queryFulfilled;
          const { task: addedTask, task_list: serverUpdatedList } = addedTaskResponse;

          // Update the getTasks cache with the final task from the server
          dispatch(
            tasksApi.util.updateQueryData('getTasks', newTask.listId, (draft) => {
              if (draft && !draft.find(t => t.id === addedTask.id)) {
                draft.push(addedTask);
              }
            })
          );

          // Update the getLists cache with the server-provided updated list
          dispatch(
            listsApi.util.updateQueryData('getLists', undefined, (draft) => {
              if (!draft) return;

              // Update the list the task was explicitly added to (from server response)
              if (serverUpdatedList) {
                let listInCache = draft.lists.find(l => l.id === serverUpdatedList.id) || draft.default_lists.find(l => l.id === serverUpdatedList.id);
                if (listInCache) {
                  Object.assign(listInCache, serverUpdatedList);
                } else if (serverUpdatedList.type !== 'default') {
                  draft.lists.push(serverUpdatedList);
                }
              }

              // Manually update 'important' list count if the added task is important and unfinished
              if (addedTask.is_important && !addedTask.is_completed) {
                const importantList = draft.default_lists.find(l => l.id === 'important');
                if (importantList) {
                  importantList.unfinished_tasks_count = (importantList.unfinished_tasks_count || 0) + 1;
                }
              }

              // Manually update 'background' list count if the added task is background and unfinished
              if (addedTask.is_background && !addedTask.is_completed) {
                const backgroundList = draft.default_lists.find(l => l.id === 'background');
                if (backgroundList) {
                  backgroundList.unfinished_tasks_count = (backgroundList.unfinished_tasks_count || 0) + 1;
                }
              }

              // Manually update 'my_day' list count if the added task falls within today's range and is unfinished
              if (!addedTask.is_completed && (addedTask.start || addedTask.end)) {
                const myDayList = draft.default_lists.find(l => l.id === 'my_day');
                if (myDayList) {
                  console.log('Checking if added task fits in My Day range:', addedTask);

                  const now = new Date();
                  const todayUtcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
                  const todayUtcEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

                  const taskStart = addedTask.start ? new Date(addedTask.start) : null;
                  const taskEnd = addedTask.end ? new Date(addedTask.end) : taskStart; // If no end, assume it's a point in time

                  // Replicate server's _is_task_in_range logic
                  let isInMyDayRange = true;
                  if (taskEnd && taskEnd < todayUtcStart) {
                    isInMyDayRange = false;
                  }
                  if (taskStart && taskStart > todayUtcEnd) {
                    isInMyDayRange = false;
                  }

                  if (isInMyDayRange) {
                    myDayList.unfinished_tasks_count = (myDayList.unfinished_tasks_count || 0) + 1;
                    // Also add to childes_order if it's not already there
                    if (!myDayList.childes_order.includes(addedTask.id)) {
                      myDayList.childes_order.push(addedTask.id);
                    }
                  }
                }
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
    }),
    addSubtask: builder.mutation({
      query: (newSubtask) => ({
        url: '/api/tasks/add_subtask',
        method: 'POST',
        body: newSubtask,
      }),
      invalidatesTags: (result, error, newSubtask) => [{ type: 'Task', id: newSubtask.parent_task_id }],
    }),
     deleteTask: builder.mutation({
      query: ({ taskId }) => ({
        url: '/api/tasks/del_task',
        method: 'DELETE',
        body: { taskId },
      }),
      invalidatesTags: (result, error, { listId }) => [{ type: 'Task', id: listId }],
    }),
    updateTask: builder.mutation({
      query: (updatedTask) => ({
        url: '/api/tasks/edit_task',
        method: 'PUT',
        body: updatedTask,
      }),
      async onQueryStarted(updatedTask, { dispatch, queryFulfilled }) {
        // Optimistic update for getTasks cache
        const patchResultGetTasks = dispatch(
          tasksApi.util.updateQueryData('getTasks', updatedTask.listId, (draft) => {
            const taskToUpdate = draft.find(task => task.id === updatedTask.id);
            if (taskToUpdate) {
              // Apply only the fields that were sent in updatedTask for optimistic update
              Object.assign(taskToUpdate, updatedTask);
            }
          })
        );

        // Optimistic update for getTasksByIds cache
        const patchResultGetTasksByIds = dispatch(
          tasksApi.util.updateQueryData('getTasksByIds', [updatedTask.id], (draft) => {
            if (draft && draft.length > 0) {
              Object.assign(draft[0], updatedTask);
            }
          })
        );

        try {
          const { data: response } = await queryFulfilled;
          const serverUpdatedTask = response.task; // Server returns { success: true, task: ... }

          // Apply server's version to getTasks cache
          dispatch(
            tasksApi.util.updateQueryData('getTasks', updatedTask.listId, (draft) => {
              const taskInCache = draft.find(task => task.id === serverUpdatedTask.id);
              if (taskInCache) {
                Object.assign(taskInCache, serverUpdatedTask);
              }
            })
          );

          // Apply server's version to getTasksByIds cache
          dispatch(
            tasksApi.util.updateQueryData('getTasksByIds', [serverUpdatedTask.id], (draft) => {
              if (draft && draft.length > 0) {
                Object.assign(draft[0], serverUpdatedTask);
              }
            })
          );

          // No update for getSubtasks needed here, as edit_task doesn't affect subtask relationships
          // or propagate changes to them on the server side.
          // If the updated task is a subtask, its parent's subtask list might become stale,
          // but that's a limitation of the current server API for edit_task.

        } catch {
          patchResultGetTasks.undo(); // Revert optimistic update on error
          patchResultGetTasksByIds.undo(); // Revert optimistic update on error
        }
      },
    }),
    changeTaskStatus: builder.mutation({
      query: ({ taskId, status_id, completed_at, listId }) => ({
        url: '/api/tasks/change_status',
        method: 'PUT',
        body: { task_id: taskId, status_id, completed_at, list_id: listId },
      }),
      async onQueryStarted({ taskId, status_id, completed_at, listId }, { dispatch, queryFulfilled }) {
        // Optimistic update for getTasks cache
        const patchResultGetTasks = dispatch(
          tasksApi.util.updateQueryData('getTasks', listId, (draft) => {
            const taskToUpdate = draft.find(task => task.id === taskId);
            if (taskToUpdate) {
              taskToUpdate.status_id = status_id;
              taskToUpdate.completed_at = completed_at;
            }
          })
        );

        // Optimistic update for getTasksByIds cache
        const patchResultGetTasksByIds = dispatch(
          tasksApi.util.updateQueryData('getTasksByIds', [taskId], (draft) => {
            if (draft && draft.length > 0) {
              draft.status_id = status_id;
              draft.completed_at = completed_at;
            }
          })
        );

        try {
          await queryFulfilled;
          // Invalidate tags to refetch relevant data after successful update
          dispatch(tasksApi.util.invalidateTags([{ type: 'Task', id: listId }]));
          dispatch(tasksApi.util.invalidateTags([{ type: 'Task', id: taskId }]));
          dispatch(listsApi.util.invalidateTags(['List'])); // Invalidate lists to update counts
        } catch {
          patchResultGetTasks.undo(); // Revert optimistic update on error
          patchResultGetTasksByIds.undo(); // Revert optimistic update on error
        }
      },
    }),
    deleteFromChildes: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/delete_from_childes',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
    linkTask: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/link_task',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Task'],
    }),
    getFieldsConfig: builder.query({
      query: () => '/api/tasks/fields_config',
      providesTags: ['FieldsConfig'],
    }),
    getTaskTypeGroups: builder.query({
      query: () => '/api/tasks/task_type_groups',
      providesTags: ['TaskTypeGroup'],
    }),
    addTaskTypeGroup: builder.mutation({
      query: (newGroup) => ({
        url: '/api/tasks/task_type_groups',
        method: 'POST',
        body: newGroup,
      }),
      invalidatesTags: ['TaskTypeGroup', 'FieldsConfig'],
    }),
    updateTaskTypeGroup: builder.mutation({
      query: ({ id, ...updatedGroup }) => ({
        url: `/api/tasks/task_type_groups/${id}`,
        method: 'PUT',
        body: updatedGroup,
      }),
      invalidatesTags: ['TaskTypeGroup', 'FieldsConfig'],
    }),
    deleteTaskTypeGroup: builder.mutation({
      query: (id) => ({
        url: `/api/tasks/task_type_groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TaskTypeGroup', 'FieldsConfig'],
    }),
    getTaskTypes: builder.query({
      query: () => '/api/tasks/task_types',
      providesTags: ['TaskType'],
    }),
    addTaskType: builder.mutation({
      query: (newType) => ({
        url: '/api/tasks/task_types',
        method: 'POST',
        body: newType,
      }),
      invalidatesTags: ['TaskType', 'FieldsConfig'],
    }),
    updateTaskType: builder.mutation({
      query: ({ id, ...updatedType }) => ({
        url: `/api/tasks/task_types/${id}`,
        method: 'PUT',
        body: updatedType,
      }),
      invalidatesTags: ['TaskType', 'FieldsConfig'],
    }),
    deleteTaskType: builder.mutation({
      query: (id) => ({
        url: `/api/tasks/task_types/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TaskType', 'FieldsConfig'],
    }),
    getSubtasks: builder.query({
      query: (parentTaskId) => `/api/tasks/get_subtasks?parent_task_id=${parentTaskId}`,
      providesTags: (result, error, parentTaskId) => [{ type: 'Subtask', id: parentTaskId }],
    }),
    patchCalendarInstance: builder.mutation({
      query: (instanceData) => ({
        url: '/api/tasks/instance',
        method: 'PATCH',
        body: instanceData,
      }),
      invalidatesTags: ['CalendarEvent'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTasksByIdsQuery,
  useAddTaskMutation,
  useAddSubtaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useChangeTaskStatusMutation,
  useDeleteFromChildesMutation,
  useLinkTaskMutation,
  useGetFieldsConfigQuery,
  useGetTaskTypeGroupsQuery,
  useAddTaskTypeGroupMutation,
  useUpdateTaskTypeGroupMutation,
  useDeleteTaskTypeGroupMutation,
  useGetTaskTypesQuery,
  useAddTaskTypeMutation,
  useUpdateTaskTypeMutation,
  useDeleteTaskTypeMutation,
  useGetSubtasksQuery,
  usePatchCalendarInstanceMutation,
} = tasksApi;