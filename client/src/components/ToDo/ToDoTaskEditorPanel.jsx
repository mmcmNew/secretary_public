import { useCallback, memo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TaskEditor from './TaskEditor';
import { setSelectedTaskId } from '../../store/todoLayoutSlice';
import { useGetSubtasksQuery, useAddSubtaskMutation, useUpdateTaskMutation, useChangeTaskStatusMutation, useDeleteTaskMutation, useGetFieldsConfigQuery } from '../../store/tasksSlice';
import PropTypes from 'prop-types';

function ToDoTaskEditorPanel({ mobile = false }) {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.byId || []);
  const [task, setTask] = useState(null);
  const { selectedTask, selectedTaskId } = useSelector((state) => state.todoLayout);
  console.log('ToDoTaskEditorPanel render', { tasks, selectedTask, selectedTaskId });
  
  useEffect(() => {
    if (selectedTaskId) {
      const foundTask = tasks?.byId?.find(t => t.id === selectedTaskId) || selectedTask || null;
      setTask(foundTask || selectedTask);
    } else {
      setTask(null);  
    }
  }, [tasks, selectedTask, selectedTaskId]);

  // const task = tasks?.byId?.find(t => t.id === selectedTaskId) || selectedTask;
  
  const { data: subtasks = [] } = useGetSubtasksQuery(selectedTaskId, {
    skip: !selectedTaskId
  });
  
  const { data: taskFields = {} } = useGetFieldsConfigQuery();
  
  const [addSubtask] = useAddSubtaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [changeTaskStatus] = useChangeTaskStatusMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const handleTaskEditorChange = useCallback(async (updatedTask) => {
    if (!updatedTask || !updatedTask.id) return;
    await updateTask({ taskId: updatedTask.id, ...updatedTask });
  }, [updateTask]);
  
  const handleCloseEditor = useCallback(() => {
    dispatch(setSelectedTaskId(null));
  }, [dispatch]);

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
        {mobile ? (
          <Button onClick={handleCloseEditor}>Назад</Button>
        ): (
          <IconButton onClick={handleCloseEditor} sx={{ ml: 'auto' }}>
            <CloseIcon />
          </IconButton>
        )}
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
            addSubTask={addSubtask}
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

ToDoTaskEditorPanel.propTypes = {
  mobile: PropTypes.bool,
};