import { useState, useEffect } from 'react';
import { findNextTask, isTaskInPast } from './focusUtils';
import { useTasks } from '../../ToDo/hooks/useTasks';

export default function useFocusTasks(modeSettings, tasksArg = null, selectedListArg = null) {
  const context = useTasks();
  const tasksData = tasksArg !== null ? tasksArg : context.tasks?.data;
  const selectedList = selectedListArg !== null ? selectedListArg : context.selectedList;

  const [mainTasks, setMainTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [skippedTasks, setSkippedTasks] = useState([]);

  useEffect(() => {
    let newMain = [];
    const data = tasksData || [];
    if (modeSettings.isBackgroundTasks) {
      newMain = data.filter(t => selectedList?.childes_order?.includes(t.id));
    } else {
      newMain = data.filter(t => selectedList?.childes_order?.includes(t.id) && !t.is_background);
    }
    const nextTask = findNextTask(newMain, skippedTasks);
    setMainTasks(newMain);
    setCurrentTask(nextTask);
  }, [tasksData, selectedList, modeSettings.isBackgroundTasks, skippedTasks]);

  const handleSkipTask = () => {
    if (!currentTask) return;
    setSkippedTasks(prev => prev.includes(currentTask.id) ? prev : [...prev, currentTask.id]);
  };

  return { mainTasks, currentTask, skippedTasks, setSkippedTasks, handleSkipTask, findNextTask, isTaskInPast, setCurrentTask };
}
