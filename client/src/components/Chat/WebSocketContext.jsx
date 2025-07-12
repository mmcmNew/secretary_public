// WebSocketContext.jsx

import { createContext, useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import useContainer from '../DraggableComponents/useContainer';
import { apiPost } from '../../utils/api';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const [files, setFiles] = useState([])
  const { setUpdates, addContainer } = useContainer()

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.context && lastMessage.context.UPDATES) {
        console.log(lastMessage.context.UPDATES);
        setUpdates((prevUpdates) => [...prevUpdates, ...lastMessage.context.UPDATES]);
    }

    if (lastMessage && lastMessage.context && lastMessage.context?.component) {
        console.log(lastMessage.context.component);
        addContainer(lastMessage.context.component, lastMessage.context.params)
    }
}, [isNewMessage]);

  useEffect(() => {
    const socketIo = io('/chat', { transports: ['websocket'] });

    socketIo.on('connect', () => {
      console.log('Connected to WebSocket');

      // Запрашиваем список всех сообщений
      socketIo.emit('request_messages');
    });

    socketIo.on('all_messages', (allMessages) => {
      setMessages(allMessages);
    });

    socketIo.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      setIsNewMessage(true);
    });

    socketIo.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  async function sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket is not connected'));
        return;
      }

      socket.emit('new_message', message);

      socket.on('message', async (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          try { resolve(response);}
          catch (error) { reject(error); }
        }
      });
    });
  }


  async function sendMessageAPI(user_id, text, sendingFiles) {
    const timeZone = new Date().getTimezoneOffset();
    if (!sendingFiles) sendingFiles = files
    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('text', text);
    formData.append('timeZone', timeZone);
    sendingFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
    });
    // console.log(files)
    // console.log(formData.get('files'), formData.get('text'), formData.get('user_id'))
    const response = await apiPost('/chat/new_message', formData);
    const result = response.data;
    if (result.status_code == 201) {
      setFiles([])
      setMessages(prevMessages => [...prevMessages, ...result.messages]);
      setIsNewMessage(true);
    } else {
      throw new Error('Message sending failed');
    }
  }

  function sendTranscript (transcript) {
    const timeZone = new Date().getTimezoneOffset();
    if (!socket) {
      console.error('Socket is not connected');
      return;
    }
    try {
      const message_dict = {...transcript, timeZone};
      console.log(message_dict)
      socket.emit('new_transcript', message_dict);
    } catch (error) {
      console.error('Error sending transcript:', error);
    }
  }

  const sendEditedRecord = (params) => {
    const timeZone = new Date().getTimezoneOffset();
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket is not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Server timeout'));
      }, 5000);

      socket.emit('post_edited_record', params, timeZone);

      socket.on('post_edited_record_response', (response) => {
        clearTimeout(timeout);

        if (response.status === 'OK') {
          resolve(response);
        } else {
          reject(new Error(response.message || 'An unexpected error occurred'));
        }
      });
    });
  };

  return (
    <WebSocketContext.Provider value={{ messages, isNewMessage, setIsNewMessage, sendMessage, sendMessageAPI, sendTranscript, sendEditedRecord, files, setFiles }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
