import { useState, useContext, memo, useCallback } from 'react';
import { Box, Button, Paper, InputBase, Typography, TextField, IconButton } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import TasksList from './TasksList';
import AddIcon from '@mui/icons-material/Add';
import { TasksContext } from './hooks/TasksContext';

function ToDoTasksPanel({ mobile = false, setSelectedListId, additionalButtonClick = null, additionalButton = null, onSuccess = null, onError = null }) {
  const {
    tasks,
    myDayTasks,
    selectedTaskId,
    setSelectedTaskId,
    addTask,
    updateTask,
    changeTaskStatus,
    deleteTask,
    linkTaskList,
    lists,
    selectedListId,
    selectedList,
    updateList,
    linkListGroup,
    deleteFromChildes,
  } = useContext(TasksContext);

  // Для редактирования названия списка
  const [editingTitle, setEditingTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const isDefaultList = selectedList && lists?.default_lists && lists.default_lists.some(list => list.id === selectedList.id);

  // Для добавления новой задачи
  const [newTask, setNewTask] = useState('');
  
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (newTask.trim() === '') return;
      addTask({ title: newTask, listId: selectedList?.id });
      setNewTask('');
    }
  }, [addTask, newTask, selectedList?.id]);
  
  const handleAddTask = useCallback(() => {
    if (newTask.trim() === '') return;
    addTask({ title: newTask, listId: selectedList?.id });
    setNewTask('');
  }, [addTask, newTask, selectedList?.id]);

  const handleTitleEdit = useCallback(() => {
    if (editingTitle.trim() !== '' && selectedList) {
      updateList({ listId: selectedList.id, title: editingTitle.trim() });
      setIsEditingTitle(false);
    }
  }, [editingTitle, selectedList, updateList]);

  // Определяем тип выбранного списка
  const isGroup = selectedList?.type === 'group';
  const isProject = selectedList?.type === 'project';

  if (isGroup || isProject) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" align="center">
          {/* Здесь будет описание группы или проекта */}
          {isGroup && 'Описание группы (заглушка)'}
          {isProject && 'Описание проекта (заглушка)'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Верхняя панель с названием списка */}
      {selectedList && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: mobile ? 1 : 4,
          py: 2,
          my: 1,
          borderBottom: '1px solid #ddd',
          minWidth: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
            <ListIcon sx={{ mr: 1, flexShrink: 0 }} />
            {isEditingTitle ? (
              <TextField
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleTitleEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editingTitle.length > 0) {
                    handleTitleEdit();
                  }
                }}
                autoFocus
                variant="standard"
                size="small"
                error={editingTitle.length === 0}
                helperText={editingTitle.length === 0 ? "Title cannot be empty" : ""}
                sx={{ flex: 1, minWidth: 0 }}
              />
            ) : (
              <Typography
                variant="h6"
                onClick={() => {
                  if (!isDefaultList) {
                    setEditingTitle(selectedList.title);
                    setIsEditingTitle(true);
                  }
                }}
                sx={{
                  cursor: isDefaultList ? 'default' : 'pointer',
                  '&:hover': {
                    opacity: isDefaultList ? 1 : 0.8
                  },
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {selectedList.title}
              </Typography>
            )}
          </Box>
          {/* <Button variant="outlined" sx={{ flexShrink: 0, ml: 1 }}>
            <PersonAddAltIcon />
          </Button> */}
        </Box>
      )}
      {/* Список задач */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
        {mobile && (
          <Button onClick={() => setSelectedListId && setSelectedListId(null)}>Назад</Button>
        )}
        <TasksList
          containerId={selectedListId}
          tasks={selectedListId === 'my_day' ? myDayTasks.data : tasks.data}
          selectedTaskId={selectedTaskId}
          listsList={lists.lists}
          projects={lists.projects}
          selectedList={selectedList}
          isNeedContextMenu={true}
          setSelectedTaskId={setSelectedTaskId}
          updateList={updateList}
          updateTask={updateTask}
          changeTaskStatus={changeTaskStatus}
          linkTaskList={linkTaskList}
          deleteFromChildes={deleteFromChildes}
          additionalButtonClick={additionalButtonClick}
          additionalButton={additionalButton}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Box>
      {/* Поле для добавления новой задачи (фиксировано внизу) */}
      {selectedListId && (
        <Box sx={{ position: 'sticky', bottom: 0, left: 0, width: '100%', zIndex: 2, p: 1 }}>
          <Paper component="form" sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1, alignItems: 'center', mt: 1, mx: 1 }}>
            <IconButton aria-label="menu" onClick={handleAddTask}>
              <AddIcon />
            </IconButton>
            <InputBase
              sx={{ flex: 1 }}
              placeholder="Добавить задачу"
              inputProps={{ 'aria-label': 'add task' }}
              value={newTask}
              onKeyDown={handleKeyDown}
              onChange={(e) => setNewTask(e.target.value)}
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default memo(ToDoTasksPanel);