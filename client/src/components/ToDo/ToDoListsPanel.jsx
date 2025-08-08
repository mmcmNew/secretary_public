import { Box, Button, Divider, IconButton } from '@mui/material';
import ListsTreeAnimated from './ListsTree/ListsTreeAnimated';
import QueueIcon from '@mui/icons-material/Queue';
import { AccountTree } from '@mui/icons-material';
import { memo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useGetListsTreeQuery, useAddObjectMutation, useMoveListObjectMutation, useUpdateListMutation } from '../../store/listsSlice';
import { setSelectedListId } from '../../store/todoLayoutSlice';


function ToDoListsPanel({ mobile }) {
  const dispatch = useDispatch();
  const { data, error, isLoading } = useGetListsTreeQuery();
  const [addObject] = useAddObjectMutation();
  const [moveListObject] = useMoveListObjectMutation();
  const [updateList] = useUpdateListMutation();
  const selectedListId = useSelector((state) => state.todoLayout.selectedListId);
  console.log('ToDoListsPanel data:', data);

  const handleDrop = (sectionIndex) => (newTree, options) => {
    const { dragSource, dropTargetId, dropTarget, action } = options;
    if (!dragSource) return;

    const source_id = dragSource.id;
    const target_id = dropTargetId === 0 ? null : dropTargetId;
    
    // Определяем тип операции
    const isSorting = !target_id || dropTarget?.data?.type === dragSource.data?.type;
    const operation = action || (isSorting ? 'sort' : 'move');
    
    if (operation === 'sort') {
      const targetIndex = newTree.findIndex(node => node.id === target_id);
      const newOrder = targetIndex >= 0 ? targetIndex : newTree.length;
      
      // Определяем тип сортировки
      const sourceNode = newTree.find(node => node.id === source_id);
      const isInsideContainer = sourceNode && sourceNode.parent !== 0;
      
      if (isInsideContainer) {
        // Сортировка внутри контейнера
        moveListObject({ 
          source_id, 
          action: 'sort', 
          container_id: sourceNode.parent,
          new_position: newOrder 
        });
      } else {
        // Сортировка в основном списке
        moveListObject({ source_id, action: 'sort', new_order: newOrder });
      }
    } else {
      moveListObject({ source_id, target_id, action: operation });
    }
  };

  const handleAddList = () => {
    addObject({ type: 'list', title: 'Новый список' });
  };

  const handleAddGroup = () => {
    addObject({ type: 'group', title: 'Новая группа' });
  };

  const handleAddProject = () => {
    addObject({ type: 'project', title: 'Новый проект' });
  };

  const handleSetSelectedListId = (listId) => {
    dispatch(setSelectedListId(listId));
  };

  if (isLoading) return <div>Загрузка списков...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!data || data.length === 0) return <div>Нет данных для отображения.</div>;

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
        {data.map((section, index) => (
          <Box key={index} sx={{ mb: 2, width: '97%' }}>
            <ListsTreeAnimated
              treeData={section}
              selectedId={selectedListId}
              onSelect={handleSetSelectedListId}
              onDrop={handleDrop(index)}
              onRename={(id, newTitle) => {
                updateList({ listId: id, title: newTitle });
              }}
            />
            {index === data.length - 1 ? null : <Divider />}
          </Box>
        ))}
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