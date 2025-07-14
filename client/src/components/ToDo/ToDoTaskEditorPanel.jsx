import { useCallback, useEffect, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TaskEditor from './TaskEditor';
import useTasks from './hooks/useTasks';

export default function ToDoTaskEditorPanel({ mobile = false, setSelectedTaskId }) {
  const {
    tasks,
    myDayTasks,
    selectedTaskId,
    taskFields,
    addSubTask,
    updateTask,
    changeTaskStatus,
    deleteTask,
    setSelectedTaskId: setTaskId,
    getSubtasksByParentId,
    fetchTasks,
  } = useTasks();

  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);

  // Загружаем задачу и подзадачи при изменении selectedTaskId
  useEffect(() => {
    if (!selectedTaskId) {
      setTask(null);
      setSubtasks([]);
      return;
    }
    // Найти задачу по id
    const allTasks = [...(tasks?.data || []), ...(myDayTasks?.data || [])];
    const foundTask = allTasks.find(t => t.id === selectedTaskId);
    setTask(foundTask || null);
    // Загрузить подзадачи
    if (foundTask) {
      getSubtasksByParentId(foundTask.id).then(setSubtasks);
    } else {
      setSubtasks([]);
    }
  }, [selectedTaskId, tasks, myDayTasks, getSubtasksByParentId]);

  // onChange для TaskEditor
  const handleTaskEditorChange = useCallback(async (updatedTask) => {
    if (!updatedTask || !updatedTask.id) return;
    await updateTask({ taskId: updatedTask.id, ...updatedTask });
    await fetchTasks();
  }, [updateTask, fetchTasks]);

  if (!selectedTaskId || !task) return null;
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