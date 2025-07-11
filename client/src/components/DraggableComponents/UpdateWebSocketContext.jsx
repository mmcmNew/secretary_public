import { createContext, useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';

export const UpdateWebSocketContext = createContext({});

export default function UpdateWebSocketProvider({ children }) {
  const [versions, setVersions] = useState({});

  useEffect(() => {
    const socket = io('/updates', { transports: ['websocket'], secure: true, });
    // console.log(socket)
    socket.on('connect', () => {
      console.log('Connected to updates WebSocket');
    });

    socket.on('data_updated', (data) => {
      // console.log('data_updated', data);
      setVersions((prev) => ({ ...prev, ...data }));
    });

    socket.on('task_changed', (data) => {
      // console.log('task_changed', data);
      setVersions((prev) => ({ ...prev, taskChange: data, timestamp: Date.now() }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from updates WebSocket');
    });

    return () => socket.disconnect();
  }, []);

  return (
    <UpdateWebSocketContext.Provider value={versions}>
      {children}
    </UpdateWebSocketContext.Provider>
  );
}

UpdateWebSocketProvider.propTypes = { children: PropTypes.node.isRequired };
