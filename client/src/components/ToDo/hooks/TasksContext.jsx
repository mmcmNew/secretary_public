import { createContext, useState, useCallback, useMemo, useRef, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";
import { AuthContext } from '../../../contexts/AuthContext';
import useContainer from '../../DraggableComponents/useContainer';
import api from '../../../utils/api';

const TasksContext = createContext();


export const TasksProvider = ({ children, onError, setLoading }) => {
  const [tasks, setTasks] = useState({ data: [], loading: false, error: null });
  const [myDayTasks, setMyDayTasks] = useState({ data: [], loading: false, error: null });
  const [myDayList, setMyDayList] = useState(null);
  const [lists, setLists] = useState({ lists: [], projects: [], default_lists: [], loading: false, error: null });
  const [selectedListId, setSelectedListId] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [taskFields, setTaskFields] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [version, setVersion] = useState(null);
  const fetching = useRef(false);
  const { draggingContainer } = useContainer();

  // Получить задачи для списка
  const fetchTasks = useCallback(async (listId, { silent = false } = {}) => {
    if (!listId) return;
    // Если уже есть выполняющийся запрос, дожидаемся его завершения
    // while (fetching.current) {
    //   await new Promise((resolve) => setTimeout(resolve, 50));
    // }
    if (!silent && setLoading) setLoading(true);
    fetching.current = true;
    if (!silent) {
      if (listId === 'my_day') {
        setMyDayTasks(prev => ({ ...prev, loading: true, error: null }));
      } else {
        setTasks(prev => ({ ...prev, loading: true, error: null }));
      }
    }
    try {
      // console.log('fetchTasks: start', listId);
      const data = await api(`/tasks/get_tasks?list_id=${listId}&time_zone=${new Date().getTimezoneOffset()}&version=${version || ''}`);
      if (data.version_matches) {
        setVersion(data.version);
        if (!silent && setLoading) setLoading(false);
        fetching.current = false;
        return data;
      }
      const update = {
        data: data.tasks || [],
        version: data.tasksVersion || data.version,
        loading: false,
        error: null,
      };
      if (listId === 'my_day') {
        setMyDayTasks(prev => ({
          ...prev,
          ...update,
          loading: silent ? prev.loading : update.loading,
        }));
      } else {
        setTasks(prev => ({
          ...prev,
          ...update,
          loading: silent ? prev.loading : update.loading,
        }));
      }
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
      setVersion(update.version);
      // console.log('fetchTasks: success');
      return data;
    } catch (err) {
      if (onError) onError(err);
      if (listId === 'my_day') {
        setMyDayTasks(prev => ({ ...prev, loading: silent ? prev.loading : false, error: err }));
      } else {
        setTasks(prev => ({ ...prev, loading: silent ? prev.loading : false, error: err }));
      }
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
      console.log('fetchTasks: error', err);
    }
  }, [onError, setLoading, version]);


  // Получить все списки
  const fetchLists = useCallback(async ({ silent = false } = {}) => {
    if (fetching.current) return;
    if (!silent && setLoading) setLoading(true);
    fetching.current = true;
    if (!silent) setLists(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api(`/tasks/get_lists?time_zone=${new Date().getTimezoneOffset()}&version=${version || ''}`);
      if (data.version_matches) {
        setVersion(data.version);
        if (!silent && setLoading) setLoading(false);
        fetching.current = false;
        return data;
      }
      setLists(prev => ({
        ...prev,
        lists: data.lists,
        default_lists: data.default_lists,
        projects: data.projects,
        version: data.tasksVersion || data.version,
        loading: silent ? prev.loading : false,
        error: null,
      }));
      setVersion(data.tasksVersion || data.version || version);
      const myDay = data.default_lists?.find(l => l.id === 'my_day');
      setMyDayList(myDay || null);
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
      return data;
    } catch (err) {
      if (onError) onError(err);
      setLists(prev => ({ ...prev, loading: silent ? prev.loading : false, error: err }));
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
    }
  }, [onError, setLoading, version]);

  // CRUD операции со списками
  const addList = useCallback(async (params) => { const res = await api('/tasks/add_list', 'POST', params); await fetchLists(); return res; }, [fetchLists]);
  const updateList = useCallback(async (params) => { const res = await api('/tasks/edit_list', 'PUT', params); await fetchLists(); return res; }, [fetchLists]);
  const deleteList = useCallback(async (params) => { const res = await api('/tasks/del_list', 'DELETE', params); await fetchLists(); return res; }, [fetchLists]);
  const linkListGroup = useCallback(async (params) => { const res = await api('/tasks/link_group_list', 'PUT', params); await fetchLists(); return res; }, [fetchLists]);
  const deleteFromChildes = useCallback(async (params) => { const res = await api('/tasks/delete_from_childes', 'DELETE', params); await fetchLists(); return res; }, [fetchLists]);
  const changeChildesOrder = useCallback(async (params) => { const res = await api('/tasks/change_childes_order', 'PUT', params); await fetchLists(); return res; }, [fetchLists]);

  const handleSelectList = useCallback((listId) => {
    setSelectedListId(listId);
  }, []);

  useEffect(() => {
    if (selectedListId != null) {
      const allLists = [...lists.lists, ...lists.projects, ...lists.default_lists];
      const found = allLists.find(l => l.id === selectedListId);
      setSelectedList(found || null);
    } else {
      setSelectedList(null);
    }
  }, [selectedListId, lists]);

  // ------ Calendar events ------
  const [calendarEvents, setCalendarEvents] = useState({ data: [], loading: false, error: null });
  const [calendarRange, setCalendarRange] = useState({ start: null, end: null });

  const fetchCalendarEvents = useCallback(async (range) => {
    const finalRange = range || calendarRange;
    if (range) setCalendarRange(range);
    console.log('fetchCalendarEvents: ', range, finalRange)
    if (!finalRange.start || !finalRange.end) return [];
    fetching.current = true;
    setCalendarEvents(prev => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ list_id: 'events', version: version || '' });
      params.append('start', finalRange.start);
      params.append('end', finalRange.end);
      console.log('fetchCalendarEvents: ', params.toString())
      const data = await api(`/tasks/get_tasks?${params.toString()}`);
      if (data.version_matches) {
        setVersion(data.version);
        setCalendarEvents(prev => ({ ...prev, loading: false }));
        return calendarEvents.data;
      }
      setCalendarEvents({ data: data.tasks || data, loading: false, error: null });
      setVersion(data.tasksVersion || data.version || version);
      return data.tasks || data;
    } catch (error) {
      setCalendarEvents(prev => ({ ...prev, loading: false, error }));
      return [];
    } finally {
      fetching.current = false;
    }
  }, [version]);

  const updateCalendarEvent = useCallback((params) => api('/tasks/edit_task', 'PUT', params), []);
  const addCalendarEvent = useCallback((params) => api('/tasks/add_task', 'POST', params), []);
  const deleteCalendarEvent = useCallback((params) => api('/tasks/del_task', 'DELETE', params), []);

  // CRUD операции
  const addTask = useCallback(async (params) => {
    const res = await api("/tasks/add_task", "POST", params);
    await fetchLists({ silent: true });
    // Локальное обновление вместо полной перезагрузки
    if (res.task && params.listId === 'my_day') {
      setMyDayTasks(prev => ({
        ...prev,
        data: [res.task, ...prev.data]
      }));
    } else if (res.task && (
        params.listId === selectedListId ||
        (selectedListId === 'tasks' && !params.listId) ||
        (selectedListId === 'important' && params.listId === 'important') ||
        (selectedListId === 'background' && params.listId === 'background')
      )) {
      setTasks(prev => ({
        ...prev,
        data: [res.task, ...prev.data]
      }));
    }
    return res;
  }, [fetchLists, selectedListId]);

  const updateTask = useCallback(async (params) => {
    const res = await api("/tasks/edit_task", "PUT", params);
    if (fetchLists) await fetchLists({ silent: true });
    // Локальное обновление задачи
    if (res.task && params.listId === 'my_day') {
      setMyDayTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          task.id == params.taskId ? { ...task, ...res.task } : task
        )
      }));
    } else if (res.task && (params.listId === selectedListId || !params.listId)) {
      setTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          task.id == params.taskId ? { ...task, ...res.task } : task
        )
      }));
    }
    return res;
  }, [fetchLists, selectedListId]);

  const changeTaskStatus = useCallback(async (params) => {
    const res = await api("/tasks/change_status", "PUT", params);
    if (fetchLists) await fetchLists({ silent: true });
    // Если сервер вернул массив changed_ids, обновляем статус у всех этих задач
    if (res.changed_ids && Array.isArray(res.changed_ids)) {
      setTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          res.changed_ids.includes(task.id)
            ? { ...task, status_id: params.status_id, completed_at: params.completed_at || new Date().toISOString() }
            : task
        )
      }));
      setMyDayTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          res.changed_ids.includes(task.id)
            ? { ...task, status_id: params.status_id, completed_at: params.completed_at || new Date().toISOString() }
            : task
        )
      }));
    } else if (params.listId === 'my_day') {
      setMyDayTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          task.id === params.taskId ? { ...task, status_id: params.status_id } : task
        )
      }));
    } else if (params.listId === selectedListId) {
      setTasks(prev => ({
        ...prev,
        data: prev.data.map(task =>
          task.id === params.taskId ? { ...task, status_id: params.status_id } : task
        )
      }));
    }
    return res;
  }, [fetchLists, selectedListId]);

  const addSubTask = useCallback(async (params) => {
    const res = await api("/tasks/add_subtask", "POST", params);

    // Обновляем версию, если она пришла с сервера
    if (res.version || res.tasksVersion) {
      setVersion(res.version || res.tasksVersion);
    }

    if (res.subtask && res.parent_task) {
      setTasks(prev => {
        // Добавляем новую подзадачу в общий список задач, если её там ещё нет
        const exists = prev.data.some(task => task.id === res.subtask.id);
        const newData = exists
          ? prev.data
          : [...prev.data, res.subtask];

        // Обновляем родительскую задачу
        return {
          ...prev,
          data: newData.map(task =>
            task.id === params.parentTaskId
              ? {
                  ...task,
                  subtasks: [...(task.subtasks || []), res.subtask],
                  childes_order: res.parent_task.childes_order
                }
              : task
          )
        };
      });
    }

    return res;
  }, [setVersion]);

  const deleteTask = useCallback(async (params) => {
    const res = await api("/tasks/del_task", "DELETE", params);
    if (fetchLists) await fetchLists({ silent: true });
    // Локальное удаление задачи
    if (params.listId === 'my_day') {
      setMyDayTasks(prev => ({
        ...prev,
        data: prev.data.filter(task => task.id !== params.taskId)
      }));
    } else if (params.listId === selectedListId) {
      setTasks(prev => ({
        ...prev,
        data: prev.data.filter(task => task.id !== params.taskId)
      }));
    }
    return res;
  }, [fetchLists, selectedListId]);
  
  const linkTaskList = useCallback(async (params) => {
    const res = await api("/tasks/link_task", "PUT", params);
    if (fetchLists) await fetchLists({ silent: true });
    // При перемещении задачи нужна перезагрузка соответствующего списка
    if (params.fromListId === 'my_day' || params.listId === 'my_day') {
      await fetchTasks('my_day', { silent: true });
    } else if (selectedListId && selectedListId === params.fromListId) {
      await fetchTasks(selectedListId, { silent: true });
    }
    return res;
  }, [fetchLists, fetchTasks, selectedListId]);

  // Принудительное обновление задач (когда локальные обновления недостаточны)
  const forceRefreshTasks = useCallback(async () => {
    if (selectedListId) {
      await fetchTasks(selectedListId);
    }
  }, [selectedListId, fetchTasks]);

  // Получить конфиг полей задач
  const fetchTaskFields = useCallback(async () => {
    try {
      const data = await api('/tasks/fields_config');
      setTaskFields(data);
    } catch (error) {
      setTaskFields({ error });
    }
  }, []);

  // ----- Task types -----
  const getTaskTypes = useCallback(() => api('/tasks/task_types'), []);

  const addTaskType = useCallback(
    async (params) => {
      const res = await api('/tasks/task_types', 'POST', params);
      if (fetchTaskFields) await fetchTaskFields();
      return res;
    },
    [fetchTaskFields]
  );

  const updateTaskType = useCallback(
    async (id, params) => {
      const res = await api(`/tasks/task_types/${id}`, 'PUT', params);
      if (fetchTaskFields) await fetchTaskFields();
      return res;
    },
    [fetchTaskFields]
  );

  const deleteTaskType = useCallback(
    async (id) => {
      const res = await api(`/tasks/task_types/${id}`, 'DELETE');
      if (fetchTaskFields) await fetchTaskFields();
      return res;
    },
    [fetchTaskFields]
  );

  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoading && user) {
      fetchTaskFields();
      fetchLists();
    }
  }, [fetchTaskFields, fetchLists, user, isLoading]);


  const { tasksVersion: wsVersion, taskChange } = useUpdateWebSocket();

  // Обработка детальных изменений задач через WebSocket
  useEffect(() => {
    if (draggingContainer) return;
    if (taskChange && (taskChange.listId === selectedListId || taskChange.listId === 'my_day')) {
      const { action, task, lists_data, calendar_events } = taskChange;
      const targetSetter = taskChange.listId === 'my_day' ? setMyDayTasks : setTasks;

      // --- Новое: обновление списков ---
      if (lists_data) {
        setLists(prev => ({
          ...prev,
          ...lists_data,
          loading: false,
          error: null,
        }));
      }
      // --- Новое: обновление событий календаря ---
      if (calendar_events) {
        setCalendarEvents(prev => {
          let events = Array.isArray(prev.data) ? [...prev.data] : [];
          calendar_events.forEach(ev => {
            if (ev.deleted) {
              events = events.filter(e => e.id !== ev.id);
            } else {
              const idx = events.findIndex(e => e.id === ev.id);
              if (idx !== -1) {
                events[idx] = ev;
              } else {
                events.push(ev);
              }
            }
          });
          return { ...prev, data: events };
        });
      }

      switch (action) {
        case 'added':
          targetSetter(prev => ({
            ...prev,
            data: [...prev.data, task]
          }));
          fetchCalendarEvents();
          fetchLists({ silent: true });
          break;
        case 'updated':
          targetSetter(prev => ({
            ...prev,
            data: prev.data.map(t => t.id === task.id ? { ...t, ...task } : t)
          }));
          fetchCalendarEvents();
          fetchLists({ silent: true });
          break;
        case 'deleted':
          targetSetter(prev => ({
            ...prev,
            data: prev.data.filter(t => t.id !== task.id)
          }));
          fetchCalendarEvents();
          fetchLists({ silent: true });
          break;
        case 'status_changed':
          if (task.changed_ids) {
            // Обновить статус у всех задач с этими id
            targetSetter(prev => ({
              ...prev,
              data: prev.data.map(t =>
                task.changed_ids.includes(t.id)
                  ? { ...t, status_id: task.status_id, completed_at: task.completed_at }
                  : t
              )
            }));
          } else if (task.id) {
            // Старый вариант — обновить одну задачу
            targetSetter(prev => ({
              ...prev,
              data: prev.data.map(t => t.id === task.id ? { ...t, status: task.status } : t)
            }));
          }
          fetchCalendarEvents();
          fetchLists({ silent: true });
          break;
      }
    }
  }, [taskChange, selectedListId, draggingContainer, fetchCalendarEvents, fetchLists]);

  // Обновление версии и синхронизация задач
  useEffect(() => {
    if (draggingContainer) return;
    if (wsVersion && wsVersion !== version) {
      // Обновляем список задач выбранного списка и список "Мой день"
      if (selectedListId) {
        fetchTasks(selectedListId, { silent: true });
      }
      fetchTasks('my_day', { silent: true });
      fetchLists({ silent: true });
      fetchCalendarEvents();
      setVersion(wsVersion);
    }
  }, [wsVersion, version, selectedListId, fetchTasks, fetchLists, fetchCalendarEvents, draggingContainer]);

  const contextValue = useMemo(() => ({
    tasks,
    myDayTasks,
    myDayList,
    taskFields,
    lists,
    selectedListId,
    setSelectedListId: handleSelectList,
    selectedList,
    setSelectedList,
    calendarEvents,
    calendarRange,
    setCalendarRange,
    fetchCalendarEvents,
    updateCalendarEvent,
    addCalendarEvent,
    deleteCalendarEvent,
    fetchLists,
    fetchTaskFields,
    getTaskTypes,
    addTaskType,
    updateTaskType,
    deleteTaskType,
    addList,
    updateList,
    deleteList,
    linkListGroup,
    deleteFromChildes,
    changeChildesOrder,
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
  }), [tasks, myDayTasks, myDayList, taskFields, lists, selectedListId, selectedList, calendarEvents, calendarRange, fetchCalendarEvents, updateCalendarEvent, addCalendarEvent, deleteCalendarEvent, fetchLists, fetchTaskFields, getTaskTypes, addTaskType, updateTaskType, deleteTaskType, addList, updateList, deleteList, linkListGroup, deleteFromChildes, changeChildesOrder, selectedTaskId, fetchTasks, forceRefreshTasks, addTask, updateTask, changeTaskStatus, addSubTask, deleteTask, linkTaskList, version]);

  return <TasksContext.Provider value={contextValue}>{children}</TasksContext.Provider>;
};

TasksProvider.propTypes = { children: PropTypes.node.isRequired };export default TasksContext; 