import { Box, Button, IconButton } from '@mui/material';
import ListsList from './ListsList';
import QueueIcon from '@mui/icons-material/Queue';
import { AccountTree } from '@mui/icons-material';
import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useGetListsQuery, useAddObjectMutation, useUpdateListMutation, useDeleteListMutation, useLinkItemsMutation, useMoveItemsMutation, useDeleteFromChildesMutation, useAddToGeneralListMutation } from '../../store/listsSlice';
import { setSelectedListId, setSelectedList, toggleGroup } from '../../store/todoLayoutSlice';


function ToDoListsPanel({ mobile }) {
  const dispatch = useDispatch();
  const { data, error, isLoading } = useGetListsQuery();
  const [addObject] = useAddObjectMutation();
  const [updateList] = useUpdateListMutation();
  const [deleteList] = useDeleteListMutation();
  const [linkItems] = useLinkItemsMutation();
  const [moveItems] = useMoveItemsMutation();
  const [deleteFromChildes] = useDeleteFromChildesMutation();
  const [addToGeneralListMutation] = useAddToGeneralListMutation();
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
    console.log(`Move ${listId} ${direction}`);
  };

  const handleLinkToList = (sourceType, sourceId, targetType, targetId, opts = {}) => {
    console.log('🔗 ToDoListsPanel: handleLinkToList called', { sourceType, sourceId, targetType, targetId, opts });
    const payload = { source_type: sourceType, source_id: sourceId, target_type: targetType, target_id: targetId };
    if (opts.source_parent_id) payload.source_parent_id = opts.source_parent_id;
    if (opts.source_parent_type) payload.source_parent_type = opts.source_parent_type;
    linkItems(payload);
  };

  const handleMoveToList = (sourceType, sourceId, targetType, targetId, opts = {}) => {
    console.log('📦 ToDoListsPanel: handleMoveToList called', { sourceType, sourceId, targetType, targetId, opts });
    const payload = { source_type: sourceType, source_id: sourceId, target_type: targetType, target_id: targetId };
    if (opts.source_parent_id) payload.source_parent_id = opts.source_parent_id;
    if (opts.source_parent_type) payload.source_parent_type = opts.source_parent_type;
    moveItems(payload);
  };

  const handleDeleteFromChildes = (sourceId, groupId) => {
    console.log('🗑️ ToDoListsPanel: handleDeleteFromChildes called', { sourceId, groupId });
    deleteFromChildes({ source_id: sourceId, group_id: groupId });
  };

  const handleChangeChildesOrder = (itemId, direction) => {
    console.log('↕️ ToDoListsPanel: handleChangeChildesOrder called', { itemId, direction });
  };

  const handleAddToGeneralList = (itemId) => {
    console.log('📋 ToDoListsPanel: handleAddToGeneralList called', { itemId });
    addToGeneralListMutation({ item_id: itemId });
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
          onDeleteFromChildes={handleDeleteFromChildes}
          onChangeChildesOrder={handleChangeChildesOrder}
          onLinkToList={handleLinkToList}
          onMoveToList={handleMoveToList}
          onAddToGeneralList={handleAddToGeneralList}
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