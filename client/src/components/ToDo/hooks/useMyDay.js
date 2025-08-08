// hooks/useMyDay.js
import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
// import api from '../../../utils/api';

dayjs.extend(utc);

export const useMyDay = () => {
  const [myDayTasks, setMyDayTasks] = useState({ data: [], loading: false, error: null });
  const [myDayList, setMyDayList] = useState(null);

  const fetchMyDayTasks = useCallback(async () => {
    try {
      const start = dayjs().startOf('day').utc().toISOString();
      const end = dayjs().endOf('day').utc().toISOString();
      const params = new URLSearchParams({ list_id: 'my_day', start, end });
      // const { data } = await api.get(`/tasks/get_tasks?${params}`);
      // setMyDayTasks({ data: data.tasks || [], loading: false, error: null });
    } catch (err) {
      setMyDayTasks(prev => ({ ...prev, loading: false, error: err }));
    }
  }, []);

  const findMyDayList = useCallback((allLists) => {
    const myDay = allLists.find(l => l.id === 'my_day');
    setMyDayList(myDay || null);
  }, []);

  return {
    myDayTasks,
    myDayList,
    fetchMyDayTasks,
    findMyDayList,
  };
};