import { createContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";

const CalendarContext = createContext();

// API Helper
const api = async (url, method = 'GET', body = null) => {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Failed to fetch ${url}, status ${response.status}`);
  return response.json();
};

export const CalendarProvider = ({ children }) => {
  const [calendarEvents, setCalendarEvents] = useState({ data: [], loading: false, error: null });
  const [version, setVersion] = useState(null);
  const fetching = useRef(false);

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

  useEffect(() => {
    if (wsVersion) {
      fetchCalendarEvents();
      setVersion(wsVersion);
    }
  }, [wsVersion, fetchCalendarEvents, setVersion]);

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