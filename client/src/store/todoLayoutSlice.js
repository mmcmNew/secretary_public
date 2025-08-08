import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedListId: null,
};

export const todoLayoutSlice = createSlice({
  name: 'todoLayout',
  initialState,
  reducers: {
    setSelectedListId: (state, action) => {
      state.selectedListId = action.payload;
    },
  },
});

export const { setSelectedListId } = todoLayoutSlice.actions;

export default todoLayoutSlice.reducer;