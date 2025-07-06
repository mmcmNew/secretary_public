import { useCallback, useEffect, useContext } from 'react';
import { useMediaQuery, Box, Grid, Typography } from '@mui/material';
import ToDoListsPanel from './ToDoListsPanel';
import ToDoTasksPanel from './ToDoTasksPanel';
import ToDoTaskEditorPanel from './ToDoTaskEditorPanel';
import useTasks from './hooks/useTasks';
import { ErrorContext } from '../../contexts/ErrorContext';
import useNewTaskInput from './hooks/useNewTaskInput';
import PropTypes from 'prop-types';

function ToDoLayoutUniversal() {
  const isMobile = useMediaQuery('(max-width:600px)');
  const {
    addTask,
    addSubTask,
    updateTask,
    fetchTasks,
    selectedTaskId,
    tasks,
    selectedListId,
    fetchLists,
    lists,
  } = useTasks();
  const tasksLoading = tasks.loading;
  const listsLoading = lists.loading;
  const { setError, setSuccess } = useContext(ErrorContext);
  const { submitTask } = useNewTaskInput();
  const showEditor = Boolean(selectedTaskId);
  const loading = tasksLoading || listsLoading;

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (selectedListId) {
      fetchTasks(selectedListId);
    }
  }, [selectedListId, fetchTasks]);

  const handleAdditionalButtonClick = useCallback(async (task) => {
    const priority = task.priority_id === 3 ? 1 : 3;
    try {
      if (typeof updateTask === 'function') {
        await updateTask({ taskId: task.id, priority_id: priority, listId: selectedListId });
        setSuccess('Приоритет обновлен');
      }
    } catch (err) {
      setError(err);
    }
  }, [updateTask, selectedListId, setError, setSuccess]);


  const content = isMobile ? (
    <Box sx={{ height: '100%', width: '100%' }}>
      <ToDoListsPanel mobile />
      <ToDoTasksPanel
        mobile
        additionalButtonClick={handleAdditionalButtonClick}
        onSuccess={setSuccess}
        onError={setError}
      />
      {showEditor && <ToDoTaskEditorPanel mobile />}
    </Box>
  ) : (
    <Box sx={{ padding: 2, height: '100%', width: '100%' }}>
      <Grid container spacing={0.5} sx={{ height: '100%' }}>
        {/* 1. Списки задач (фиксировано md=3) */}
        <Grid item xs={12} md={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '350px' }}>
          <ToDoListsPanel />
        </Grid>

        {/* 2. Задачи (адаптивная ширина) */}
        <Grid
          item
          xs={12}
          md={showEditor ? 5 : 9}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}
        >
          <ToDoTasksPanel
            additionalButtonClick={handleAdditionalButtonClick}
            onSuccess={setSuccess}
            onError={setError}
          />
        </Grid>

        {/* 3. Редактор задачи (отображается по условию, md=4) */}
        {showEditor && (
          <Grid
            item
            xs={12}
            md={4}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '400px' }}
          >
            <ToDoTaskEditorPanel />
          </Grid>
        )}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box sx={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto', height: '100%' }}>
        {content}
      </Box>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(255,255,255,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5">Загрузка...</Typography>
        </Box>
      )}
    </Box>
  );
}

export default ToDoLayoutUniversal;

ToDoLayoutUniversal.propTypes = {};
