import { Box, Button, IconButton } from '@mui/material';
import ListsList from './ListsList';
import QueueIcon from '@mui/icons-material/Queue';
import { AccountTree } from '@mui/icons-material';
import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useGetListsQuery, useAddObjectMutation, useMoveListObjectMutation, useUpdateListMutation, useDeleteListMutation } from '../../store/listsSlice';
import { setSelectedListId, setSelectedList, toggleGroup } from '../../store/todoLayoutSlice';


function ToDoListsPanel({ mobile }) {
  const dispatch = useDispatch();
  const { data, error, isLoading } = useGetListsQuery();
  const [addObject] = useAddObjectMutation();
  const [moveListObject] = useMoveListObjectMutation();
  const [updateList] = useUpdateListMutation();
  const [deleteList] = useDeleteListMutation();
  const { selectedListId, openGroups } = useSelector((state) => state.todoLayout);

  const handleToggleGroup = useCallback((groupId) => {
    dispatch(toggleGroup(groupId));
  }, [dispatch]);
  
  const handleAddList = () => addObject({ type: 'list', title: 'Новый список' });
  const handleAddGroup = () => addObject({ type: 'group', title: 'Новая группа' });
  const handleAddProject = () => addObject({ type: 'project', title: 'Новый проект' });

  const handleSetSelectedListId = (event, listId) => {
    dispatch(setSelectedListId(listId));
    const list = data?.lists.find(l => l.id === listId) || data?.default_lists.find(l => l.id === listId);
    dispatch(setSelectedList(list));
  };

  const handleUpdateList = (listId, data) => {
    updateList({ listId, ...data });
  };

  const handleDeleteList = (listId) => {
    deleteList({id: listId});
  };

  const handleMoveList = (listId, direction) => {
    // Logic to calculate new order would be here
    console.log(`Move ${listId} ${direction}`);
    // Example of what it might look like:
    // const list = data.lists.find(l => l.id === listId);
    // const newOrder = direction === 'up' ? list.order - 1 : list.order + 1;
    // moveListObject({ listId, newOrder });
  };

  if (isLoading) return <div>Загрузка списков...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!data) return <div>Нет данных для отображения.</div>;

  console.log('ToDoListsPanel data:', data);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%'
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: 'auto', height: mobile ? '90%' : '100%' }}>
        <ListsList
          lists={data.lists}
          defaultLists={data.default_lists}
          projects={data.projects}
          selectedListId={selectedListId}
          onSelectList={handleSetSelectedListId}
          onUpdateList={handleUpdateList}
          onDeleteList={handleDeleteList}
          onMoveList={handleMoveList}
          isNeedContextMenu={true}
          openGroups={openGroups}
          onToggleGroup={handleToggleGroup}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', mt: 1 }}>
        <Button variant="outlined" sx={{ width: '100%' }} onClick={handleAddList}>
          Создать список
        </Button>
        <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={handleAddGroup}>
          <QueueIcon />
        </IconButton>
        <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={handleAddProject}>
          <AccountTree />
        </IconButton>
      </Box>
    </Box>
  );
}
 
ToDoListsPanel.propTypes = {
  mobile: PropTypes.bool,
};

export default memo(ToDoListsPanel);