import { createContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";
import useContainer from '../../DraggableComponents/useContainer';
import api, { apiDelete, apiGet, apiPost, apiPut } from '../../../utils/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const TasksContext = createContext();


export const TasksProvider = ({ children, onError, setLoading }) => {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState({ data: [], loading: false, error: null });
  const [myDayTasks, setMyDayTasks] = useState({ data: [], loading: false, error: null });
  const [myDayList, setMyDayList] = useState(null);
  const [lists, setLists] = useState({ lists: [], projects: [], default_lists: [], loading: false, error: null });
  const [selectedListId, setSelectedListId] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [taskFields, setTaskFields] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const fetching = useRef(false);
  const { draggingContainer } = useContainer();

  // ----- List mutations -----
  const addListMutation = useMutation({
    mutationFn: (params) => apiPost('/tasks/add_list', params),
    onSuccess: () => queryClient.invalidateQueries(['lists']),
  });

  const updateListMutation = useMutation({
    mutationFn: (params) => apiPut('/tasks/edit_list', params),
    onSuccess: () => queryClient.invalidateQueries(['lists']),
  });


  // NOTE: server does not expose /tasks/del_list. Deletion is done via edit_list
  // with deleted flag
  const deleteListMutation = useMutation({
    mutationFn: (params) => apiPut('/tasks/edit_list', { ...params, deleted: true }),
    onSuccess: () => queryClient.invalidateQueries(['lists']),
  });

  const linkListGroupMutation = useMutation({
    mutationFn: (params) => apiPut('/tasks/link_group_list', params),
    onSuccess: () => queryClient.invalidateQueries(['lists']),
  });

  const deleteFromChildesMutation = useMutation({
    mutationFn: (params) => apiDelete('/tasks/delete_from_childes', params),
    onSuccess: () => queryClient.invalidateQueries(['lists']),
  });

  // change_childes_order endpoint is missing; use edit_list with childes_order
  const changeChildesOrderMutation = useMutation({
    mutationFn: (params) => apiPut('/tasks/edit_list', params),
    onSuccess: () => queryClient.invalidateQueries(['lists']),
  });

  const fetchTasksApi = async (listId) => {
    let url = '';
    if (listId === 'my_day') {
      const start = dayjs().startOf('day').utc().toISOString();
      const end = dayjs().endOf('day').utc().toISOString();
      const params = new URLSearchParams({ list_id: 'events', start, end });
      url = `/tasks/get_tasks?${params.toString()}`;
    } else {
      url = `/tasks/get_tasks?list_id=${listId}&time_zone=${new Date().getTimezoneOffset()}`;
    }
    const { data } = await apiGet(url);
    console.log(data)
    return data;
  };

  const fetchListsApi = async () => {
    const { data } = await apiGet(`/tasks/get_lists?time_zone=${new Date().getTimezoneOffset()}`);
    console.log(data)
    return data;
  };

  // Получить задачи для списка
  const fetchTasks = useCallback(async (listId, { silent = false } = {}) => {
    if (!listId) return;
    if (!silent && setLoading) setLoading(true);
    fetching.current = true;
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ['tasks', listId],
        queryFn: () => fetchTasksApi(listId),
      });
      const update = {
        data: data.tasks || [],
        loading: false,
        error: null,
      };
      if (listId === 'my_day') {
        setMyDayTasks(update);
      } else {
        setTasks(update);
      }
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
      console.log(data)
      return data;
    } catch (err) {
      if (onError) onError(err);
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
    }
  }, [onError, setLoading, queryClient]);

  const fetchTasksByIds = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return [];
    try {
      const params = new URLSearchParams({ ids: ids.join(',') });
      const { data } = await apiGet(`/tasks/get_tasks_by_ids?${params.toString()}`);
      console.log(data)
      if (Array.isArray(data.tasks)) {
        setTasks(prev => ({
          ...prev,
          data: [...prev.data, ...data.tasks.filter(t => !prev.data.some(pt => pt.id === t.id))]
        }));
        return data.tasks;
      }
      return [];
    } catch (err) {
      if (onError) onError(err);
      return [];
    }
  }, [onError]);


  // Получить все списки
  const fetchLists = useCallback(async ({ silent = true, refetch = false } = {}) => {
    if (!silent && setLoading) setLoading(true);
    fetching.current = true;
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ['lists'],
        queryFn: fetchListsApi,
        force: refetch,
      });
      setLists(prev => ({
        ...prev,
        lists: data.lists,
        default_lists: data.default_lists,
        projects: data.projects,
        loading: false,
        error: null,
      }));
      const myDay = data.default_lists?.find(l => l.id === 'my_day');
      setMyDayList(myDay || null);
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
      console.log(data)
      return data;
    } catch (err) {
      if (onError) onError(err);
      if (!silent && setLoading) setLoading(false);
      fetching.current = false;
    }
  }, [onError, setLoading, queryClient]);

  // CRUD операции со списками
  const addList = useCallback(
    async (params) => {
      const res = await addListMutation.mutateAsync(params);
      if (res.new_object) {
        setLists(prev => ({
          ...prev,
          lists: res.object_type === 'project' ? prev.lists : [...prev.lists, res.new_object],
          projects: res.object_type === 'project' ? [...prev.projects, res.new_object] : prev.projects,
        }));
      }
      await fetchLists({ silent: true });
      return res;
    },
    [addListMutation, fetchLists]
  );

  const updateList = useCallback(
    async (params) => {
      const res = await updateListMutation.mutateAsync(params);
      if (res.updated_list) {
        setLists(prev => ({
          ...prev,
          lists: prev.lists.map(l => l.id === res.updated_list.id ? res.updated_list : l),
          projects: prev.projects.map(p => p.id === res.updated_list.id ? res.updated_list : p),
          default_lists: prev.default_lists.map(d => d.id === res.updated_list.id ? res.updated_list : d),
        }));
      }
      await fetchLists({ silent: true });
      return res;
    },
    [updateListMutation, fetchLists]
  );

  const deleteList = useCallback(
    async (params) => {
      const res = await deleteListMutation.mutateAsync(params);
      if (res.updated_list) {
        setLists(prev => ({
          ...prev,
          lists: prev.lists.filter(l => l.id !== res.updated_list.id),
          projects: prev.projects.filter(p => p.id !== res.updated_list.id),
          default_lists: prev.default_lists.filter(d => d.id !== res.updated_list.id),
        }));
      }
      await fetchLists({ silent: true });
      return res;
    },
    [deleteListMutation, fetchLists]
  );

  const linkListGroup = useCallback(
    async (params) => {
      const res = await linkListGroupMutation.mutateAsync(params);
      await fetchLists({ silent: true });
      return res;
    },
    [linkListGroupMutation, fetchLists]
  );

  const deleteFromChildes = useCallback(
    async (params) => {
      const res = await deleteFromChildesMutation.mutateAsync(params);
      await fetchLists({ silent: true });
      return res;
    },
    [deleteFromChildesMutation, fetchLists]
  );

  const changeChildesOrder = useCallback(
    async (params) => {
      const res = await changeChildesOrderMutation.mutateAsync(params);
      if (res.updated_list) {
        setLists(prev => ({
          ...prev,
          lists: prev.lists.map(l => l.id === res.updated_list.id ? res.updated_list : l),
          projects: prev.projects.map(p => p.id === res.updated_list.id ? res.updated_list : p),
          default_lists: prev.default_lists.map(d => d.id === res.updated_list.id ? res.updated_list : d),
        }));
      }
      await fetchLists({ silent: true });
      return res;
    },
    [changeChildesOrderMutation, fetchLists]
  );

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
      const params = new URLSearchParams({ list_id: 'events' });
      params.append('start', finalRange.start);
      params.append('end', finalRange.end);
      // console.log('fetchCalendarEvents: ', params.toString())
      const { data } = await apiGet(`/tasks/get_tasks?${params.toString()}`);
      setCalendarEvents({ data: data.tasks || data, loading: false, error: null });
      console.log(data)
      return data.tasks || data;
    } catch (error) {
      setCalendarEvents(prev => ({ ...prev, loading: false, error }));
      return [];
    } finally {
      fetching.current = false;
    }
  }, []);

  const updateCalendarEvent = useCallback((params) => apiPut('/tasks/edit_task', params), []);
  const addCalendarEvent = useCallback((params) => apiPost('/tasks/add_task', params), []);
  const deleteCalendarEvent = useCallback((params) => apiDelete('/tasks/del_task', params), []);

  // CRUD операции
  const addTaskMutation = useMutation({
    mutationFn: (params) => apiPost('/tasks/add_task', params),
    onSuccess: () => fetchLists({ silent: true }),
  });

  const addTask = useCallback(async (params) => {
    const res = await addTaskMutation.mutateAsync(params);
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
  }, [fetchLists, selectedListId, addTaskMutation]);

  const updateTaskMutation = useMutation({
    mutationFn: (params) => apiPut('/tasks/edit_task', params),
    onSuccess: () => fetchLists({ silent: true }),
  });

  const updateTask = useCallback(async (params) => {
    const res = await updateTaskMutation.mutateAsync(params);
    if (res.task) {
      setMyDayTasks(prev => {
        if (!prev.data.some(task => task.id == params.taskId)) return prev;
        return {
          ...prev,
          data: prev.data.map(task =>
            task.id == params.taskId ? { ...task, ...res.task } : task
          )
        };
      });
      setTasks(prev => {
        if (!prev.data.some(task => task.id == params.taskId)) return prev;
        return {
          ...prev,
          data: prev.data.map(task =>
            task.id == params.taskId ? { ...task, ...res.task } : task
          )
        };
      });
    }
    return res;
  }, [fetchLists, updateTaskMutation]);

  const changeTaskStatusMutation = useMutation({
    mutationFn: (params) => apiPut('/tasks/change_status', params),
    onSuccess: () => fetchLists({ silent: true }),
  });

  const changeTaskStatus = useCallback(async (params) => {
    const res = await changeTaskStatusMutation.mutateAsync(params);
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

  const addSubTaskMutation = useMutation({
    mutationFn: (params) => apiPost('/tasks/add_subtask', params),
  });

  const addSubTask = useCallback(async (params) => {
    const res = await addSubTaskMutation.mutateAsync(params);



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
  }, [addSubTaskMutation]);

  const deleteTaskMutation = useMutation({
    mutationFn: (params) => apiDelete('/tasks/del_task', params),
    onSuccess: () => fetchLists({ silent: true }),
  });

  const deleteTask = useCallback(async (params) => {
    const res = await deleteTaskMutation.mutateAsync(params);
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
  }, [fetchLists, selectedListId, deleteTaskMutation]);
  
  const linkTaskListMutation = useMutation({
    mutationFn: (params) => apiPut('/tasks/link_task', params),
    onSuccess: () => fetchLists({ silent: true }),
  });

  const linkTaskList = useCallback(async (params) => {
    const res = await linkTaskListMutation.mutateAsync(params);
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
      const { data } = await apiGet('/tasks/fields_config');
      setTaskFields(data);
    } catch (error) {
      setTaskFields({ error });
    }
  }, []);

  // ----- Task types -----
  const getTaskTypes = useCallback(async () => {
    const { data } = await apiGet('/tasks/task_types');
    return data;
  }, []);

  const addTaskType = useCallback(
    async (params) => {
      const { data } = await apiPost('/tasks/task_types', params);
      if (fetchTaskFields) await fetchTaskFields();
      return data;
    },
    [fetchTaskFields]
  );

  const updateTaskType = useCallback(
    async (id, params) => {
      const { data } = await apiPut(`/tasks/task_types/${id}`, params);
      if (fetchTaskFields) await fetchTaskFields();
      return data;
    },
    [fetchTaskFields]
  );

  const deleteTaskType = useCallback(
    async (id) => {
      const { data } = await apiDelete(`/tasks/task_types/${id}`);
      if (fetchTaskFields) await fetchTaskFields();
      return data;
    },
    [fetchTaskFields]
  );

  // ----- Task type groups -----
  const getTaskTypeGroups = useCallback(async () => {
    const { data } = await apiGet('/tasks/task_type_groups');
    return data;
  }, []);

  const addTaskTypeGroup = useCallback(
    async (params) => {
      const { data } = await apiPost('/tasks/task_type_groups', params);
      if (fetchTaskFields) await fetchTaskFields();
      return data;
    },
    [fetchTaskFields]
  );

  const updateTaskTypeGroup = useCallback(
    async (id, params) => {
      const { data } = await apiPut(`/tasks/task_type_groups/${id}`, params);
      if (fetchTaskFields) await fetchTaskFields();
      return data;
    },
    [fetchTaskFields]
  );

  const deleteTaskTypeGroup = useCallback(
    async (id) => {
      const { data } = await apiDelete(`/tasks/task_type_groups/${id}`,);
      if (fetchTaskFields) await fetchTaskFields();
      return data;
    },
    [fetchTaskFields]
  );

  // Получить подзадачи по parent_task_id
  const getSubtasksByParentId = useCallback(async (parent_task_id) => {
    try {
      const { data } = await apiGet(`/tasks/get_subtasks?parent_task_id=${parent_task_id}`);
      //объеденить tasks.data с res.subtasks
      if (data.subtasks) {
        setTasks(prev => ({
          ...prev,
          data: [...prev.data, ...data.subtasks]
        }));
      }

      return data.subtasks || [];
    } catch (err) {
      if (onError) onError(err);
      return [];
    }
  }, [onError]);

  useEffect(() => {
      fetchTaskFields();
      fetchLists();
  }, [fetchTaskFields, fetchLists]);


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
    if (wsVersion) {
      // Обновляем список задач выбранного списка и список "Мой день"
      if (selectedListId) {
        fetchTasks(selectedListId, { silent: true });
      }
      fetchTasks('my_day', { silent: true });
      fetchLists({ silent: true });
      fetchCalendarEvents();
    }
  }, [wsVersion, selectedListId, fetchTasks, fetchLists, fetchCalendarEvents, draggingContainer]);

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
    fetchTasks,
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
    getTaskTypeGroups,
    addTaskTypeGroup,
    updateTaskTypeGroup,
    deleteTaskTypeGroup,
    addList,
    updateList,
    deleteList,
    linkListGroup,
    deleteFromChildes,
    changeChildesOrder,
    selectedTaskId,
    setSelectedTaskId,
    fetchTasksByIds,
    forceRefreshTasks,
    addTask,
    updateTask,
    changeTaskStatus,
    addSubTask,
    deleteTask,
    linkTaskList,
    loading: tasks.loading,
    getSubtasksByParentId,
  }), [tasks, myDayTasks, myDayList, taskFields, lists, selectedListId, selectedList, calendarEvents, calendarRange, fetchCalendarEvents, updateCalendarEvent, addCalendarEvent, deleteCalendarEvent, fetchLists, fetchTaskFields, getTaskTypes, addTaskType, updateTaskType, deleteTaskType, getTaskTypeGroups, addTaskTypeGroup, updateTaskTypeGroup, deleteTaskTypeGroup, addList, updateList, deleteList, linkListGroup, deleteFromChildes, changeChildesOrder, selectedTaskId, fetchTasks, fetchTasksByIds, forceRefreshTasks, addTask, updateTask, changeTaskStatus, addSubTask, deleteTask, linkTaskList, getSubtasksByParentId]);

  return <TasksContext.Provider value={contextValue}>{children}</TasksContext.Provider>;
};

TasksProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
  setLoading: PropTypes.func,
};

export default TasksContext;
