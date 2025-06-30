import { createContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";
import useLists from './useLists';

const TasksContext = createContext();

// API Helper
const api = async (url, method = 'GET', body = null) => {
  const options = { method, headers: { "Content-Type": "application/json" } };
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
    // console.log(params)
    if (params.listId) {
      // console.log('addTask: fetchTasks', params.listId);
      await fetchTasks(params.listId);
    }
    return res;
  }, [fetchLists, fetchTasks]);

  const updateTask = useCallback(async (params) => {
    // console.log('updateTask: params', params);
    const res = await api("/tasks/edit_task", "PUT", params);
    if (fetchLists) await fetchLists();
    if (params.listId && typeof fetchTasks === 'function') {
      // console.log('updateTask: fetchTasks', params.listId);
      await fetchTasks(params.listId);
    }
    return res;
  }, [fetchLists, fetchTasks]);

  const changeTaskStatus = useCallback(async (params) => {
    const res = await api("/tasks/change_status", "PUT", params);
    if (fetchLists) await fetchLists();
    if (params.listId && typeof fetchTasks === 'function') await fetchTasks(params.listId);
    return res;
  }, [fetchLists, fetchTasks]);

  const addSubTask = useCallback(async (params) => {
    const res = await api("/tasks/add_subtask", "POST", params);
    if (fetchLists) await fetchLists();
    if (params.listId && typeof fetchTasks === 'function') {
      // console.log('addSubTask: fetchTasks', params.listId);
      await fetchTasks(params.listId);
    }
    return res;
  }, [fetchLists, fetchTasks]);

  const deleteTask = useCallback(async (params) => {
    const res = await api("/tasks/del_task", "DELETE", params);
    if (fetchLists) await fetchLists();
    if (params.listId && typeof fetchTasks === 'function') await fetchTasks(params.listId);
    return res;
  }, [fetchLists, fetchTasks]);
  
  const linkTaskList = useCallback(async (params) => {
    const res = await api("/tasks/link_task", "PUT", params);
    if (fetchLists) await fetchLists();
    // Обновляем задачи для текущего выбранного списка, а не для целевого
    const currentListId = listsSelectedListId;
    if (typeof fetchTasks === 'function' && currentListId) await fetchTasks(currentListId);
    return res;
  }, [fetchLists, fetchTasks, listsSelectedListId]);

  // Получить конфиг полей задач
  const fetchTaskFields = useCallback(async () => {
    try {
      const data = await api('/tasks/fields_config');
      setTaskFields(data);
    } catch (error) {
      setTaskFields({ error });
    }
  }, []);

  useEffect(() => {
    fetchTaskFields();
  }, [fetchTaskFields]);

  const { tasksVersion: wsVersion } = useUpdateWebSocket();

  useEffect(() => {
    if (wsVersion && selectedTaskId) {
      fetchTasks(selectedTaskId);
      setVersion(wsVersion);
    }
  }, [wsVersion, selectedTaskId, fetchTasks, setVersion]);

  const contextValue = useMemo(() => ({
    tasks,
    taskFields,
    selectedTaskId,
    setSelectedTaskId,
    fetchTasks,
    addTask,
    updateTask,
    changeTaskStatus,
    addSubTask,
    deleteTask,
    linkTaskList,
    version,
    setVersion,
    loading: tasks.loading,
  }), [tasks, taskFields, selectedTaskId, fetchTasks, addTask, updateTask, changeTaskStatus, addSubTask, deleteTask, linkTaskList, version]);

  return <TasksContext.Provider value={contextValue}>{children}</TasksContext.Provider>;
};

TasksProvider.propTypes = { children: PropTypes.node.isRequired };

export default TasksContext; 