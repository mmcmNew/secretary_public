import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import useTasks from '../../ToDo/hooks/useTasks';
import useLists from '../../ToDo/hooks/useLists';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function useFocusTasks(modeSettings) {
  const { tasks } = useTasks();
  const { selectedList } = useLists();

  const [mainTasks, setMainTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [skippedTasks, setSkippedTasks] = useState([]);

  useEffect(() => {
    let newMain = [];
    const data = tasks?.data || [];
    if (modeSettings.isBackgroundTasks) {
      newMain = data.filter(t => selectedList?.childes_order?.includes(t.id));
    } else {
      newMain = data.filter(t => selectedList?.childes_order?.includes(t.id) && !t.is_background);
    }
    const nextTask = findNextTask(newMain, skippedTasks);
    setMainTasks(newMain);
    setCurrentTask(nextTask);
  }, [tasks, selectedList, modeSettings.isBackgroundTasks, skippedTasks]);

  const handleSkipTask = () => {
    if (!currentTask) return;
    setSkippedTasks(prev => prev.includes(currentTask.id) ? prev : [...prev, currentTask.id]);
  };

  const isTaskInPast = (task, tz = null) => {
    if (!task || !task.deadline) return false;
    if (!tz) tz = dayjs.tz.guess();
    const current = dayjs().tz(tz);
    const end = dayjs(task.deadline).tz(tz);
    const curMin = current.hour()*60 + current.minute();
    const endMin = end.hour()*60 + (end.minute() - 1);
    return endMin <= curMin;
  };

  const findNextTask = (list, skipped) => {
    const filtered = list.filter(t => !skipped.includes(t.id));
    return filtered.find(t => !isTaskInPast(t)) || null;
  };

  return { mainTasks, currentTask, skippedTasks, setSkippedTasks, handleSkipTask, findNextTask, isTaskInPast, setCurrentTask };
}
