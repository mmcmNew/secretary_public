import { createContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";
import api from '../../../utils/api';
import useContainer from '../../DraggableComponents/useContainer';

const AntiScheduleContext = createContext();


export const AntiScheduleProvider = ({ children, onError, setLoading }) => {
  const [antiSchedule, setAntiSchedule] = useState({ data: [], loading: false, error: null });
  const [version, setVersion] = useState(null);
  const fetching = useRef(false);
  const { draggingContainer } = useContainer();

  const fetchAntiSchedule = useCallback(async () => {
    if (fetching.current) return;
    if (setLoading) setLoading(true);
    fetching.current = true;
    setAntiSchedule(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api(`/tasks/get_anti_schedule?version=${version || ''}`);
      if (data.version_matches) {
        setVersion(data.version);
        setAntiSchedule(prev => ({ ...prev, loading: false }));
        fetching.current = false;
        if (setLoading) setLoading(false);
        return antiSchedule.data;
      }
      setAntiSchedule({ data: data.anti_schedule || data, loading: false, error: null });
      setVersion(data.tasksVersion || data.version || version);
      if (setLoading) setLoading(false);
      fetching.current = false;
      return data.anti_schedule || data;
    } catch (err) {
      if (onError) onError(err);
      setAntiSchedule(prev => ({ ...prev, loading: false, error: err }));
      if (setLoading) setLoading(false);
      fetching.current = false;
    }
  }, [onError, setLoading, version]);

  const addAntiTask = useCallback(async (params) => {
    const res = await api('/tasks/add_anti_task', 'POST', params);
    if (res.task) {
      setAntiSchedule(prev => ({
        ...prev,
        data: [...prev.data, res.task],
      }));
    }
    return res;
  }, []);

  const updateAntiTask = useCallback(async (params) => {
    const res = await api('/tasks/edit_anti_task', 'PUT', params);
    if (res.task) {
      setAntiSchedule(prev => ({
        ...prev,
        data: prev.data.map(task =>
          task.id === params.taskId ? { ...task, ...res.task } : task
        ),
      }));
    }
    return res;
  }, []);

  const deleteAntiTask = useCallback(async (params) => {
    const res = await api('/tasks/del_anti_task', 'DELETE', params);
    if (res.success) {
      setAntiSchedule(prev => ({
        ...prev,
        data: prev.data.filter(task => task.id !== params.taskId),
      }));
    }
    return res;
  }, []);

  const { tasksVersion: wsVersion } = useUpdateWebSocket();

  useEffect(() => {
    if (draggingContainer) return;
    if (wsVersion) {
      fetchAntiSchedule();
      setVersion(wsVersion);
    }
  }, [wsVersion, fetchAntiSchedule, draggingContainer]);

  const contextValue = useMemo(() => ({
    antiSchedule,
    fetchAntiSchedule,
    addAntiTask,
    updateAntiTask,
    deleteAntiTask,
    version,
    setVersion,
    loading: antiSchedule.loading,
  }), [antiSchedule, fetchAntiSchedule, addAntiTask, updateAntiTask, deleteAntiTask, version]);

  return (
    <AntiScheduleContext.Provider value={contextValue}>
      {children}
    </AntiScheduleContext.Provider>
  );
};

AntiScheduleProvider.propTypes = { children: PropTypes.node.isRequired };

export default AntiScheduleContext;
