import { createContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";

const AntiScheduleContext = createContext();

const api = async (url, method = 'GET', body = null) => {
  const token = localStorage.getItem('access_token');
  const headers = { "Content-Type": "application/json" };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Failed to fetch ${url}, status ${response.status}`);
  return response.json();
};

export const AntiScheduleProvider = ({ children, onError, setLoading }) => {
  const [antiSchedule, setAntiSchedule] = useState({ data: [], loading: false, error: null });
  const [version, setVersion] = useState(null);
  const fetching = useRef(false);

  const fetchAntiSchedule = useCallback(async () => {
    if (fetching.current) return;
    if (setLoading) setLoading(true);
    fetching.current = true;
    setAntiSchedule(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api('/tasks/get_anti_schedule');
      setAntiSchedule({ data: data.anti_schedule || data, loading: false, error: null });
      if (setLoading) setLoading(false);
      fetching.current = false;
      return data.anti_schedule || data;
    } catch (err) {
      if (onError) onError(err);
      setAntiSchedule(prev => ({ ...prev, loading: false, error: err }));
      if (setLoading) setLoading(false);
      fetching.current = false;
    }
  }, [onError, setLoading]);

  const addAntiTask = useCallback(async (params) => {
    const res = await api('/tasks/add_anti_task', 'POST', params);
    await fetchAntiSchedule();
    return res;
  }, [fetchAntiSchedule]);

  const updateAntiTask = useCallback(async (params) => {
    const res = await api('/tasks/edit_anti_task', 'PUT', params);
    await fetchAntiSchedule();
    return res;
  }, [fetchAntiSchedule]);

  const deleteAntiTask = useCallback(async (params) => {
    const res = await api('/tasks/del_anti_task', 'DELETE', params);
    await fetchAntiSchedule();
    return res;
  }, [fetchAntiSchedule]);

  const { tasksVersion: wsVersion } = useUpdateWebSocket();

  useEffect(() => {
    if (wsVersion) {
      fetchAntiSchedule();
      setVersion(wsVersion);
    }
  }, [wsVersion, fetchAntiSchedule]);

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
