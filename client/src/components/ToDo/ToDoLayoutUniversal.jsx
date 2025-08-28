// import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery, Box, Grid } from '@mui/material';
import { DndProvider } from 'react-dnd';
import { MultiBackend, getBackendOptions } from '@minoru/react-dnd-treeview';
import ToDoListsPanel from './ToDoListsPanel';
import ToDoTasksPanel from './ToDoTasksPanel';
import ToDoTaskEditorPanel from './ToDoTaskEditorPanel';
import { useGetTasksByIdsQuery } from '../../store/tasksSlice';
import { useGetListsQuery } from '../../store/listsSlice';

function ToDoLayoutUniversal() {
  const isMobile = useMediaQuery('(max-width:600px)');

  const { selectedTaskId, selectedListId } = useSelector((state) => state.todoLayout);

  const { isLoading: listsLoading } = useGetListsQuery();

  const { isLoading: tasksLoading } = useGetTasksByIdsQuery();

  const showEditor = !!selectedTaskId;
  const isLoading = tasksLoading || listsLoading;

  const content = isMobile ? (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      {/* Списки */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: selectedListId ? "none" : "block",
        }}
      >
        <ToDoListsPanel />
      </Box>

      {/* Задачи */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: selectedListId && !showEditor ? "block" : "none",
        }}
      >
        <ToDoTasksPanel />
      </Box>

      {/* Редактор задачи */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: showEditor ? "block" : "none",
        }}
      >
        <ToDoTaskEditorPanel />
      </Box>
    </Box>
    ) : (
    <Box sx={{ padding: 2, height: '100%', width: '100%' }}>
      <Grid container spacing={0.5} sx={{ height: '100%' }}>
        <Grid item xs={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: '300px', maxWidth: '300px' }}>
          <ToDoListsPanel mobile={isMobile} />
        </Grid>
        <Grid
          item
          xs={12}
          md={showEditor ? 4 : 8}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}
        >
          <ToDoTasksPanel mobile={isMobile} />
        </Grid>
        {showEditor && (
          <Grid
            item
            xs={12}
            md={4}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '400px' }}
          >
            <ToDoTaskEditorPanel mobile={isMobile} />
          </Grid>
        )}
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

