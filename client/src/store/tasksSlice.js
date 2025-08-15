
import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    selectedTaskId: null,
    loading: false,
    error: null,
    version: 0, // Добавляем отслеживание версии
    isFetching: false, // Добавляем статус загрузки
  },
  reducers: {
    setTasksVersion: (state, action) => { // Добавляем редьюсер для установки версии
      state.version = action.payload;
    },
  },
});

export const { setSelectedTaskId, setTasksVersion } = tasksSlice.actions;

export default tasksSlice.reducer;

export const tasksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: (listId) => `/tasks/get_tasks?list_id=${listId}`,
      providesTags: (result, error, listId) => [{ type: 'Task', id: listId }],
      transformResponse: (response) => {
        console.log('Transforming response from getTasks:', response);
        return response.tasks || [];
      },
    }),
    getTasksByIds: builder.query({
      query: (ids) => `/tasks/get_tasks_by_ids?ids=${ids.join(',')}`,
      providesTags: (result, error, ids) => ids.map(id => ({ type: 'Task', id })),
    }),
    addTask: builder.mutation({
      query: (newTask) => ({
        url: '/tasks/add_task',
        method: 'POST',
        body: newTask,
      }),
      invalidatesTags: (result, error, newTask) => [{ type: 'Task', id: newTask.listId }],
    }),
    addSubtask: builder.mutation({
      query: (newSubtask) => ({
        url: '/tasks/add_subtask',
        method: 'POST',
        body: newSubtask,
      }),
      invalidatesTags: (result, error, newSubtask) => [{ type: 'Task', id: newSubtask.parent_task_id }],
    }),
    updateTask: builder.mutation({
      query: (updatedTask) => ({
        url: '/tasks/edit_task',
        method: 'PUT',
        body: updatedTask,
      }),
      invalidatesTags: (result, error, updatedTask) => [{ type: 'Task', id: updatedTask.listId }],
    }),
    deleteTask: builder.mutation({
      query: (taskId) => ({
        url: '/tasks/del_task',
        method: 'DELETE',
        body: { taskId },
      }),
      invalidatesTags: (result, error, { listId }) => [{ type: 'Task', id: listId }],
    }),
    changeTaskStatus: builder.mutation({
      query: ({ taskId, is_completed, completed_at }) => ({
        url: '/tasks/change_status',
        method: 'PUT',
        body: { taskId, is_completed, completed_at },
      }),
      invalidatesTags: (result, error, { listId }) => [{ type: 'Task', id: listId }],
    }),
    linkGroupList: builder.mutation({
      query: (data) => ({
        url: '/tasks/link_group_list',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
    deleteFromChildes: builder.mutation({
      query: (data) => ({
        url: '/tasks/delete_from_childes',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
    linkTask: builder.mutation({
      query: (data) => ({
        url: '/tasks/link_task',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Task'],
    }),
    getFieldsConfig: builder.query({
      query: () => '/tasks/fields_config',
      providesTags: ['FieldsConfig'],
    }),
    getTaskTypeGroups: builder.query({
      query: () => '/tasks/task_type_groups',
      providesTags: ['TaskTypeGroup'],
    }),
    addTaskTypeGroup: builder.mutation({
      query: (newGroup) => ({
        url: '/tasks/task_type_groups',
        method: 'POST',
        body: newGroup,
      }),
      invalidatesTags: ['TaskTypeGroup', 'FieldsConfig'],
    }),
    updateTaskTypeGroup: builder.mutation({
      query: ({ id, ...updatedGroup }) => ({
        url: `/tasks/task_type_groups/${id}`,
        method: 'PUT',
        body: updatedGroup,
      }),
      invalidatesTags: ['TaskTypeGroup', 'FieldsConfig'],
    }),
    deleteTaskTypeGroup: builder.mutation({
      query: (id) => ({
        url: `/tasks/task_type_groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TaskTypeGroup', 'FieldsConfig'],
    }),
    getTaskTypes: builder.query({
      query: () => '/tasks/task_types',
      providesTags: ['TaskType'],
    }),
    addTaskType: builder.mutation({
      query: (newType) => ({
        url: '/tasks/task_types',
        method: 'POST',
        body: newType,
      }),
      invalidatesTags: ['TaskType', 'FieldsConfig'],
    }),
    updateTaskType: builder.mutation({
      query: ({ id, ...updatedType }) => ({
        url: `/tasks/task_types/${id}`,
        method: 'PUT',
        body: updatedType,
      }),
      invalidatesTags: ['TaskType', 'FieldsConfig'],
    }),
    deleteTaskType: builder.mutation({
      query: (id) => ({
        url: `/tasks/task_types/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TaskType', 'FieldsConfig'],
    }),
    getSubtasks: builder.query({
      query: (parentTaskId) => `/tasks/get_subtasks?parent_task_id=${parentTaskId}`,
      providesTags: (result, error, parentTaskId) => [{ type: 'Subtask', id: parentTaskId }],
    }),
    patchCalendarInstance: builder.mutation({
      query: (instanceData) => ({
        url: '/tasks/instance',
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
  useLinkGroupListMutation,
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
