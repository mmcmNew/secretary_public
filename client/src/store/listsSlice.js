
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
      query: () => '/tasks/lists',
      providesTags: ['List'],
    }),
    getListsTree: builder.query({
      query: () => '/tasks/get_lists_tree',
      providesTags: ['List'],
    }),
    addObject: builder.mutation({
      query: (newObject) => ({
        url: '/tasks/add_list',
        method: 'POST',
        body: newObject,
      }),
      invalidatesTags: ['List'],
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
  useAddObjectMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useMoveListObjectMutation,
} = listsApi;
