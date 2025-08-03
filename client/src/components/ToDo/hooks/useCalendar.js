// hooks/useCalendar.js
import { useState, useCallback } from 'react';
import api from '../../../utils/api';

export const useCalendar = () => {
  const [calendarEvents, setCalendarEvents] = useState({ data: [], loading: false, error: null });
  const [calendarRange, setCalendarRange] = useState({ start: null, end: null });
  const [calendarSettings, setCalendarSettings] = useState({
    slotDuration: 30,
    timeRange: [8, 24],
    currentView: "timeGridWeek",
  });

  const fetchCalendarEvents = useCallback(async (range) => {
    const r = range || calendarRange;
    if (!r.start || !r.end) return;
    try {
      const params = new URLSearchParams(r);
      const { data } = await api.get(`/tasks/get_calendar_events?${params}`);
      setCalendarEvents({ data, loading: false, error: null });
    } catch (err) {
      setCalendarEvents(prev => ({ ...prev, loading: false, error: err }));
    }
  }, [calendarRange]);

  const handleCalendarSettingsSave = useCallback((settings, containerId, handleUpdateContent) => {
    setCalendarSettings(settings);
    handleUpdateContent?.(containerId, { calendarSettingsProp: settings });
  }, []);

  return {
    calendarEvents,
    calendarRange,
    setCalendarRange,
    calendarSettings,
    fetchCalendarEvents,
    handleCalendarSettingsSave,
  };
};