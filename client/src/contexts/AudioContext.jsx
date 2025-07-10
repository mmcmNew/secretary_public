import { createContext, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

export const AudioContext = createContext({
  playSound: () => Promise.resolve(),
});

export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio());

  const playSound = useCallback((src) => {
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve();
        return;
      }
      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;
      audio.onended = resolve;
      audio.onerror = reject;
      audio.src = src;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(reject);
      }
    });
  }, []);

  return (
    <AudioContext.Provider value={{ playSound }}>
      {children}
    </AudioContext.Provider>
  );
}

AudioProvider.propTypes = {
  children: PropTypes.node,
};
