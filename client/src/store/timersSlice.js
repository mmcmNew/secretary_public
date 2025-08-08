
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import { apiPost } from "../utils/api";

export const saveTimers = createAsyncThunk('timers/saveTimers', async (timers, { getState, rejectWithValue }) => {
  try {
    // const { dashboard } = getState();
    // await apiPost("/post_timers", { dashboardId: dashboard.id, timers });
    // return timers;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const timersSlice = createSlice({
  name: 'timers',
  initialState: {
    timers: [],
    loading: false,
    error: null,
  },
  reducers: {
    setTimers: (state, action) => {
      state.timers = action.payload;
    },
    addTimer: (state, action) => {
      state.timers.push(action.payload);
    },
    removeTimer: (state, action) => {
      state.timers = state.timers.filter(timer => timer.id !== action.payload);
    },
    updateTimer: (state, action) => {
      const index = state.timers.findIndex(timer => timer.id === action.payload.id);
      if (index !== -1) {
        state.timers[index] = { ...state.timers[index], ...action.payload.data };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveTimers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveTimers.fulfilled, (state, action) => {
        state.loading = false;
        state.timers = action.payload;
      })
      .addCase(saveTimers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setTimers, addTimer, removeTimer, updateTimer } = timersSlice.actions;

export default timersSlice.reducer;
