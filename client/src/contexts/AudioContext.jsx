import { createContext, useCallback, useRef } from 'react';

export const AudioContext = createContext({
  // src - URL of audio file
  // options: { queued: boolean, priority: number, element: HTMLAudioElement }
  playAudio: async () => {},
});

export function AudioProvider({ children }) {
  const queueRef = useRef([]);
  const playingRef = useRef(false);

  const playNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      playingRef.current = false;
      return;
    }

    playingRef.current = true;
    const { audio, resolve } = queueRef.current.shift();

    const finish = () => {
      resolve();
      playNext();
    };

    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  }, []);

  const playAudio = useCallback((src, options = {}) => {
    const { queued = false, priority = 0, element = null } = options;
    return new Promise((resolve) => {
      const audio = element || new Audio(src);
      if (element) {
        element.src = src;
      }

      if (queued) {
        const item = { audio, resolve, priority };
        const queue = queueRef.current;
        // insert by priority (desc)
        let inserted = false;
        for (let i = 0; i < queue.length; i++) {
          if (priority > queue[i].priority) {
            queue.splice(i, 0, item);
            inserted = true;
            break;
          }
        }
        if (!inserted) queue.push(item);
        if (!playingRef.current) {
          playNext();
        }
      } else {
        const finish = () => resolve();
        audio.onended = finish;
        audio.onerror = finish;
        audio.play().catch(finish);
      }
    });
  }, [playNext]);

  return (
    <AudioContext.Provider value={{ playAudio }}>
      {children}
    </AudioContext.Provider>
  );
}
