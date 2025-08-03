import { useState, useCallback, useContext } from 'react';
import { useTasks } from './useTasks';
import { ErrorContext } from '../../../contexts/ErrorContext';

export default function useNewTaskInput() {
  const { addTask } = useTasks({
    onError: (error) => {
      console.error('Error in useTasks:', error);
      if (setError) setError(error);
    }
  });
  const { setError, setSuccess } = useContext(ErrorContext);
  const [newTask, setNewTask] = useState('');

  const submitTask = useCallback(async () => {
    if (newTask.trim() === '') return;
    try {
      await addTask({ title: newTask });
      if (setSuccess) setSuccess('Задача добавлена');
      setNewTask('');
    } catch (err) {
      if (setError) setError(err);
    }
  }, [newTask, addTask, setError, setSuccess]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitTask();
      }
    },
    [submitTask]
  );

  return { newTask, setNewTask, handleKeyDown, submitTask };
}
