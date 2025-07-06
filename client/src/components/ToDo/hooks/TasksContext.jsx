import { createContext, useState, useCallback, useMemo, useRef, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";
import useLists from './useLists';
import { AuthContext } from '../../../contexts/AuthContext';
import api from '../../../utils/api';

const TasksContext = createContext();


export const TasksProvider = ({ children, onError, setLoading }) => {
  const [tasks, setTasks] = useState({ data: [], loading: false, error: null });
  const { fetchLists, selectedListId: listsSelectedListId } = useLists();
  const [taskFields, setTaskFields] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [version, setVersion] = useState(null);
  const fetching = useRef(false);

  // Получить задачи для списка
  const fetchTasks = useCallback(async (listId, { silent = false } = {}) => {
    if (!listId) return;
    // Если уже есть выполняющийся запрос, дожидаемся его завершения
    while (fetching.current) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!silent && setLoading) setLoading(true);
    fetching.current = true;
    if (!silent) setTasks(prev => ({ ...prev, loading: true, error: null }));
    try {
      // console.log('fetchTasks: start', listId);
      const data = await api(`/tasks/get_tasks?list_id=${listId}&time_zone=${new Date().getTimezoneOffset()}`);
      // console.log('fetchTasks: data', data);
      setTasks(prev => ({
        ...prev,
        data: data.tasks || [],
        version: data.tasksVersion,
        loading: silent ? prev.loading : false,
        error: null,
      }));
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
      // console.log('fetchTasks: success');
      return data;
    } catch (err) {
      if (onError) onError(err);
      setTasks(prev => ({ ...prev, loading: silent ? prev.loading : false, error: err }));
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
      console.log('fetchTasks: error', err);
    }
  }, [onError, setLoading]);

  // CRUD операции
  const addTask = useCallback(async (params) => {
    const res = await api("/tasks/add_task", "POST", params);
    await fetchLists({ silent: true });
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
    if (fetchLists) await fetchLists({ silent: true });
    // Локальное обновление задачи
    if (res.task && (params.listId === listsSelectedListId || !params.listId)) {
      setTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          task.id == params.taskId ? { ...task, ...res.task } : task
        )
      }));
    }
    return res;
  }, [fetchLists, listsSelectedListId]);

  const changeTaskStatus = useCallback(async (params) => {
    const res = await api("/tasks/change_status", "PUT", params);
    if (fetchLists) await fetchLists({ silent: true });
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
    if (fetchLists) await fetchLists({ silent: true });
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
    if (fetchLists) await fetchLists({ silent: true });
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
    if (fetchLists) await fetchLists({ silent: true });
    // При перемещении задачи нужна полная перезагрузка только текущего списка
    if (listsSelectedListId && listsSelectedListId === params.fromListId) {
      await fetchTasks(listsSelectedListId, { silent: true });
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

  // Обновление версии и синхронизация задач
  useEffect(() => {
    if (wsVersion && wsVersion !== version) {
      // Обновляем список задач выбранного списка
      if (listsSelectedListId) {
        fetchTasks(listsSelectedListId, { silent: true });
      }
      setVersion(wsVersion);
    }
  }, [wsVersion, version, listsSelectedListId, fetchTasks]);

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