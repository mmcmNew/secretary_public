
import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';

const listsSlice = createSlice({
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
      query: () => '/tasks/get_lists',
      providesTags: ['List'],
    }),
    getListsTree: builder.query({
      query: () => '/tasks/get_lists_tree',
      providesTags: ['List'],
    }),
    getDndTreeLists: builder.query({
      query: () => '/tasks/dnd-tree-lists',
      providesTags: ['List'],
    }),
    getListsMUITree: builder.query({
      query: () => '/tasks/get_lists_mui_tree',
      providesTags: ['List'],
    }),
    addObject: builder.mutation({
      query: (newObject) => ({
        url: '/tasks/add_list',
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
        url: '/tasks/edit_list',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['List'],
    }),
    deleteList: builder.mutation({
      query: (id) => ({
        url: `/tasks/lists/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['List'],
    }),
    moveListObject: builder.mutation({
      query: (data) => ({
        url: '/tasks/move_list_or_group',
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
  useMoveListObjectMutation,
} = listsApi;
