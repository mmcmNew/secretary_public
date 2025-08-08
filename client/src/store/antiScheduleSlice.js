
import { createSlice } from '@reduxjs/toolkit';
// import api from '../utils/api';

// export const fetchAntiSchedule = createAsyncThunk('antiSchedule/fetchAntiSchedule', async (_, { rejectWithValue }) => {
//   try {
//     const response = await api.get('/tasks/get_anti_schedule');
//     return response.data.anti_schedule || response.data;
//   } catch (error) {
//     return rejectWithValue(error.response.data);
//   }
// });

// export const addAntiTask = createAsyncThunk('antiSchedule/addAntiTask', async (taskData, { rejectWithValue }) => {
//   try {
//     const response = await api.post('/tasks/add_anti_task', taskData);
//     return response.data.task;
//   } catch (error) {
//     return rejectWithValue(error.response.data);
//   }
// });

// export const updateAntiTask = createAsyncThunk('antiSchedule/updateAntiTask', async (taskData, { rejectWithValue }) => {
//   try {
//     const response = await api.put(`/tasks/edit_anti_task`, taskData);
//     return response.data.task;
//   } catch (error) {
//     return rejectWithValue(error.response.data);
//   }
// });

// export const deleteAntiTask = createAsyncThunk('antiSchedule/deleteAntiTask', async (taskId, { rejectWithValue }) => {
//   try {
//     await api.delete(`/tasks/del_anti_task`, { data: { taskId } });
//     return taskId;
//   } catch (error) {
//     return rejectWithValue(error.response.data);
//   }
// });

const antiScheduleSlice = createSlice({
  name: 'antiSchedule',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
    //   .addCase(fetchAntiSchedule.pending, (state) => {
    //     state.loading = true;
    //     state.error = null;
    //   })
    //   .addCase(fetchAntiSchedule.fulfilled, (state, action) => {
    //     state.loading = false;
    //     state.data = action.payload;
    //   })
    //   .addCase(fetchAntiSchedule.rejected, (state, action) => {
    //     state.loading = false;
    //     state.error = action.payload;
    //   })
    //   .addCase(addAntiTask.fulfilled, (state, action) => {
    //     state.data.push(action.payload);
    //   })
    //   .addCase(updateAntiTask.fulfilled, (state, action) => {
    //     const index = state.data.findIndex(task => task.id === action.payload.id);
    //     if (index !== -1) {
    //       state.data[index] = action.payload;
    //     }
    //   })
    //   .addCase(deleteAntiTask.fulfilled, (state, action) => {
    //     state.data = state.data.filter(task => task.id !== action.payload);
    //   });
  },
});

export default antiScheduleSlice.reducer;
