
import { apiSlice } from './api/apiSlice';

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendMessageToAI: builder.mutation({
      query: (payload) => ({
        url: '/ai_record_fix',
        method: 'POST',
        body: payload,
      }),
    }),
    aiPostGenerate: builder.mutation({
      query: (payload) => ({
        url: '/ai_post_generate',
        method: 'POST',
        body: payload,
      }),
    }),
    postRecordToSocials: builder.mutation({
      query: (payload) => ({
        url: '/messengers/post_record_to_socials',
        method: 'POST',
        body: payload,
      }),
    }),
    getAllFilters: builder.query({
      query: (tableName) => `/get_tables_filters/${tableName}`,
    }),
    getFilteredData: builder.mutation({
      query: ({ tableName, filters }) => ({
        url: '/get_records',
        method: 'POST',
        body: { table_name: tableName, filters },
      }),
    }),
    getTablesList: builder.query({
      query: () => '/get_tables',
    }),
    getTableData: builder.query({
      query: ({ tableName, date }) => {
        const timezoneOffset = new Date().getTimezoneOffset() * 60000;
        return `/get_table_data?table_name=${tableName}&date=${date}&timezone_offset=${timezoneOffset}`;
      },
    }),
    getDatesList: builder.query({
      query: ({ tableName, month, year, timezone }) => {
        const formattedMonth = month < 10 ? `0${month}` : `${month}`;
        return `/get_days?table_name=${tableName}&month=${formattedMonth}&year=${year}&timezone=${timezone}`;
      },
    }),
    updateRecordFromBlocks: builder.mutation({
      query: ({ table_name, records }) => ({
        url: '/update_record_from_blocks',
        method: 'POST',
        body: { table_name, records },
      }),
    }),
    generateImageForRecord: builder.mutation({
      query: ({ table_name, record_id, text }) => ({
        url: '/generate-image',
        method: 'POST',
        body: { table_name, record_id, text },
      }),
    }),
    getTtsAudioFilename: builder.mutation({
      query: (text) => ({
        url: '/get_tts_audio_filename',
        method: 'POST',
        body: new URLSearchParams({ text }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    }),
  }),
});

export const {
  useSendMessageToAIMutation,
  useAiPostGenerateMutation,
  usePostRecordToSocialsMutation,
  useGetAllFiltersQuery,
  useGetFilteredDataMutation,
  useGetTablesListQuery,
  useGetTableDataQuery,
  useGetDatesListQuery,
  useUpdateRecordFromBlocksMutation,
  useGenerateImageForRecordMutation,
  useGetTtsAudioFilenameMutation,
} = chatApi;
