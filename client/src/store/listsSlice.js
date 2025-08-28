import { apiSlice } from './api/apiSlice';

// ✅ УПРОЩЕННЫЙ slice - только RTK Query endpoints
// НЕ нужен обычный Redux slice для списков

export const listsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLists: builder.query({
        query: () => 'api/tasks/get_lists',
        // Предоставляем теги для всех полученных элементов
        providesTags: (result, error, arg) => {
          // Проверяем, что result существует
          console.log('getLists providesTags result:', result);
          if (!result) {
            return [{ type: 'List', id: 'LIST' }];
          }

          const { default_lists = [], lists = [], projects = [] } = result;
          
          const allItems = [...default_lists, ...lists, ...projects];
  
          return [
              ...allItems.filter(item => item.id).map(({ id }) => ({ type: 'List', id })),
              { type: 'List', id: 'LIST' }, // Общий тег для операций со всем списком списков
          ];
        },
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
      invalidatesTags: ['List'],
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
      invalidatesTags: ['List'],
    }),
    deleteFromChildes: builder.mutation({
      query: (data) => ({
        url: 'api/tasks/delete_from_childes',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
    addToGeneralList: builder.mutation({
      query: (data) => ({
        url: 'api/tasks/add_to_general_list',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
  }),
});

// ✅ Экспортируем хуки для использования в компонентах
export const {
  useGetListsQuery,
  useGetListsTreeQuery,
  useGetDndTreeListsQuery,
  useGetListsMUITreeQuery,
  useAddObjectMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useLinkItemsMutation,
  useMoveItemsMutation,
  useDeleteFromChildesMutation,
  useAddToGeneralListMutation,
} = listsApi;
