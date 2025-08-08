
import { apiSlice } from '../api/apiSlice';

export const memoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendNewRecord: builder.mutation({
      query: ({ table_name, record_info }) => ({
        url: '/post_new_record',
        method: 'POST',
        body: { table_name, record_info },
      }),
    }),
  }),
});

export const { useSendNewRecordMutation } = memoryApi;
