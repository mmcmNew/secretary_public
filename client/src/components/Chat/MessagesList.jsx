import { Box, Divider } from '@mui/material';
import ChatMessage from './ChatMessage';
import { useEffect, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import useWebSocket from './hooks/useWebSocket';

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
  const virtuosoRef = useRef(null);
  const { messages } = useWebSocket();

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
