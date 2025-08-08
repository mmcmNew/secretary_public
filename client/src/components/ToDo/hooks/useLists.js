// hooks/useLists.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import api from '../../../utils/api';

export const useLists = () => {
  const queryClient = useQueryClient();

  // Используем useQuery для получения и кеширования списков
  const { data: listsData, isLoading, error } = useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      // const { data } = await api.get('/tasks/get_lists');
      // return data;
    },
    initialData: { lists: [], projects: [], default_lists: [] } // Начальные данные
  });

  const addListMutation = useMutation({
    // mutationFn: (params) => api.post('/tasks/add_list', params),
    // onSuccess: () => {
    //   // Автоматически инвалидируем кеш, чтобы React Query сам обновил данные
    //   queryClient.invalidateQueries({ queryKey: ['lists'] });
    // },
  });

  const updateListMutation = useMutation({
    mutationFn: (params) => api.put('/tasks/edit_list', params),
    // Оптимистичное обновление для мгновенного отклика UI
    onMutate: async (updatedList) => {
      await queryClient.cancelQueries({ queryKey: ['lists'] });
      const previousLists = queryClient.getQueryData(['lists']);

      queryClient.setQueryData(['lists'], old => {
        if (!old) return old;
        const update = (list) => list.id === updatedList.listId ? { ...list, ...updatedList } : list;
        return {
          ...old,
          lists: old.lists.map(update),
          projects: old.projects.map(update),
          default_lists: old.default_lists.map(update),
        };
      });

      return { previousLists };
    },
    onError: (err, newTodo, context) => {
      // Откат в случае ошибки
      queryClient.setQueryData(['lists'], context.previousLists);
    },
    onSettled: () => {
      // Финальная синхронизация с сервером
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const deleteListMutation = useMutation({
    // mutationFn: (params) => api.put('/tasks/edit_list', { ...params, deleted: true }),
    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ['lists'] });
    // },
  });

  return {
    // Данные и состояние загрузки теперь приходят из useQuery
    lists: listsData,
    listsLoading: isLoading,
    listsError: error,
    
    // Мутации остаются для выполнения действий
    addList: addListMutation.mutateAsync,
    updateList: updateListMutation.mutateAsync,
    deleteList: deleteListMutation.mutateAsync,
  };
};