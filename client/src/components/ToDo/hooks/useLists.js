// hooks/useLists.js
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../utils/api';

export const useLists = () => {
  const queryClient = useQueryClient();
  const [lists, setLists] = useState({ lists: [], projects: [], default_lists: [] });

  const addListMutation = useMutation({
    mutationFn: (params) => api.post('/tasks/add_list', params),
  });
  const updateListMutation = useMutation({
    mutationFn: (params) => api.put('/tasks/edit_list', params),
  });
  const deleteListMutation = useMutation({
    mutationFn: (params) => api.put('/tasks/edit_list', { ...params, deleted: true }),
  });

  const fetchLists = useCallback(async () => {
    const { data } = await api.get('/tasks/get_lists');
    setLists({
      lists: data.lists,
      projects: data.projects,
      default_lists: data.default_lists,
    });
    return data;
  }, []);

  const addList = useCallback(async (params) => {
    const res = await addListMutation.mutateAsync(params);
    if (res.new_object) {
      setLists(prev => ({
        ...prev,
        lists: res.object_type === 'project' ? prev.lists : [...prev.lists, res.new_object],
        projects: res.object_type === 'project' ? [...prev.projects, res.new_object] : prev.projects,
      }));
    }
    return res;
  }, [addListMutation]);

  const updateList = useCallback(async (params) => {
    const res = await updateListMutation.mutateAsync(params);
    if (res.updated_list) {
      setLists(prev => ({
        ...prev,
        lists: prev.lists.map(l => l.id === res.updated_list.id ? res.updated_list : l),
        projects: prev.projects.map(p => p.id === res.updated_list.id ? res.updated_list : p),
        default_lists: prev.default_lists.map(d => d.id === res.updated_list.id ? res.updated_list : d),
      }));
    }
    return res;
  }, [updateListMutation]);

  const deleteList = useCallback(async (params) => {
    const res = await deleteListMutation.mutateAsync(params);
    if (res.updated_list) {
      setLists(prev => ({
        ...prev,
        lists: prev.lists.filter(l => l.id !== res.updated_list.id),
        projects: prev.projects.filter(p => p.id !== res.updated_list.id),
        default_lists: prev.default_lists.filter(d => d.id !== res.updated_list.id),
      }));
    }
    return res;
  }, [deleteListMutation]);

  return {
    lists,
    fetchLists,
    addList,
    updateList,
    deleteList,
  };
};