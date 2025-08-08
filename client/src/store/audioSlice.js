import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// A private queue to hold non-serializable audio data
const audioQueue = [];
let isPlaying = false;

// A function to play the next audio in the queue
const playNext = (dispatch) => {
  if (audioQueue.length === 0) {
    isPlaying = false;
    dispatch(setPlaying(false));
    return;
  }

  isPlaying = true;
  dispatch(setPlaying(true));
  const { audio, resolve } = audioQueue.shift();

  const finish = () => {
    resolve();
    playNext(dispatch);
  };

  audio.onended = finish;
  audio.onerror = finish;
  audio.play().catch(finish);
};

export const playAudio = createAsyncThunk(
  'audio/playAudio',
  async ({ src, options = {} }, { dispatch }) => {
    const { queued = false, priority = 0, element = null } = options;
    
    return new Promise((resolve) => {
      const audio = element || new Audio(src);
      if (element) {
        element.src = src;
      }

      if (queued) {
        const item = { audio, resolve, priority };
        
        // Insert by priority (desc)
        let inserted = false;
        for (let i = 0; i < audioQueue.length; i++) {
          if (priority > audioQueue[i].priority) {
            audioQueue.splice(i, 0, item);
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          audioQueue.push(item);
        }

        if (!isPlaying) {
          playNext(dispatch);
        }
      } else {
        const finish = () => resolve();
        audio.onended = finish;
        audio.onerror = finish;
        audio.play().catch(finish);
      }
    });
  }
);

const audioSlice = createSlice({
  name: 'audio',
  initialState: {
    isPlaying: false,
  },
  reducers: {
    setPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
  },
});

export const { setPlaying } = audioSlice.actions;
export default audioSlice.reducer;