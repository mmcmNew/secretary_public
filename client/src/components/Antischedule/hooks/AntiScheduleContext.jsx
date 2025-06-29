import { createContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import useUpdateWebSocket from '../../DraggableComponents/useUpdateWebSocket';

const AntiScheduleContext = createContext();

const api = async (url, method = 'GET', body = null) => {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Failed to fetch ${url}, status ${response.status}`);
  return response.json();
};

export const AntiScheduleProvider = ({ children }) => {
  const [antiSchedule, setAntiSchedule] = useState({ data: [], loading: false, error: null });
  const [version, setVersion] = useState(null);
  const fetching = useRef(false);

  const fetchAntiSchedule = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setAntiSchedule(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api(`/tasks/get_anti_schedule?version=${version || ''}`);
      setAntiSchedule({ data: data.anti_schedule || [], loading: false, error: null });
      setVersion(data.tasksVersion || version);
      return data.anti_schedule || [];
    } catch (error) {
      setAntiSchedule(prev => ({ ...prev, loading: false, error }));
      return [];
    } finally {
      fetching.current = false;
    }
  }, [version]);

  const { tasksVersion: wsVersion } = useUpdateWebSocket();

  useEffect(() => {
    if (wsVersion) {
      fetchAntiSchedule();
      setVersion(wsVersion);
    }
  }, [wsVersion, fetchAntiSchedule]);

  const addAntiTask = useCallback(params => api('/tasks/add_anti_task', 'POST', params), []);
  const updateAntiTask = useCallback(params => api('/tasks/edit_anti_task', 'PUT', params), []);
  const deleteAntiTask = useCallback(params => api('/tasks/del_anti_task', 'DELETE', params), []);

  const contextValue = useMemo(() => ({
    antiSchedule,
    fetchAntiSchedule,
    addAntiTask,
    updateAntiTask,
    deleteAntiTask,
    version,
    setVersion,
  }), [antiSchedule, fetchAntiSchedule, addAntiTask, updateAntiTask, deleteAntiTask, version]);

  return <AntiScheduleContext.Provider value={contextValue}>{children}</AntiScheduleContext.Provider>;
};

AntiScheduleProvider.propTypes = { children: PropTypes.node.isRequired };

export default AntiScheduleContext;
