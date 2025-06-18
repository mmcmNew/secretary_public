import { useContext, useCallback } from 'react';
import ToDoContext from './ToDoContext';

export const useToDo = () => {
  return useContext(ToDoContext);
};
