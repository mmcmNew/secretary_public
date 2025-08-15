import { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button, Paper, InputBase, Typography, TextField, IconButton } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import AddIcon from '@mui/icons-material/Add';
import TasksList from './TasksList';
import { useGetTasksQuery, useAddTaskMutation } from '../../store/tasksSlice';
import { useGetListsQuery, useUpdateListMutation } from '../../store/listsSlice';
import { setSelectedListId, setEditingTitle, setNewTask, resetNewTask } from '../../store/todoLayoutSlice';

function ToDoTasksPanel({ mobile = false }) {
  const dispatch = useDispatch();
  const { selectedListId, selectedList, isEditingTitle, editingTitle, newTask } = useSelector((state) => state.todoLayout);

  const { data: tasks = [] } = useGetTasksQuery(selectedListId, {
    skip: !selectedListId,
  });

  const { isDefaultList } = useGetListsQuery(undefined, {
    selectFromResult: ({ data }) => ({
      isDefaultList: data?.default_lists.some(l => l.id === selectedListId),
    }),
  });

  const [addTask, { isLoading: isAddingTask }] = useAddTaskMutation();
  const [updateList, { isLoading: isUpdatingList }] = useUpdateListMutation();

  const handleAddTask = async () => {
    if (newTask.trim() === '' || !selectedListId) return;
    try {
      await addTask({ title: newTask, list_id: selectedListId }).unwrap();
      dispatch(resetNewTask());
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTask();
    }
  };

  const handleTitleEdit = async () => {
    if (editingTitle.trim() !== '' && selectedList) {
      try {
        await updateList({ 
          listId: selectedList.id, 
          title: editingTitle.trim(),
          type: selectedList.type 
        }).unwrap();
        dispatch(setEditingTitle({ isEditing: false, title: '' }));
      } catch (error) {
        console.error('Failed to update list title:', error);
      }
    }
  };

  if (!selectedListId) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Выберите список для просмотра задач
        </Typography>
      </Box>
    );
  }

  if (selectedList?.type === 'group' || selectedList?.type === 'project') {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" align="center">
          {selectedList.type === 'group' ? 'Описание группы (заглушка)' : 'Описание проекта (заглушка)'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {selectedList && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: mobile ? 1 : 4, py: 2, my: 1, borderBottom: '1px solid #ddd', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
            <ListIcon sx={{ mr: 1, flexShrink: 0 }} />
            {isEditingTitle ? (
              <TextField
                value={editingTitle}
                onChange={(e) => dispatch(setEditingTitle({ isEditing: true, title: e.target.value }))}
                onBlur={handleTitleEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleEdit()}
                autoFocus
                variant="standard"
                size="small"
                disabled={isUpdatingList}
                sx={{ flex: 1, minWidth: 0 }}
              />
            ) : (
              <Typography
                variant="h6"
                onClick={() => {
                  if (!isDefaultList) {
                    dispatch(setEditingTitle({ isEditing: true, title: selectedList.title }));
                  }
                }}
                sx={{ cursor: isDefaultList ? 'default' : 'pointer', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {selectedList.title}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
        {mobile && (
          <Button onClick={() => dispatch(setSelectedListId(null))}>Назад</Button>
        )}
        <TasksList 
          tasks={tasks} 
          selectedList={selectedList}
          containerId={selectedListId}
          isNeedContextMenu={true}
        />
      </Box>
      {selectedListId && (
        <Box sx={{ position: 'sticky', bottom: 0, left: 0, width: '100%', zIndex: 2, p: 1 }}>
          <Paper component="form" sx={{ display: 'flex', alignItems: 'center', mt: 1, mx: 1 }}>
            <IconButton aria-label="add task" onClick={handleAddTask} disabled={isAddingTask}>
              <AddIcon />
            </IconButton>
            <InputBase
              sx={{ flex: 1 }}
              placeholder="Добавить задачу"
              value={newTask}
              onKeyDown={handleKeyDown}
              onChange={(e) => dispatch(setNewTask(e.target.value))}
              disabled={isAddingTask}
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default memo(ToDoTasksPanel);