import { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';

export const UpdateWebSocketContext = createContext({ version: null });

export default function UpdateWebSocketProvider({ children }) {
  const [version, setVersion] = useState(null);

  useEffect(() => {
    const socket = io('/updates', { transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('Connected to updates WebSocket');
    });

    socket.on('data_updated', ({ version: newVersion }) => {
      console.log('data_updated', newVersion);
      setVersion(newVersion);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from updates WebSocket');
    });

    return () => socket.disconnect();
  }, []);

  return (
    <UpdateWebSocketContext.Provider value={{ version }}>
      {children}
    </UpdateWebSocketContext.Provider>
  );
}

UpdateWebSocketProvider.propTypes = { children: PropTypes.node.isRequired };
