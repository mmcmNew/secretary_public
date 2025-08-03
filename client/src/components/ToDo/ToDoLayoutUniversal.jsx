import { useCallback, useEffect, useContext, useState } from 'react';
import { useMediaQuery, Box, Grid, Typography } from '@mui/material';
import ToDoListsPanel from './ToDoListsPanel';
import ToDoTasksPanel from './ToDoTasksPanel';
import ToDoTaskEditorPanel from './ToDoTaskEditorPanel';
import { TasksContext } from './hooks/TasksContext';
import { ErrorContext } from '../../contexts/ErrorContext';

function ToDoLayoutUniversal() {
  const isMobile = useMediaQuery('(max-width:600px)');
  const {
    updateTask,
    fetchTasks,
    selectedTaskId,
    tasks,
    myDayTasks,
    selectedListId,
    fetchLists,
    lists,
    // getSubtasksByParentId,
    // setTasks,
    taskFields,
    addSubTask,
    changeTaskStatus,
    deleteTask,
  } = useContext(TasksContext);
  const tasksLoading = tasks.loading;
  const listsLoading = lists.loading;
  const { setError, setSuccess } = useContext(ErrorContext);
  const showEditor = Boolean(selectedTaskId);
  const loading = tasksLoading || listsLoading;

  const [editorTask, setEditorTask] = useState(null);
  const [editorSubtasks, setEditorSubtasks] = useState([]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (selectedListId) {
      fetchTasks(selectedListId);
    }
  }, [selectedListId, fetchTasks]);

  // Загружаем задачу и подзадачи при изменении selectedTaskId
  useEffect(() => {
    if (!selectedTaskId) {
      setEditorTask(null);
      setEditorSubtasks([]);
      return;
    }
    // Найти задачу по id
    const allTasks = [...(tasks?.data || []), ...(myDayTasks?.data || [])];
    const foundTask = allTasks.find(t => t.id === selectedTaskId);
    setEditorTask(foundTask || null);
    // TODO: Implement subtasks loading if needed
    // if (foundTask) {
    //   getSubtasksByParentId(foundTask.id).then(subs => {
    //     setEditorSubtasks(subs);
    //     // Добавляем подзадачи в общий список задач, если их там нет
    //     if (subs && subs.length > 0) {
    //       setTasks(prev => ({
    //         ...prev,
    //         data: [...prev.data, ...subs.filter(s => !prev.data.some(t => t.id === s.id))]
    //       }));
    //     }
    //   });
    // } else {
    //   setEditorSubtasks([]);
    // }
  }, [selectedTaskId, tasks, myDayTasks]);

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
      {showEditor && (
        <ToDoTaskEditorPanel
          mobile
          setSelectedTaskId={null}
          task={editorTask}
          subtasks={editorSubtasks}
          taskFields={taskFields}
          addSubTask={addSubTask}
          updateTask={updateTask}
          changeTaskStatus={changeTaskStatus}
          deleteTask={deleteTask}
          fetchTasks={fetchTasks}
        />
      )}
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
            <ToDoTaskEditorPanel
              setSelectedTaskId={null}
              task={editorTask}
              subtasks={editorSubtasks}
              taskFields={taskFields}
              addSubTask={addSubTask}
              updateTask={updateTask}
              changeTaskStatus={changeTaskStatus}
              deleteTask={deleteTask}
              fetchTasks={fetchTasks}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box sx={{ pointerEvents: loading ? 'none' : 'auto', height: '100%'}}>
         {/* opacity: loading ? 0.5 : 1, }}> */}
        {content}
      </Box>
      {/* {loading && (
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
      )} */}
    </Box>
  );
}

export default ToDoLayoutUniversal;

ToDoLayoutUniversal.propTypes = {};
