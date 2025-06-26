import { useContext } from 'react';
import TasksContext from './TasksContext';

const useTasks = () => useContext(TasksContext);

export default useTasks; 