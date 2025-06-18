import { useState, useEffect, useRef } from 'react';

function useAudioPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  function playAudio(messageId) {
    if (isLoading || isPlaying) return;
    const audioUrl = `/temp/edge_audio_${messageId}.mp3`;
    audioRef.current.src = audioUrl;
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }

  useEffect(() => {
    function updateProgress() {
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      }
    }

    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', () => setIsPlaying(false));
    }

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      }
    };
  }, []);

  return {
    audioRef,
    isPlaying,
    isLoading,
    progress,
    playAudio,
  };
}

export default useAudioPlayer;
