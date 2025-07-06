import { createContext, useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import { AuthContext } from '../../contexts/AuthContext.jsx';

export const UpdateWebSocketContext = createContext({});

export default function UpdateWebSocketProvider({ children }) {
  const [versions, setVersions] = useState({});
  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!user || isLoading) return undefined;
    const socket = io('/updates', { transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('Connected to updates WebSocket');
    });

    socket.on('data_updated', (data) => {
      console.log('data_updated', data);
      setVersions((prev) => ({ ...prev, ...data }));
    });

    socket.on('task_changed', (data) => {
      console.log('task_changed', data);
      setVersions((prev) => ({ ...prev, taskChange: data, timestamp: Date.now() }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from updates WebSocket');
    });

    return () => socket.disconnect();
  }, [user, isLoading]);

  return (
    <UpdateWebSocketContext.Provider value={versions}>
      {children}
    </UpdateWebSocketContext.Provider>
  );
}

UpdateWebSocketProvider.propTypes = { children: PropTypes.node.isRequired };
