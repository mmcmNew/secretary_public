
import { apiSlice } from './api/apiSlice';

export const websocketApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendMessageAPI: builder.mutation({
      query: (formData) => ({
        url: '/chat/new_message',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const { useSendMessageAPIMutation } = websocketApi;
