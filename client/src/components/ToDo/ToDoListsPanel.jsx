import { Box, Button, IconButton } from '@mui/material';
import ListsList from './ListsList';
import QueueIcon from '@mui/icons-material/Queue';
import { AccountTree } from '@mui/icons-material';
import { useContext, memo } from 'react';
import { TasksContext } from './hooks/TasksContext';

function ToDoListsPanel({ mobile = false }) {
  const {
    lists,
    default_lists,
    projects,
    selectedListId,
    setSelectedListId: setListId,
    deleteFromChildes,
    linkListGroup,
    linkTaskList,
    addList,
    fetchLists,
    selectedTaskId,
    setSelectedTaskId,
  } = useContext(TasksContext);

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
          listsList={lists}
          defaultLists={default_lists}
          projects={projects}
          isNeedContextMenu={true}
          selectedListId={selectedListId}
          setSelectedListId={setListId}
          deleteFromChildes={deleteFromChildes}
          setSelectedTaskId={setSelectedTaskId}
          selectedTaskId={selectedTaskId}
          linkListGroup={linkListGroup}
          linkTaskList={linkTaskList}
          fetchLists={fetchLists}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', mt: 1 }}>
        <Button variant="outlined" sx={{ width: '100%' }} onClick={() => { addList({type: 'list', order: lists.lists.length}); setListId && setListId(null); }}>
          Создать список
        </Button>
        <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={() => { addList({type: 'group', order: lists.lists.length}); setListId && setListId(null); }}>
          <QueueIcon />
        </IconButton>
        <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={() => { addList({type: 'project', order: lists.lists.length}); setListId && setListId(null); }}>
          <AccountTree />
        </IconButton>
      </Box>
    </Box>
  );
}

export default memo(ToDoListsPanel);