import { Box, Button, Divider, IconButton } from '@mui/material';
import MuiListsTree from './MuiListsTree';
import QueueIcon from '@mui/icons-material/Queue';
import { AccountTree } from '@mui/icons-material';
import { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useGetListsTreeQuery, useAddObjectMutation, useMoveListObjectMutation, useUpdateListMutation } from '../../../store/listsSlice';

function MuiToDoListsPanel({ mobile }) {
  const dispatch = useDispatch();
  const { data, error, isLoading } = useGetListsTreeQuery();
  const [addObject] = useAddObjectMutation();
  const [moveListObject] = useMoveListObjectMutation();
  const [updateList] = useUpdateListMutation();
  const [selectedListId, setSelectedListId] = useState(null);
  console.log('MuiToDoListsPanel data:', data);

  const handleMove = useCallback((rootId, nodeId, newParentId) => {
    const section = data.find(s => s.rootId === rootId);
    if (!section) return;

    const newTree = [...section.data];
    const nodeIndex = newTree.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    newTree[nodeIndex] = {
      ...newTree[nodeIndex],
      parent: newParentId
    };

    moveListObject({ 
      section_id: rootId,
      new_tree: newTree,
      action: 'move'
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
            <MuiListsTree
              treeData={section.data}
              rootId={section.rootId}
              selectedId={selectedListId}
              onSelect={handleSetSelectedListId}
              onMove={handleMove}
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
 
MuiToDoListsPanel.propTypes = {
  mobile: PropTypes.bool,
};

export default memo(MuiToDoListsPanel);
