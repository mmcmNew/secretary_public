import { playAudio, playNextInQueue, setIsPlaying } from './audioSlice';

const audioMiddleware = store => {
  let currentAudio = null;

  const play = (src, options = {}) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    currentAudio = options.element || new Audio(src);
    if (options.element) {
        options.element.src = src;
    }

    const onEnded = () => {
      currentAudio = null;
      // Если в очереди есть еще треки, запускаем следующий
      const nextInQueue = store.getState().audio.queue[0];
      if (nextInQueue) {
        store.dispatch(playNextInQueue());
        play(nextInQueue.src, nextInQueue.options);
      } else {
        store.dispatch(setIsPlaying(false));
      }
    };

    currentAudio.onended = onEnded;
    currentAudio.onerror = onEnded; // Обрабатываем ошибку так же, как и окончание

    currentAudio.play().catch(onEnded);
    store.dispatch(setIsPlaying(true));
  };

  return next => action => {
    if (playAudio.match(action)) {
      // Перехватываем экшен playAudio
      const { src, options } = action.payload;
      play(src, options);
    } else if (playNextInQueue.match(action)) {
        // Этот экшен просто проходит дальше в редьюсер
    } else if (store.getState().audio.queue.length > 0 && !store.getState().audio.isPlaying) {
        // Если есть что-то в очереди и ничего не играет, запускаем воспроизведение
        const nextInQueue = store.getState().audio.queue[0];
        if (nextInQueue) {
            play(nextInQueue.src, nextInQueue.options);
        }
    }

    return next(action);
  };
};

export default audioMiddleware;
