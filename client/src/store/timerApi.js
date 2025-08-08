
import { apiSlice } from './api/apiSlice';

export const timerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTtsAudio: builder.mutation({
      query: (text) => ({
        url: '/get_tts_audio',
        method: 'POST',
        body: new URLSearchParams({ text }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const { useGetTtsAudioMutation } = timerApi;
