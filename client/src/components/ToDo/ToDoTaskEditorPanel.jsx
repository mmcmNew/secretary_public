import { useCallback, memo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TaskEditor from './TaskEditor';

function ToDoTaskEditorPanel({ mobile = false, setSelectedTaskId, task, subtasks, taskFields, addSubTask, updateTask, changeTaskStatus, deleteTask, fetchTasks }) {
  // onChange для TaskEditor
  const handleTaskEditorChange = useCallback(async (updatedTask) => {
    if (!updatedTask || !updatedTask.id) return;
    await updateTask({ taskId: updatedTask.id, ...updatedTask });
    await fetchTasks();
  }, [updateTask, fetchTasks]);

  if (!task) return null;
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
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton onClick={() => (setSelectedTaskId ? setSelectedTaskId(null) : null)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ px: 1, flexGrow: 1, overflowY: 'auto', height: '100%' }}>
        {Object.keys(taskFields).length === 0 ? (
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>Загрузка полей задачи...</Typography>
        ) : (
          <TaskEditor
            key={task.id}
            task={task}
            subtasks={subtasks}
            taskFields={taskFields}
            addSubTask={addSubTask}
            changeTaskStatus={changeTaskStatus}
            deleteTask={deleteTask}
            onChange={handleTaskEditorChange}
          />
        )}
      </Box>
    </Box>
  );
}

export default memo(ToDoTaskEditorPanel);