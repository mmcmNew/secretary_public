import { createSlice } from '@reduxjs/toolkit';

const updatesSlice = createSlice({
  name: 'updates',
  initialState: {
    versions: {},
  },
  reducers: {
    setVersions: (state, action) => {
      state.versions = { ...state.versions, ...action.payload };
    },
    setTaskChange: (state, action) => {
      state.versions.taskChange = action.payload;
      state.versions.timestamp = Date.now();
    },
  },
});

export const { setVersions, setTaskChange } = updatesSlice.actions;
export default updatesSlice.reducer;