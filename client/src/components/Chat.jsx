// Chat.jsx
import { Box } from '@mui/material';
import MessagesList from './Chat/MessagesList';
import SendMessageForm from './Chat/SendMessageForm';
import { WebSocketProvider } from './Chat/WebSocketContext';

function Chat() {

  return (
    <Box sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: '100%',
        // maxHeight: '100%',
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
