import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import { createEntityAdapter } from '@reduxjs/toolkit';

// ✅ УПРОЩЕННЫЙ slice - ТОЛЬКО версионирование для проверки актуальности
export const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    // ✅ ТОЛЬКО версия для сравнения с сервером
    version: 0,
    // ❌ НЕ храним данные - это делает RTK Query
  },
  reducers: {
    setTasksVersion: (state, action) => {
      state.version = action.payload;
    },
  },
});

export const { setTasksVersion } = tasksSlice.actions;
export const tasksAdapter = createEntityAdapter();
export default tasksSlice.reducer;

// ✅ RTK Query endpoints - единственный источник данных
export const tasksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1️⃣ Список задач по конкретному списку
    getTasksByListId: builder.query({
      query: (listId) => `api/tasks/get_tasks?list_id=${listId}`,
      transformResponse: (response, meta, listId) => {
        // response = { tasks: [...], list: {...} }
        return {
          listId,
          list: response.list,
          tasks: response.tasks,
        };
      },
      providesTags: (result, error, listId) =>
        result
          ? [
              { type: 'Task', id: `LIST-${listId}` },
              ...result.tasks.map(({ id }) => ({ type: 'Task', id })),
            ]
          : [{ type: 'Task', id: `LIST-${listId}` }],
    }),
     // 2️⃣ Задачи по списку id
    getTasksByIds: builder.query({
      query: ({ ids = [] }) => ({
        url: 'api/tasks/get_tasks_by_ids',
        method: 'POST',
        body: { ids },
      }),
      providesTags: (result) =>
        result?.tasks
          ? result.tasks.map(({ id }) => ({ type: 'Task', id }))
          : [],
    }),
    addTask: builder.mutation({
      query: (task) => ({
        url: 'api/tasks/add_task',
        method: 'POST',
        body: task,
      }),
      invalidatesTags: (result, error, { listId }) => [{ type: 'Task', id: `LIST-${listId}` }, 'List', 'CalendarEvent'],
    }),

    updateTask: builder.mutation({
      query: (task) => ({
        url: 'api/tasks/edit_task',
        method: 'PUT',
        body: task,
      }),
      invalidatesTags: (result, error, task) => [
        { type: 'Task', id: task.id },
        { type: 'Task', id: `LIST-${task.listId}` },
      ],
    }),
    changeTaskStatus: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/change_task_status',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['List', 'CalendarEvent'],
    }),
    addSubtask: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/add_subtask',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { parentId }) => [{ type: 'Task', id: parentId }, 'List', 'CalendarEvent'],
    }),
    deleteTask: builder.mutation({
      query: (taskId) => ({
        url: `/api/tasks/del_task`,
        method: 'DELETE',
        body: { taskId },
      }),
      async onQueryStarted(taskId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData('getTasksByIds', { 
            listId: null, // или конкретный listId
            ids: [taskId] 
          }, (draft) => {
            draft.tasks = draft.tasks.filter(t => t.id !== taskId);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteFromChildes: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/delete_from_childes',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['List', 'CalendarEvent'],
    }),
    linkTask: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/link_task',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['List', 'CalendarEvent'],
    }),
    getFieldsConfig: builder.query({
      query: () => '/api/tasks/fields_config',
      providesTags: ['List', 'CalendarEvent'],
    }),
    getTaskTypeGroups: builder.query({
      query: () => '/api/tasks/get_task_type_groups',
      providesTags: ['List', 'CalendarEvent'],
    }),
    addTaskTypeGroup: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/add_task_type_group',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTaskTypeGroup: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/edit_task_type_group',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Task'],
    }),
    deleteTaskTypeGroup: builder.mutation({
      query: (id) => ({
        url: `/api/tasks/del_task_type_group/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
    getTaskTypes: builder.query({
      query: () => '/api/tasks/get_task_types',
      providesTags: ['Task'],
    }),
    addTaskType: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/add_task_type',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTaskType: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/edit_task_type',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Task'],
    }),
    deleteTaskType: builder.mutation({
      query: (id) => ({
        url: `/api/tasks/del_task_type/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
    // ❌ УБРАНО: getSubtasks - подзадачи загружаются через getTasksByIds
    patchCalendarInstance: builder.mutation({
      query: (data) => ({
        url: '/api/tasks/patch_calendar_instance',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Task', 'CalendarEvent'],
    }),
  }),
});

// ✅ Экспортируем хуки для использования в компонентах
export const {
  
  useGetTasksByIdsQuery,
  useLazyGetTasksByIdsQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useChangeTaskStatusMutation,
  useAddSubtaskMutation,
  useDeleteTaskMutation,
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
  usePatchCalendarInstanceMutation,
  useGetTasksByListIdQuery,
} = tasksApi;