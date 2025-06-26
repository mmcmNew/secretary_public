import { useState, useCallback, useEffect, useContext } from 'react';
import { useMediaQuery, Box, Grid, Typography } from '@mui/material';
import ToDoListsPanel from './ToDoListsPanel';
import ToDoTasksPanel from './ToDoTasksPanel';
import ToDoTaskEditorPanel from './ToDoTaskEditorPanel';
import useTasks from './hooks/useTasks';
import useLists from './hooks/useLists';
import { ErrorContext } from '../../contexts/ErrorContext';

function ToDoLayoutUniversal() {
  const isMobile = useMediaQuery('(max-width:600px)');
  const {
    addTask,
    addSubTask,
    updateTask,
    fetchTasks,
    selectedTaskId,
    tasks,
  } = useTasks();
  const tasksLoading = tasks.loading;
  const {
    selectedListId,
    fetchLists,
    lists,
  } = useLists();
  const listsLoading = lists.loading;
  const { setError } = useContext(ErrorContext);

  // Состояния для ввода
  const [newTask, setNewTask] = useState('');
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

  const handleAdditionalButtonClick = useCallback((task) => {
    const priority = task.priority_id === 3 ? 1 : 3;
    if (typeof updateTask === 'function')
      updateTask({ taskId: task.id, priority_id: priority });
  }, [updateTask]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (newTask.trim() === '') return;
      addTask({ title: newTask });
      setNewTask('');
    }
  }, [newTask, addTask]);

  const handleAddTask = useCallback(() => {
    addTask({ title: newTask });
    setNewTask('');
  }, [newTask, addTask]);

  if (loading) {
    return <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box sx={{ opacity: 0.5, pointerEvents: 'none' }}>
        {/* Основной UI */}
        {isMobile ? (
          <Box sx={{ height: '100%', width: '100%' }}>
            <ToDoListsPanel mobile />
            <ToDoTasksPanel mobile additionalButtonClick={handleAdditionalButtonClick} />
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
        )}
      </Box>
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5">Загрузка...</Typography>
      </Box>
    </Box>;
  }
  
  return (
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
}

export default ToDoLayoutUniversal;
