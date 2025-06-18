// Chat.jsx
import { Accordion, AccordionSummary, AccordionDetails, Typography, Icon } from '@mui/material';
import MessagesList from './Chat/MessagesList';
import SendMessageForm from './Chat/SendMessageForm';
import { WebSocketProvider } from './Chat/WebSocketContext';

function ChatAccordion() {

  return (
    <Accordion sx={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      width: '600px',
      maxWidth: '100%',
      zIndex: 999,
    }}>
      <AccordionSummary expandIcon={<Icon>expand_less</Icon>} sx={{
          border: '1px solid',
        }}>
        <Typography>Chat</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          // gap: 1,
          height: '70vh',
          // maxHeight: '100%',
        }}>
        <WebSocketProvider >
          <MessagesList />
          <SendMessageForm />
        </WebSocketProvider >
      </AccordionDetails>
    </Accordion>
  );
}

export default ChatAccordion;
