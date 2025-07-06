import { createContext, useState, useCallback, useMemo, useRef, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";
import api from '../../../utils/api';
import { AuthContext } from '../../../contexts/AuthContext.jsx';
import useContainer from '../../DraggableComponents/useContainer';

const CalendarContext = createContext();


export const CalendarProvider = ({ children }) => {
  const [calendarEvents, setCalendarEvents] = useState({ data: [], loading: false, error: null });
  const [version, setVersion] = useState(null);
  const fetching = useRef(false);
  const { draggingContainer } = useContainer();

  // Получить события календаря
  const fetchCalendarEvents = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setCalendarEvents(prev => ({ ...prev, loading: true, error: null }));
      try {
        const data = await api(`/tasks/get_tasks?list_id=events&version=${version}`);
        setCalendarEvents({ data: data.tasks || data, loading: false, error: null });
        setVersion(data.tasksVersion || version);
      return data.tasks || data;
    } catch (error) {
      setCalendarEvents(prev => ({ ...prev, loading: false, error }));
      return [];
    } finally {
      fetching.current = false;
    }
  }, [version]);

  const { tasksVersion: wsVersion } = useUpdateWebSocket();
  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (draggingContainer) return;
    if (wsVersion && wsVersion !== version) {
      fetchCalendarEvents();
      setVersion(wsVersion);
    }
  }, [wsVersion, version, fetchCalendarEvents, draggingContainer]);

  // Начальная загрузка
  useEffect(() => {
    if (!isLoading && user) {
      fetchCalendarEvents();
    }
  }, [user, isLoading, fetchCalendarEvents]);

  // Обновить событие календаря
  const updateCalendarEvent = useCallback((params) => api("/tasks/edit_task", "PUT", params), []);
  // Добавить событие
  const addCalendarEvent = useCallback((params) => api("/tasks/add_task", "POST", params), []);
  // Удалить событие
  const deleteCalendarEvent = useCallback((params) => api("/tasks/del_task", "DELETE", params), []);

  const contextValue = useMemo(() => ({
    calendarEvents,
    fetchCalendarEvents,
    updateCalendarEvent,
    addCalendarEvent,
    deleteCalendarEvent,
    version,
    setVersion,
  }), [calendarEvents, fetchCalendarEvents, updateCalendarEvent, addCalendarEvent, deleteCalendarEvent, version]);

  return <CalendarContext.Provider value={contextValue}>{children}</CalendarContext.Provider>;
};

CalendarProvider.propTypes = { children: PropTypes.node.isRequired };

export default CalendarContext; 