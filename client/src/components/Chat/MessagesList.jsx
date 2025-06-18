import { Box, Divider, IconButton, Icon, LinearProgress } from '@mui/material';
import ChatMessage from './ChatMessage';
import { useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import useWebSocket from './hooks/useWebSocket';
import useContainer from '../DraggableComponents/useContainer';

// Функция для преобразования времени из UTC в локальную дату (год, месяц, день)
function formatToLocalDate(utcDatetime) {
  const date = new Date(utcDatetime);
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Функция для преобразования времени из UTC в локальное время (часы и минуты)
function formatToLocalTime(utcDatetime) {
  const date = new Date(utcDatetime);
  return new Intl.DateTimeFormat('default', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function MessagesList() {
  const audioRef = useRef(null);
  const virtuosoRef = useRef(null);
  const { messages, isNewMessage, setIsNewMessage } = useWebSocket();
  const {setIsSecretarySpeak} = useContainer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  function handlePlay() {
    if ( isPlaying || isLoading) {
      return;
    }
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.user.id === 1) {
      return;
    }
    const audioUrl = `/temp/edge_audio_${lastMessage.message_id}.mp3`;
    audioRef.current.src = audioUrl;
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsSecretarySpeak(false)
      } else {
        audioRef.current.play();
        setIsSecretarySpeak(true)
      }
      setIsPlaying(!isPlaying);
    }
  }

  // Автоматическое воспроизведение нового сообщения
  useEffect(() => {
    if (isNewMessage) {
      setIsNewMessage(false)
      handlePlay();
    }
  }, [messages]);

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
      audio.addEventListener('ended', () => {setIsPlaying(false); setIsSecretarySpeak(false)});
    }

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', () => {setIsPlaying(false); setIsSecretarySpeak(false)});
      }
    };
  }, []);

  // Прокрутка вниз при изменении сообщений
  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Используем объект для хранения предыдущей даты
  let previousDate = '';

  return (
    <Box sx={{ height: '90%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
        <IconButton onClick={handlePlay} aria-label="play">
          {isLoading ? (
            <Icon>hourglass_empty</Icon>
          ) : isPlaying ? (
            <Icon>pause</Icon>
          ) : (
            <Icon>play_arrow</Icon>
          )}
        </IconButton>
        <audio
          ref={audioRef}
          onCanPlay={() => setIsLoading(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadStart={() => setIsLoading(true)}
        />
        <LinearProgress variant="determinate" value={progress} style={{ width: '100%' }} />
      </Box>
      <Box sx={{ overflowY: 'auto', p: 1, flexGrow: 1 }}>
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          itemContent={(index, message) => {
            const messageDate = formatToLocalDate(message.datetime);
            const messageTime = formatToLocalTime(message.datetime);

            const showDivider = messageDate !== previousDate;
            previousDate = messageDate;

            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                {showDivider && <Divider>{messageDate}</Divider>}
                <ChatMessage message={message} message_time={messageTime} />
              </div>
            );
          }}
        />
      </Box>
    </Box>
  );
}

export default MessagesList;
