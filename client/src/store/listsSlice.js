import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';

export const listsSlice = createSlice({
  name: 'lists',
  initialState: {
    lists: [],
    selectedListId: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedListId: (state, action) => {
      state.selectedListId = action.payload;
    },
  },
});

export const { setSelectedListId } = listsSlice.actions;

export default listsSlice.reducer;

export const listsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLists: builder.query({
      query: () => 'api/tasks/get_lists',
      providesTags: ['List'],
    }),
    getListsTree: builder.query({
      query: () => 'api/tasks/get_lists_tree',
      providesTags: ['List'],
    }),
    getDndTreeLists: builder.query({
      query: () => 'api/tasks/dnd-tree-lists',
      providesTags: ['List'],
    }),
    getListsMUITree: builder.query({
      query: () => 'api/tasks/get_lists_mui_tree',
      providesTags: ['List'],
    }),
    addObject: builder.mutation({
      query: (newObject) => ({
        url: 'api/tasks/add_list',
        method: 'POST',
        body: newObject,
      }),
      async onQueryStarted(newObject, { dispatch, queryFulfilled }) {
        try {
          const { data: addedObject } = await queryFulfilled;
          dispatch(
            listsApi.util.updateQueryData('getLists', undefined, (draft) => {
              if (addedObject.object_type === 'list' || addedObject.object_type === 'group') {
                draft.lists.push(addedObject.new_object);
              } else if (addedObject.object_type === 'project') {
                draft.projects.push(addedObject.new_object);
              }
            })
          );
        } catch {
          // handle error
        }
      },
    }),
    updateList: builder.mutation({
      query: (data) => ({
        url: 'api/tasks/edit_list',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
    deleteList: builder.mutation({
      query: (id) => ({
        url: `api/tasks/lists/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['List'],
    }),
    linkItems: builder.mutation({
      query: (data) => ({
        url: 'api/tasks/link_items',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
    moveItems: builder.mutation({
      query: (data) => ({
        url: 'api/tasks/move_items',
        method: 'PUT',
        body: data,
      }),
      async onQueryStarted(data, { dispatch, queryFulfilled }) {
        try {
          const { data: result } = await queryFulfilled;
          
          // Обновляем кэш getLists на основе ответа сервера
          dispatch(
            listsApi.util.updateQueryData('getLists', undefined, (draft) => {
              // Обновляем source_entity
              if (result.source_entity) {
                // Ищем source_entity в lists
                const sourceIndex = draft.lists.findIndex(item => item.id === result.source_entity.id);
                if (sourceIndex !== -1) {
                  draft.lists[sourceIndex] = { ...draft.lists[sourceIndex], ...result.source_entity };
                }
                // Ищем source_entity в projects
                const sourceProjectIndex = draft.projects.findIndex(item => item.id === result.source_entity.id);
                if (sourceProjectIndex !== -1) {
                  draft.projects[sourceProjectIndex] = { ...draft.projects[sourceProjectIndex], ...result.source_entity };
                }
              }
              
              // Обновляем old_parents (старые родители)
              if (result.old_parents && Array.isArray(result.old_parents)) {
                result.old_parents.forEach(parent => {
                  // Ищем parent в lists
                  const parentIndex = draft.lists.findIndex(item => item.id === parent.id);
                  if (parentIndex !== -1) {
                    draft.lists[parentIndex] = { ...draft.lists[parentIndex], ...parent };
                  }
                  // Ищем parent в projects
                  const parentProjectIndex = draft.projects.findIndex(item => item.id === parent.id);
                  if (parentProjectIndex !== -1) {
                    draft.projects[parentProjectIndex] = { ...draft.projects[parentProjectIndex], ...parent };
                  }
                });
              }
              
              // Обновляем parent (новый родитель)
              if (result.parent) {
                // Ищем parent в lists
                const parentIndex = draft.lists.findIndex(item => item.id === result.parent.id);
                if (parentIndex !== -1) {
                  draft.lists[parentIndex] = { ...draft.lists[parentIndex], ...result.parent };
                }
                // Ищем parent в projects
                const parentProjectIndex = draft.projects.findIndex(item => item.id === result.parent.id);
                if (parentProjectIndex !== -1) {
                  draft.projects[parentProjectIndex] = { ...draft.projects[parentProjectIndex], ...result.parent };
                }
              }
            })
          );
        } catch {
          // В случае ошибки инвалидируем теги, чтобы данные перезагрузились
          dispatch(listsApi.util.invalidateTags(['List']));
        }
      },
    }),
    deleteFromChildes: builder.mutation({
      query: (data) => ({
        url: 'api/tasks/delete_from_childes',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
    addToGeneralList: builder.mutation({
      query: (data) => ({
        url: 'api/tasks/add_to_general_list',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
  }),
});

export const {
  useGetListsQuery,
  useGetListsTreeQuery,
  useGetListsMUITreeQuery,
  useGetDndTreeListsQuery,
  useAddObjectMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useLinkItemsMutation,
  useMoveItemsMutation,
  useDeleteFromChildesMutation,
  useAddToGeneralListMutation,
} = listsApi;
