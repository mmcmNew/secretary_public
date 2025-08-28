import { useCallback, memo, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TaskEditor from './TaskEditor';
import { setSelectedTaskId } from '../../store/todoLayoutSlice';
import { 
  useAddSubtaskMutation, 
  useUpdateTaskMutation, 
  useChangeTaskStatusMutation, 
  useDeleteTaskMutation, 
  useGetFieldsConfigQuery, 
  useGetTasksByIdsQuery, 
  // useLazyGetTasksByIdsQuery 
} from '../../store/tasksSlice';
import PropTypes from 'prop-types';

function ToDoTaskEditorPanel({ mobile = false }) {
  const dispatch = useDispatch();
  const { selectedTaskId } = useSelector((state) => state.todoLayout);

  // 1. Получаем основную задачу
  const {
    data: taskData,
    isLoading: isTaskLoading,
    error: taskError,
  } = useGetTasksByIdsQuery(
    { ids: selectedTaskId ? [selectedTaskId] : [] },
    { skip: !selectedTaskId }
  );

  const task = useMemo(() => taskData?.tasks?.[0], [taskData]);

  // 2. Получаем дочерние задачи
  const childTaskIds = useMemo(() => task?.childes_order || [], [task]);

  const {
    data: subtasksData,
    isLoading: areSubtasksLoading,
    error: subtasksError,
  } = useGetTasksByIdsQuery(
    { ids: childTaskIds },
    { skip: childTaskIds.length === 0 }
  );

  const subtasks = useMemo(() => subtasksData?.tasks || [], [subtasksData]);

  const tasksLoading = isTaskLoading || areSubtasksLoading;
  const tasksError = taskError || subtasksError;

  console.log('ToDoTaskEditorPanel:', {
    selectedTaskId,
    hasTask: !!task,
    subtasksCount: subtasks?.length || 0,
    childesOrder: task?.childes_order || [],
    tasksLoading,
    tasksError: tasksError?.message,
  });

  const { data: taskFields = {} } = useGetFieldsConfigQuery();
  console.log('ToDoTaskEditorPanel: taskFields', taskFields);

  // Mutations
  const [addSubtask] = useAddSubtaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [changeTaskStatus] = useChangeTaskStatusMutation();
  const [deleteTask] = useDeleteTaskMutation();

  // Stable callbacks
  const handleTaskEditorChange = useCallback(
    async (updatedTask) => {
      if (!updatedTask?.taskId) {
        console.log('handleTaskEditorChange skipped:', updatedTask);
        return;
      }

      console.log('🔄 handleTaskEditorChange called:', updatedTask);

      try {
        const result = await updateTask(updatedTask).unwrap();
        console.log('✅ updateTask success:', result);
      } catch (error) {
        console.error('❌ updateTask error:', error);
      }
    },
    [updateTask]
  );

  const handleCloseEditor = useCallback(() => {
    dispatch(setSelectedTaskId(null));
  }, [dispatch]);

  // Early return if no task
  if (!task) {
    if (tasksLoading) {
      return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Загрузка задачи...
          </Typography>
        </Box>
      );
    }

    if (tasksError) {
      return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="error">
            Ошибка загрузки задачи: {tasksError.message}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Задача не найдена
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        {mobile ? (
          <Button onClick={handleCloseEditor}>Назад</Button>
        ) : (
          <IconButton onClick={handleCloseEditor} sx={{ ml: 'auto' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Box sx={{ px: 1, flexGrow: 1, overflowY: 'auto', height: '100%' }}>
        {Object.keys(taskFields).length === 0 ? (
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Загрузка полей задачи...
          </Typography>
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