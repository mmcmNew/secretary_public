import { createContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { setCalendarVersion, useGetCalendarEventsQuery } from '../../store/calendarSlice';
import { setTasksVersion, tasksApi } from '../../store/tasksSlice'; // ✅ ВОССТАНОВЛЕНО: setTasksVersion

export const UpdateWebSocketContext = createContext({});

export default function UpdateWebSocketProvider({ children }) {
  const dispatch = useDispatch();

  const { version: currentCalendarVersion, isFetching: isFetchingCalendar, range: calendarRange } = useSelector((state) => state.calendar);
  // ✅ ВОССТАНОВЛЕНО: версия для WebSocket уведомлений
  const { version: currentTasksVersion } = useSelector((state) => state.tasks);

  const { refetch: refetchCalendarEvents } = useGetCalendarEventsQuery(calendarRange, { skip: !calendarRange });

  useEffect(() => {
    const socket = io('/updates', { transports: ['websocket'], secure: true });

    socket.on('connect', () => {
      console.log('Connected to updates WebSocket');
    });

    socket.on('data_updated', (data) => {
      // console.log('data_updated', data);
      if (data.calendarVersion && data.calendarVersion > currentCalendarVersion && !isFetchingCalendar) {
        dispatch(setCalendarVersion(data.calendarVersion));
        if (calendarRange) {
          refetchCalendarEvents();
        }
      }
      
      // ✅ ОБНОВЛЕНО: WebSocket + автоматическая проверка версии
      if (data.tasksVersion && data.tasksVersion > currentTasksVersion) {
        console.log(`🔄 WebSocket: версия задач обновлена ${currentTasksVersion} → ${data.tasksVersion}`);
        // Обновляем локальную версию
        dispatch(setTasksVersion(data.tasksVersion));
        // Инвалидируем кэш для перезагрузки данных
        dispatch(tasksApi.util.invalidateTags(['Task']));
      }
    });

    socket.on('task_changed', (data) => {
      // ✅ Более гранулярное обновление через RTK Query
      if (data.taskId) {
        console.log('🔄 WebSocket: invalidating specific task cache');
        // Инвалидируем конкретную задачу
        dispatch(tasksApi.util.invalidateTags([{ type: 'Task', id: data.taskId }]));
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from updates WebSocket');
    });

    // ✅ ВОССТАНОВЛЕНО: currentTasksVersion в зависимостях
    return () => socket.disconnect();
  }, [dispatch, currentCalendarVersion, isFetchingCalendar, calendarRange, currentTasksVersion, refetchCalendarEvents]);

  return (
    <UpdateWebSocketContext.Provider value={{}}>
      {children}
    </UpdateWebSocketContext.Provider>
  );
}

UpdateWebSocketProvider.propTypes = { children: PropTypes.node.isRequired };
