import { createContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import useContainer from "../../DraggableComponents/useContainer";
import PropTypes from "prop-types";

const ToDoContext = createContext();

// API Helper
const api = async (url, method = 'GET', body = null) => {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Failed to fetch ${url}, status ${response.status}`);

  return response.json();
};

export const ToDoProvider = ({ children }) => {
  const [state, setState] = useState({
    tasks: { data: [], loading: false, error: null },
    calendarEvents: { data: [], loading: false, error: null },
    lists: { data: { lists: [], projects: [], default: [] }, loading: false, error: null },
    selected: { listId: null, list: null, taskId: null },
    taskFields: {},
    version: null
  });

  const fetching = useRef({ tasks: false, lists: false, events: false });
  const { updates, setUpdates } = useContainer();

  const fetchData = useCallback(async (key, url) => {
    if (fetching.current[key]) return;
    fetching.current[key] = true;

    setState(prev => ({ ...prev, [key]: { ...prev[key], loading: true, error: null } }));

    try {
      const data = await api(url);
      setState(prev => ({
        ...prev,
        [key]: { data: data.tasks || data, loading: false, error: null },
        version: data.version || prev.version
      }));
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      setState(prev => ({ ...prev, [key]: { ...prev[key], loading: false, error } }));
    }

    fetching.current[key] = false;
  }, []);

  const updateAll = useCallback(async () => {
    await fetchData('lists', `/tasks/get_lists?time_zone=${new Date().getTimezoneOffset()}&version=${state.version}`);
    if (state.selected.listId) {
      await fetchData('tasks', `/tasks/get_tasks?list_id=${state.selected.listId}&time_zone=${new Date().getTimezoneOffset()}&version=${state.version}`);
    }
  }, [state.selected.listId, state.version, fetchData]);

  const performTaskAction = useCallback(async (url, method, body) => {
    try {
      const data = await api(url, method, body);
      await updateAll();
      return data;
    } catch (error) {
      console.error(`Error performing action ${method} on ${url}:`, error);
      return null;
    }
  }, [updateAll]);

  const setSelectedListId = useCallback(listId => {
    const list = [...state.lists.data.lists, ...state.lists.data.projects, ...state.lists.data.default_lists].find(l => l.id === listId);
    setState(prev => ({ ...prev, selected: { ...prev.selected, listId, list } }));
  }, [state.lists.data]);

  const setSelectedTaskId = useCallback(taskId => {
    setState(prev => ({ ...prev, selected: { ...prev.selected, taskId } }));
  }, []);

  const addTask = useCallback((params) => performTaskAction("/tasks/add_task", "POST", params), [performTaskAction]);
  const updateTask = useCallback((params) => performTaskAction("/tasks/edit_task", "PUT", params), [performTaskAction]);
  const changeTaskStatus = useCallback((params) => performTaskAction("/tasks/change_status", "PUT", params), [performTaskAction]);
  const addList = useCallback((params) => performTaskAction("/tasks/add_list", "POST", params), [performTaskAction]);
  const updateList = useCallback((params) => performTaskAction("/tasks/edit_list", "PUT", params), [performTaskAction]);
  const addSubTask = useCallback((params) => performTaskAction("/tasks/add_subtask", "POST", params), [performTaskAction]);
  const deleteTask = useCallback((params) => performTaskAction("/tasks/del_task", "DELETE", params), [performTaskAction]);
  const linkListGroup = useCallback((params) => performTaskAction("/tasks/link_group_list", "PUT", params), [performTaskAction]);
  const deleteFromChildes = useCallback((params) => performTaskAction("/tasks/delete_from_childes", "DELETE", params), [performTaskAction]);
  const linkTaskList = useCallback((params) => performTaskAction("/tasks/link_task", "PUT", params), [performTaskAction]);
  const getAntiSchedule = useCallback(() => api("/tasks/get_anti_schedule"), []);
  const addAntiTask = useCallback((params) => api("/tasks/add_anti_task", "POST", params), []);
  const deleteAntiTask = useCallback((taskId) => api("/tasks/del_anti_task", "DELETE", { taskId }), []);

  useEffect(() => {
    const init = async () => {
      await fetchData('taskFields', '/tasks/fields_config');
      await updateAll();
      await fetchData('calendarEvents', `/tasks/get_tasks?list_id=events&version=${state.version}`);
    };
    init();
  }, [fetchData, updateAll, state.version]);

  useEffect(() => {
    if (updates.length) {
      updateAll().then(() => setUpdates([]));
    }
  }, [updates, updateAll, setUpdates]);

  const contextValue = useMemo(() => ({
    ...state,
    setSelectedListId,
    setSelectedTaskId,
    addTask,
    updateTask,
    changeTaskStatus,
    addList,
    updateList,
    addSubTask,
    deleteTask,
    linkListGroup,
    deleteFromChildes,
    linkTaskList,
    getAntiSchedule,
    addAntiTask,
    deleteAntiTask,
    updateAll,
  }), [
    state,
    setSelectedListId,
    setSelectedTaskId,
    addTask,
    updateTask,
    changeTaskStatus,
    addList,
    updateList,
    addSubTask,
    deleteTask,
    linkListGroup,
    deleteFromChildes,
    linkTaskList,
    getAntiSchedule,
    addAntiTask,
    deleteAntiTask,
    updateAll
  ]);

  if (process.env.NODE_ENV === 'development') {
    console.log('[ToDoContext] State updated:', state);
  }

  return <ToDoContext.Provider value={contextValue}>{children}</ToDoContext.Provider>;
};

ToDoProvider.propTypes = { children: PropTypes.node.isRequired };

export default ToDoContext;
