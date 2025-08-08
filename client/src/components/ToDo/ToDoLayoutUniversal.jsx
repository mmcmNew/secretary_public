import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery, Box, Grid } from '@mui/material';
import { DndProvider } from 'react-dnd';
import { MultiBackend, getBackendOptions } from '@minoru/react-dnd-treeview';
import ToDoListsPanel from './ToDoListsPanel';
// import ToDoTasksPanel from './ToDoTasksPanel';
// import ToDoTaskEditorPanel from './ToDoTaskEditorPanel';
import { useGetTasksQuery } from '../../store/tasksSlice';
import { useGetListsQuery } from '../../store/listsSlice';

function ToDoLayoutUniversal() {
  const isMobile = useMediaQuery('(max-width:600px)');

  const selectedTaskId = useSelector((state) => state.tasks.selectedTaskId);
  const selectedListId = useSelector((state) => state.lists.selectedListId);

  const {
    data: tasksData,
    isLoading: tasksLoading,
  } = useGetTasksQuery(selectedListId, {
    skip: !selectedListId,
  });

  const {
    isLoading: listsLoading,
  } = useGetListsQuery();

  const selectedTask = useMemo(() => {
    if (!selectedTaskId || !tasksData) return null;
    return tasksData.find((task) => task.id === selectedTaskId);
  }, [selectedTaskId, tasksData]);

  const showEditor = !!selectedTask;
  const isLoading = tasksLoading || listsLoading;

  const content = isMobile ? (
    <Box sx={{ height: '100%', width: '100%' }}>
      <ToDoListsPanel mobile />
      {/* <ToDoTasksPanel mobile /> */}
      {/* {showEditor && <ToDoTaskEditorPanel mobile task={selectedTask} />} */}
    </Box>
  ) : (
    <Box sx={{ padding: 2, height: '100%', width: '100%' }}>
      <Grid container spacing={0.5} sx={{ height: '100%' }}>
        <Grid item xs={12} md={12} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ToDoListsPanel mobile={isMobile} />
        </Grid>
        {/* <Grid
          item
          xs={12}
          md={showEditor ? 5 : 9}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}
        >
          <ToDoTasksPanel />
        </Grid>
        {showEditor && (
          <Grid
            item
            xs={12}
            md={4}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '400px' }}
          >
            <ToDoTaskEditorPanel task={selectedTask} />
          </Grid>
        )} */}
      </Grid>
    </Box>
  );

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Box sx={{ pointerEvents: isLoading ? 'none' : 'auto', opacity: isLoading ? 0.5 : 1, height: '100%'}}>
          {content}
        </Box>
      </Box>
    </DndProvider>
  );
}

export default ToDoLayoutUniversal;

