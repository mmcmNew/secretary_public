import { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { setCalendarVersion, useGetCalendarEventsQuery } from '../../store/calendarSlice';
import { setTasksVersion, useGetTasksQuery } from '../../store/tasksSlice';

export const UpdateWebSocketContext = createContext({});

export default function UpdateWebSocketProvider({ children }) {
  const dispatch = useDispatch();

  const { version: currentCalendarVersion, isFetching: isFetchingCalendar, range: calendarRange } = useSelector((state) => state.calendar);
  const { version: currentTasksVersion, isFetching: isFetchingTasks } = useSelector((state) => state.tasks);

  const { refetch: refetchCalendarEvents } = useGetCalendarEventsQuery(calendarRange, { skip: !calendarRange });
  const { refetch: refetchTasks } = useGetTasksQuery();

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
      if (data.tasksVersion && data.tasksVersion > currentTasksVersion && !isFetchingTasks) {
        dispatch(setTasksVersion(data.tasksVersion));
        refetchTasks();
      }
    });

    socket.on('task_changed', (data) => {
      // Этот обработчик может быть использован для более гранулярных обновлений,
      // но в рамках текущей логики, где data_updated триггерит полный рефетч по версии,
      // его можно оставить пустым или удалить, если он не нужен для других целей.
      // Если task_changed должен триггерить рефетч, то логика будет аналогична data_updated.
      // Для простоты, пока полагаемся на data_updated для общих версий.
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from updates WebSocket');
    });

    return () => socket.disconnect();
  }, [dispatch, currentCalendarVersion, isFetchingCalendar, calendarRange, currentTasksVersion, isFetchingTasks, refetchCalendarEvents, refetchTasks]);

  return (
    <UpdateWebSocketContext.Provider value={{}}>
      {children}
    </UpdateWebSocketContext.Provider>
  );
}

UpdateWebSocketProvider.propTypes = { children: PropTypes.node.isRequired };
