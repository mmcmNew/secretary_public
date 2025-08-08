// hooks/useListsTree.js
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// import api from '../../../utils/api';

export const useListsTree = () => {
  // const queryClient = useQueryClient();
  const [treeLists, setTreeLists] = useState({ lists: {}, projects: {}, default_lists: {} });
  const [loading, setLoading] = useState(false);

  const fetchListsTree = useCallback(async (options = {}) => {
    const { silent = false, refetch = false } = options;
    
    if (!silent) {
      setLoading(true);
    }
    
    // try {
    //   // const { data } = await api.get('/tasks/get_lists_tree');
    //   setTreeLists({
    //     lists: data.lists,
    //     projects: data.projects,
    //     default_lists: data.default_lists,
    //   });
    //   return data;
    // } finally {
    //   if (!silent) {
    //     setLoading(false);
    //   }
    // }
  }, []);

  return {
    treeLists,
    loading,
    fetchListsTree,
  };
};