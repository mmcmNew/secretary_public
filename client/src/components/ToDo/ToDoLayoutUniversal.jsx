  import { useState, useCallback, memo } from 'react';
  import { useMediaQuery, Box, Grid, Button, IconButton, Paper, InputBase, Typography, TextField } from '@mui/material';
  import ListsList from './ListsList';
  import TasksList from './TasksList';
  import TaskDetails from './TaskEditor';
  import QueueIcon from '@mui/icons-material/Queue';
  import AddIcon from '@mui/icons-material/Add';
  import ListIcon from '@mui/icons-material/List';
  import CloseIcon from '@mui/icons-material/Close';
  import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
  import { AccountTree } from '@mui/icons-material';
  import { useToDo } from './hooks/useToDoContext';

  const MemoizedTaskList = memo(TasksList);
  const MemoizedTaskDetails = memo(TaskDetails);

  function ToDoLayoutUniversal({ containerId }) {
    const isMobile = useMediaQuery('(max-width:600px)');
    const {
      tasks,
      lists,
      selected,
      taskFields,
      setSelectedListId,
      setSelectedTaskId,
      addTask,
      addList,
      addSubTask,
      updateList,
      updateTask,
      deleteFromChildes,
      linkListGroup,
      updateAll,
      updateEvents,

    } = useToDo();

    // Исправленная передача данных:
    const tasksArray = tasks?.data || [];
    const listsList = lists?.data?.lists || [];
    const defaultLists = lists?.data?.default_lists || [];
    const projectsList = lists?.data?.projects || [];
    const selectedListId = selected?.listId;
    const selectedList = selected?.list;
    const selectedTaskId = selected?.taskId;

    // Состояния для ввода
    const [newTask, setNewTask] = useState('');
    const [editingTitle, setEditingTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

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

    const handleTitleEdit = useCallback(() => {
      if (editingTitle.trim() !== '' && selectedList) {
        updateList({ listId: selectedList.id, title: editingTitle.trim() });
        setIsEditingTitle(false);
      }
    }, [editingTitle, selectedList, updateList]);

    const handleAddTask = useCallback(() => {
      addTask({ title: newTask });
      setNewTask('');
    }, [newTask, addTask]);

    const handleAddSubTask = useCallback((subtask, taskId) => {
      addSubTask({ title: subtask, parentId: taskId });
      setNewSubTask("");
    }, [addSubTask]);

    // --- Мобильная версия ---
    if (isMobile) {
      return (
        <>
          {/* Списки */}
          <Box
            sx={{
              height: '100%',
              display: !selectedListId ? 'flex' : 'none',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            <Box sx={{ flexGrow: 1, overflowY: 'auto', height: '90%' }}>
              <ListsList
                selectedListId={selectedListId}
                listsList={listsList}
                defaultLists={defaultLists}
                projects={projectsList}
                updateList={updateList}
                isNeedContextMenu={true}
                setSelectedListId={setSelectedListId}
                deleteFromChildes={deleteFromChildes}
                setSelectedTaskId={setSelectedTaskId}
                linkListGroup={linkListGroup}
                updateAll={updateAll}
                updateEvents={updateEvents}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', mt: 1 }}>
              <Button variant="outlined" sx={{ width: '100%' }} onClick={() => { addList('list'); setSelectedListId(null); }}>
                Создать список
              </Button>
              <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={() => { addList('group'); setSelectedListId(null); }}>
                <QueueIcon />
              </IconButton>
              <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={() => { addList('project'); setSelectedListId(null); }}>
                <AccountTree />
              </IconButton>
            </Box>
          </Box>
          {/* Задачи */}
          <Box
            sx={{
              height: '100%',
              display: selectedListId && !selectedTaskId ? 'flex' : 'none',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            <Box sx={{ px: 2, flexGrow: 1, overflowY: 'auto', height: '100%' }}>
              <Button onClick={() => setSelectedListId(null)}>Назад</Button>
              <MemoizedTaskList
                containerId={containerId}
                tasks={tasksArray}
                selectedTaskId={selectedTaskId}
                listsList={listsList}
                selectedList={selectedList}
                isNeedContextMenu={true}
                setSelectedTaskId={setSelectedTaskId}
                updateList={updateList}
                linkTaskList={linkListGroup}
                additionalButtonClick={handleAdditionalButtonClick}
                changeTaskStatus={updateList}
                deleteFromChildes={deleteFromChildes}
              />
            </Box>
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
          {/* Детали задачи */}
          <Box
            sx={{
              height: '100%',
              display: selectedTaskId ? 'flex' : 'none',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            <Box sx={{ px: 1, flexGrow: 1, overflowY: 'auto', height: '100%' }}>
              <Button onClick={() => setSelectedTaskId(null)}>Назад</Button>
              <MemoizedTaskDetails
                tasks={tasksArray}
                selectedTaskId={selectedTaskId}
                taskFields={taskFields || {}}
                addSubTask={handleAddSubTask}
                updateTask={updateTask}
                changeTaskStatus={updateTask}
                deleteTask={deleteFromChildes}
              />
            </Box>
          </Box>
        </>
      );
    }

    // --- Десктопная версия ---
    return (
      <Box sx={{ flexGrow: 1, padding: 2, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={0.5} sx={{ height: '100%' }}>
          {/* Первый столбец */}
          <Grid item xs={12} sm={4} md={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', height: '100%' }}>
              <ListsList
                selectedListId={selectedListId}
                listsList={listsList}
                defaultLists={defaultLists}
                projects={projectsList}
                updateList={updateList}
                isNeedContextMenu={true}
                setSelectedListId={setSelectedListId}
                deleteFromChildes={deleteFromChildes}
                setSelectedTaskId={setSelectedTaskId}
                linkListGroup={linkListGroup}
                updateAll={updateAll}
                updateEvents={updateEvents}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', mt: 1 }}>
              <Button variant="outlined" sx={{ width: '100%' }} onClick={() => { addList('list'); }}>
                Создать список
              </Button>
              <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={() => { addList('group'); }}>
                <QueueIcon />
              </IconButton>
              <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={() => { addList('project'); }}>
                <AccountTree />
              </IconButton>
            </Box>
          </Grid>
          {/* Второй столбец */}
          <Grid item xs={12} sm={8} md={selectedTaskId ? 5 : 9} sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            minWidth: 0 // Важно для корректной работы flex
          }}>
            {selectedList && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 4,
                py: 2,
                my: 1,
                borderBottom: '1px solid #ddd',
                minWidth: 0 // Важно для корректной работы flex
              }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexGrow: 1,
                  minWidth: 0 // Важно для корректной работы flex
                }}>
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
                        const isDefaultList = defaultLists.some(list => list.id === selectedList.id);
                        if (!isDefaultList) {
                          setEditingTitle(selectedList.title);
                          setIsEditingTitle(true);
                        }
                      }}
                      sx={{
                        cursor: defaultLists.some(list => list.id === selectedList.id) ? 'default' : 'pointer',
                        '&:hover': {
                          opacity: defaultLists.some(list => list.id === selectedList.id) ? 1 : 0.8
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
                <Button variant="outlined" sx={{ flexShrink: 0 }}>
                  <PersonAddAltIcon />
                </Button>
              </Box>
            )}
            <Box sx={{
              px: 2,
              flexGrow: 1,
              overflowY: 'auto',
              height: '100%',
              minWidth: 0 // Важно для корректной работы flex
            }}>
              <MemoizedTaskList
                containerId={containerId}
                tasks={tasksArray}
                selectedTaskId={selectedTaskId}
                listsList={listsList}
                selectedList={selectedList}
                isNeedContextMenu={true}
                setSelectedTaskId={setSelectedTaskId}
                updateList={updateList}
                linkTaskList={linkListGroup}
                additionalButtonClick={handleAdditionalButtonClick}
                changeTaskStatus={updateList}
                deleteFromChildes={deleteFromChildes}
              />
            </Box>
            {selectedListId && (
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
            )}
          </Grid>
          {/* Третий столбец */}
          {selectedTaskId && (
            <Grid item xs={12} sm={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={() => setSelectedTaskId(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ px: 1, flexGrow: 1, overflowY: 'auto', height: '100%' }}>
                <MemoizedTaskDetails
                  tasks={tasksArray}
                  selectedTaskId={selectedTaskId}
                  taskFields={taskFields.data || {}}
                  addSubTask={handleAddSubTask}
                  updateTask={updateTask}
                  changeTaskStatus={updateTask}
                  deleteTask={deleteFromChildes}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  }

  export default memo(ToDoLayoutUniversal);
