import { useEffect } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import useLists from '../ToDo/hooks/useLists';
import useTasks from '../ToDo/hooks/useTasks';

export default function UpdateWebSocketProvider({ children }) {
  const { fetchLists, setVersion: setListsVersion } = useLists();
  const { selectedTaskId, fetchTasks, setVersion: setTasksVersion } = useTasks();

  useEffect(() => {
    const socket = io('/updates', { transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('Connected to updates WebSocket');
    });

    socket.on('data_updated', ({ version }) => {
      console.log('data_updated', version);
      if (typeof fetchLists === 'function') fetchLists();
      if (typeof fetchTasks === 'function' && selectedTaskId) fetchTasks(selectedTaskId);
      if (typeof setListsVersion === 'function') setListsVersion(version);
      if (typeof setTasksVersion === 'function') setTasksVersion(version);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from updates WebSocket');
    });

    return () => socket.disconnect();
  }, [fetchLists, fetchTasks, selectedTaskId, setListsVersion, setTasksVersion]);

  return children;
}

UpdateWebSocketProvider.propTypes = { children: PropTypes.node.isRequired };
