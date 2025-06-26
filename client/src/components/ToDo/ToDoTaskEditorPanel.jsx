import { useCallback } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TaskEditor from './TaskEditor';
import useTasks from './hooks/useTasks';
import useLists from './hooks/useLists';

export default function ToDoTaskEditorPanel({ mobile = false, setSelectedTaskId }) {
  const {
    tasks,
    selectedTaskId,
    taskFields,
    addSubTask,
    updateTask,
    changeTaskStatus,
    deleteTask,
    setSelectedTaskId: setTaskId,
  } = useTasks();
  const { selectedListId } = useLists();

  const handleAddSubTask = useCallback((subtask, taskId) => {
    addSubTask({ title: subtask, parentId: taskId });
    setNewSubTask && setNewSubTask("");
  }, [addSubTask]);

  if (!selectedTaskId) return null;
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
        <IconButton onClick={() => (setSelectedTaskId ? setSelectedTaskId(null) : setTaskId(null))}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ px: 1, flexGrow: 1, overflowY: 'auto', height: '100%' }}>
        {Object.keys(taskFields).length === 0 ? (
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>Загрузка полей задачи...</Typography>
        ) : (
          <TaskEditor
            key={selectedTaskId}
            tasks={tasks.data}
            selectedTaskId={selectedTaskId}
            taskFields={taskFields}
            addSubTask={addSubTask}
            updateTask={updateTask}
            changeTaskStatus={changeTaskStatus}
            deleteTask={deleteTask}
            selectedListId={selectedListId}
          />
        )}
      </Box>
    </Box>
  );
} 