import { createContext, useState, useCallback, useMemo, useRef, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";
import useLists from './useLists';
import { AuthContext } from '../../../contexts/AuthContext';

const TasksContext = createContext();

// API Helper
const api = async (url, method = 'GET', body = null) => {
  const token = localStorage.getItem('access_token');
  const headers = { "Content-Type": "application/json" };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Failed to fetch ${url}, status ${response.status}`);
  return response.json();
};

export const TasksProvider = ({ children, onError, setLoading }) => {
  const [tasks, setTasks] = useState({ data: [], loading: false, error: null });
  const { fetchLists, selectedListId: listsSelectedListId } = useLists();
  const [taskFields, setTaskFields] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [version, setVersion] = useState(null);
  const fetching = useRef(false);

  // Получить задачи для списка
  const fetchTasks = useCallback(async (listId) => {
    if (!listId) return;
    // Если уже есть выполняющийся запрос, дожидаемся его завершения
    while (fetching.current) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (setLoading) setLoading(true);
    fetching.current = true;
    setTasks(prev => ({ ...prev, loading: true, error: null }));
    try {
      // console.log('fetchTasks: start', listId);
      const data = await api(`/tasks/get_tasks?list_id=${listId}&time_zone=${new Date().getTimezoneOffset()}`);
      // console.log('fetchTasks: data', data);
      setTasks({ data: data.tasks || [], version: data.tasksVersion, loading: false, error: null });
      if (setLoading) setLoading(false);
      fetching.current = false;
      // console.log('fetchTasks: success');
      return data;
    } catch (err) {
      if (onError) onError(err);
      setTasks(prev => ({ ...prev, loading: false, error: err }));
      if (setLoading) setLoading(false);
      fetching.current = false;
      console.log('fetchTasks: error', err);
    }
  }, [onError, setLoading]);

  // CRUD операции
  const addTask = useCallback(async (params) => {
    const res = await api("/tasks/add_task", "POST", params);
    await fetchLists();
    // Локальное обновление вместо полной перезагрузки
    if (res.task && (params.listId === listsSelectedListId ||
        (listsSelectedListId === 'tasks' && !params.listId) ||
        (listsSelectedListId === 'my_day' && params.listId === 'my_day') ||
        (listsSelectedListId === 'important' && params.listId === 'important') ||
        (listsSelectedListId === 'background' && params.listId === 'background'))) {
      setTasks(prev => ({
        ...prev,
        data: [res.task, ...prev.data]
      }));
    }
    return res;
  }, [fetchLists, listsSelectedListId]);

  const updateTask = useCallback(async (params) => {
    const res = await api("/tasks/edit_task", "PUT", params);
    if (fetchLists) await fetchLists();
    // Локальное обновление задачи
    if (res.task && params.listId === listsSelectedListId) {
      setTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          task.id === params.taskId ? { ...task, ...res.task } : task
        )
      }));
    }
    return res;
  }, [fetchLists, listsSelectedListId]);

  const changeTaskStatus = useCallback(async (params) => {
    const res = await api("/tasks/change_status", "PUT", params);
    if (fetchLists) await fetchLists();
    // Локальное обновление статуса
    if (params.listId === listsSelectedListId) {
      setTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          task.id === params.taskId ? { ...task, status: params.status } : task
        )
      }));
    }
    return res;
  }, [fetchLists, listsSelectedListId]);

  const addSubTask = useCallback(async (params) => {
    const res = await api("/tasks/add_subtask", "POST", params);
    if (fetchLists) await fetchLists();
    // Локальное обновление подзадачи
    if (res.subtask && params.listId === listsSelectedListId) {
      setTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          task.id === params.parentTaskId
            ? { ...task, subtasks: [...(task.subtasks || []), res.subtask] }
            : task
        )
      }));
    }
    return res;
  }, [fetchLists, listsSelectedListId]);

  const deleteTask = useCallback(async (params) => {
    const res = await api("/tasks/del_task", "DELETE", params);
    if (fetchLists) await fetchLists();
    // Локальное удаление задачи
    if (params.listId === listsSelectedListId) {
      setTasks(prev => ({
        ...prev,
        data: prev.data.filter(task => task.id !== params.taskId)
      }));
    }
    return res;
  }, [fetchLists, listsSelectedListId]);
  
  const linkTaskList = useCallback(async (params) => {
    const res = await api("/tasks/link_task", "PUT", params);
    if (fetchLists) await fetchLists();
    // При перемещении задачи нужна полная перезагрузка только текущего списка
    if (listsSelectedListId && listsSelectedListId === params.fromListId) {
      await fetchTasks(listsSelectedListId);
    }
    return res;
  }, [fetchLists, fetchTasks, listsSelectedListId]);

  // Принудительное обновление задач (когда локальные обновления недостаточны)
  const forceRefreshTasks = useCallback(async () => {
    if (listsSelectedListId) {
      await fetchTasks(listsSelectedListId);
    }
  }, [listsSelectedListId, fetchTasks]);

  // Получить конфиг полей задач
  const fetchTaskFields = useCallback(async () => {
    try {
      const data = await api('/tasks/fields_config');
      setTaskFields(data);
    } catch (error) {
      setTaskFields({ error });
    }
  }, []);

  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoading && user) {
      fetchTaskFields();
    }
  }, [fetchTaskFields, user, isLoading]);

  const { tasksVersion: wsVersion, taskChange } = useUpdateWebSocket();

  // Обработка детальных изменений задач через WebSocket
  useEffect(() => {
    if (taskChange && taskChange.listId === listsSelectedListId) {
      const { action, task } = taskChange;
      
      switch (action) {
        case 'added':
          setTasks(prev => ({
            ...prev,
            data: [...prev.data, task]
          }));
          break;
        case 'updated':
          setTasks(prev => ({
            ...prev,
            data: prev.data.map(t => t.id === task.id ? { ...t, ...task } : t)
          }));
          break;
        case 'deleted':
          setTasks(prev => ({
            ...prev,
            data: prev.data.filter(t => t.id !== task.id)
          }));
          break;
        case 'status_changed':
          setTasks(prev => ({
            ...prev,
            data: prev.data.map(t => t.id === task.id ? { ...t, status: task.status } : t)
          }));
          break;
      }
    }
  }, [taskChange, listsSelectedListId]);

  // Обновление версии без полной перезагрузки
  useEffect(() => {
    if (wsVersion && wsVersion !== version) {
      setVersion(wsVersion);
    }
  }, [wsVersion, version]);

  const contextValue = useMemo(() => ({
    tasks,
    taskFields,
    selectedTaskId,
    setSelectedTaskId,
    fetchTasks,
    forceRefreshTasks,
    addTask,
    updateTask,
    changeTaskStatus,
    addSubTask,
    deleteTask,
    linkTaskList,
    version,
    setVersion,
    loading: tasks.loading,
  }), [tasks, taskFields, selectedTaskId, fetchTasks, forceRefreshTasks, addTask, updateTask, changeTaskStatus, addSubTask, deleteTask, linkTaskList, version, listsSelectedListId]);

  return <TasksContext.Provider value={contextValue}>{children}</TasksContext.Provider>;
};

TasksProvider.propTypes = { children: PropTypes.node.isRequired };

export default TasksContext; 