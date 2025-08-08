import { useDispatch, useSelector } from 'react-redux';
import { playAudio } from './audioSlice';

export const useAudio = () => {
  const dispatch = useDispatch();
  const isPlaying = useSelector(state => state.audio.isPlaying);
  
  const playAudioFunc = (src, options = {}) => {
    return dispatch(playAudio({ src, options }));
  };
  
  return {
    playAudio: playAudioFunc,
    isPlaying,
  };
};