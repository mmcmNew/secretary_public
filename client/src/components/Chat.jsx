// Chat.jsx
import { Box, Typography, Button } from '@mui/material';
import MessagesList from './Chat/MessagesList';
import SendMessageForm from './Chat/SendMessageForm';
import { WebSocketProvider } from './Chat/WebSocketContext';
import { useAccessControl } from '../contexts/AccessControlContext';

function Chat() {
  const { hasAccess } = useAccessControl();

  if (!hasAccess('chat')) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Чат доступен только в платных тарифах
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Обновите тариф для доступа к функции чата
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }}>
          Выбрать тариф
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: '100%',
        width: '100%'
      }}>
      <WebSocketProvider >
        <MessagesList />
        <SendMessageForm />
      </WebSocketProvider>
    </Box>
  );
}

export default Chat;
