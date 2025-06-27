import { Box, Button, IconButton } from '@mui/material';
import ListsList from './ListsList';
import QueueIcon from '@mui/icons-material/Queue';
import { AccountTree } from '@mui/icons-material';
import useLists from './hooks/useLists';
import useTasks from './hooks/useTasks';

export default function ToDoListsPanel({ mobile = false, setSelectedListId }) {
  const {
    lists,
    setSelectedListId: setListId,
    deleteFromChildes,
    linkListGroup,
    addList,
    fetchLists,
  } = useLists();
  const {
    selectedTaskId,
    setSelectedTaskId
  } = useTasks();

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
          listsList={lists.lists}
          defaultLists={lists.default_lists}
          projects={lists.projects}
          isNeedContextMenu={true}
          setSelectedListId={setListId}
          deleteFromChildes={deleteFromChildes}
          setSelectedTaskId={setSelectedTaskId}
          selectedTaskId={selectedTaskId}
          linkListGroup={linkListGroup}
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