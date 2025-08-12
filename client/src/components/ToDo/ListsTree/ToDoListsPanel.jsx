import { Box, Button, Divider, IconButton } from '@mui/material';
import ListsTreeAnimated from './ListsTreeAnimated';
import QueueIcon from '@mui/icons-material/Queue';
import { AccountTree } from '@mui/icons-material';
import { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useGetListsTreeQuery, useAddObjectMutation, useMoveListObjectMutation, useUpdateListMutation } from '../../../store/listsSlice';
// import { setSelectedListId } from '../../store/todoLayoutSlice';


function ToDoListsPanel({ mobile }) {
  const dispatch = useDispatch();
  const { data, error, isLoading } = useGetListsTreeQuery();
  const [addObject] = useAddObjectMutation();
  const [moveListObject] = useMoveListObjectMutation();
  const [updateList] = useUpdateListMutation();
  const [selectedListId, setSelectedListId] = useState(null);
  // const selectedListId = useSelector);
  console.log('ToDoListsPanel data:', data);

  const handleDrop = useCallback((rootId, newTree, options) => {
    // console.log('🌳 Отправляем дерево:', { section: rootId, options: options });
    
    // Очищаем данные от React ссылок
    let cleanTree = newTree?.map(node => ({
      id: node.id,
      parent: node.parent,
      droppable: node.droppable,
      text: node.text,
      data: node.data
    }));

    // Проверяем перемещение между секциями
    const draggedElement = options?.dragSource;
    const draggedElementData = options?.dragSource?.data;
    const draggedElementId = options?.dragSource?.id;
    // console.log('1. Dragged element:', draggedElement, 'Dragged element ID:', draggedElementId, 'Section:', rootId);
        
    if (draggedElementData?.rootId && draggedElementData.rootId !== rootId) {
      const oldSection = data.find(s => s.rootId === draggedElementData.rootId);
      let newOldTree = oldSection?.data || [];
      // console.log('2. Old section:', oldSection);
      
      if (oldSection) {
        // console.log('3. Dragged node:', draggedElement);
        
        // Если элемент - папка, обрабатываем детей
        if (draggedElement?.droppable) {
          // console.log('4. Dragged node is droppable');

          const children = oldSection.data.filter(n => n.parent === draggedElementId);
          const updatedChildren = children.map(child => ({
            ...child,
            data: { ...child.data, rootId: rootId }
          }));
          // console.log('5. Updated children:', updatedChildren);
          cleanTree = [...cleanTree, ...updatedChildren];
          // console.log('6. Clean tree after adding children:', cleanTree);
        }
        newOldTree = oldSection.data.filter(n => n.id !== draggedElementId && n.parent !== draggedElementId);
        // console.log('7. Old tree after removal:', newOldTree);

        moveListObject({ section_id: oldSection.id, new_tree: newOldTree });

        cleanTree = cleanTree.map(node => ({
          ...node,
          data: { ...node.data, rootId: rootId }
        }));
        // console.log('8. Clean tree after updating rootId:', cleanTree);
      }
    };
    // console.log('9. Final tree to send:', cleanTree);
    
    moveListObject({ 
      section_id: rootId,
      new_tree: cleanTree,
      action: options?.action
    });
  }, [moveListObject, data]);

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
  if (!data || data.length === 0) return <div>Нет данных для отображения.</div>;

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
        {data.map((section, index) => (
          <Box key={section.id} sx={{ mb: 2, width: '97%' }}>
            <ListsTreeAnimated
              treeData={section.data}
              rootId={section.rootId}
              selectedId={selectedListId}
              onSelect={handleSetSelectedListId}
              onDrop={handleDrop}
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