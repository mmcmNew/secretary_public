import { createContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import useUpdateWebSocket from "../../DraggableComponents/useUpdateWebSocket";

const ListsContext = createContext();

// API Helper
const api = async (url, method = 'GET', body = null) => {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Failed to fetch ${url}, status ${response.status}`);
  return response.json();
};

export const ListsProvider = ({ children, onError, setLoading }) => {
  const [lists, setLists] = useState({ lists: [], projects: [], default_lists: [], loading: false, error: null });
  const [selectedListId, setSelectedListId] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [version, setVersion] = useState(null);
  const fetching = useRef(false);

  // Получить все списки
  const fetchLists = useCallback(async () => {
    if (fetching.current) return;
    if (setLoading) setLoading(true);
    fetching.current = true;
    setLists(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('fetchLists: start');
      const data = await api(`/tasks/get_lists?time_zone=${new Date().getTimezoneOffset()}`);
      console.log('fetchLists: data', data);
      setLists({
        lists: data.lists,
        default_lists: data.default_lists,
        projects: data.projects,
        version: data.version,
        loading: false,
        error: null,
      });
      if (setLoading) setLoading(false);
      fetching.current = false;
      console.log('fetchLists: success');
      return data;
    } catch (err) {
      if (onError) onError(err);
      setLists(prev => ({ ...prev, loading: false, error: err }));
      if (setLoading) setLoading(false);
      fetching.current = false;
      console.log('fetchLists: error', err);
    }
  }, [onError, setLoading]);

  // CRUD операции
  const addList = useCallback(async (params) => { const res = await api("/tasks/add_list", "POST", params); await fetchLists(); return res; }, [fetchLists]);
  const updateList = useCallback(async (params) => { const res = await api("/tasks/edit_list", "PUT", params); await fetchLists(); return res; }, [fetchLists]);
  const deleteList = useCallback(async (params) => { const res = await api("/tasks/del_list", "DELETE", params); await fetchLists(); return res; }, [fetchLists]);
  const linkListGroup = useCallback(async (params) => { const res = await api("/tasks/link_group_list", "PUT", params); await fetchLists(); return res; }, [fetchLists]);
  const deleteFromChildes = useCallback(async (params) => { const res = await api("/tasks/delete_from_childes", "DELETE", params); await fetchLists(); return res; }, [fetchLists]);
  const linkTaskList = useCallback(async (params) => { const res = await api("/tasks/link_task", "PUT", params); await fetchLists(); return res; }, [fetchLists]);
  const changeChildesOrder = useCallback(async (params) => { const res = await api("/tasks/change_childes_order", "PUT", params); await fetchLists(); return res; }, [fetchLists]);

  // Выбор списка
  const handleSelectList = useCallback((listId) => {
    setSelectedListId(listId);
    // Можно найти сам объект списка, если нужно
    // setSelectedList(...)
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

  const { version: wsVersion } = useUpdateWebSocket();

  useEffect(() => {
    if (wsVersion) {
      fetchLists();
      setVersion(wsVersion);
    }
  }, [wsVersion, fetchLists, setVersion]);

  const contextValue = useMemo(() => ({
    lists,
    selectedListId,
    setSelectedListId: handleSelectList,
    selectedList,
    setSelectedList,
    addList,
    updateList,
    deleteList,
    linkListGroup,
    deleteFromChildes,
    linkTaskList,
    changeChildesOrder,
    version,
    setVersion,
    fetchLists,
    loading: lists.loading,
  }), [lists, selectedListId, selectedList, fetchLists, addList, updateList, deleteList, linkListGroup, deleteFromChildes, linkTaskList, changeChildesOrder, version]);

  return <ListsContext.Provider value={contextValue}>{children}</ListsContext.Provider>;
};

ListsProvider.propTypes = { children: PropTypes.node.isRequired };

export default ListsContext; 