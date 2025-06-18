import { PropTypes } from 'prop-types';
import React, { useState } from 'react';
import { Grid, Box, Button, IconButton, Paper, InputBase, Typography, TextField } from '@mui/material';
import ListsList from './ListsList';
import TasksList from './TasksList';
import TaskDetails from './TaskEditor';
import QueueIcon from '@mui/icons-material/Queue';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import { useToDo } from './hooks/useToDoContext';
// import { DragDropContext } from "@hello-pangea/dnd";
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { AccountTree } from '@mui/icons-material';

const MemoizedTaskList = React.memo(TasksList);

function ToDoLayout({containerId}) {
  const { selectedTaskId, addTask, addList } = useToDo();
  const { listsList, selectedListId, setSelectedListId, updateList, deleteFromChildes,
    defaultLists, setSelectedTaskId, projects, updateAll, updateEvents, linkListGroup } = useToDo();
  const {tasks, taskFields, addSubTask, updateTask, changeTaskStatus, deleteTask} = useToDo();
  const { linkTaskList, selectedList,} = useToDo();
  const [newTask, setNewTask] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  function handleAdditionalButtonClick(task){
    const priority = task.priority_id === 3 ? 1 : 3;
    if (typeof updateTask === 'function')
      updateTask(task.id, { priority_id: priority });
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Предотвращаем добавление новой строки в поле ввода
      if (newTask.trim() === '') {
        return;
      }
      addTask({title:newTask});
      setNewTask('');
    }
  }

  function handleTitleEdit() {
    if (editingTitle.trim() !== '' && selectedList) {
      updateList(selectedList.id, { title: editingTitle.trim() });
      setIsEditingTitle(false);
    }
  }

  // function onDragEnd(result) {
  //   console.log(result);
  //   // Ваша логика для обработки завершения перетаскивания
  // }

  // console.log(defaultLists)

  return (
      <Box sx={{ flexGrow: 1, padding: 2, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={0.5} sx={{ height: '100%' }}>
          {/* Первый столбец */}
          <Grid item xs={12} sm={4} md={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', height: '100%', }}>
              <ListsList
                selectedListId={selectedListId}
                listsList={listsList}
                defaultLists={defaultLists}
                projects={projects}
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
          <Grid item xs={12} sm={8} md={selectedTaskId ? 5 : 9} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {selectedList && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, py: 2, my: 1, borderBottom: '1px solid #ddd' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <ListIcon sx={{ mr: 1 }} />
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
                        }
                      }}
                    >
                      {selectedList.title}
                    </Typography>
                  )}
                </Box>
                <Button variant="outlined">
                  <PersonAddAltIcon />
                </Button>
              </Box>
            )}
            <Box sx={{ px: 2, flexGrow: 1, overflowY: 'auto', height: '100%' }}>
              <MemoizedTaskList
                containerId={containerId}
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                listsList={listsList}
                selectedList={selectedList}
                isNeedContextMenu={true}
                setSelectedTaskId={setSelectedTaskId}
                updateList={updateList}
                linkTaskList={linkTaskList}
                updateTask={updateTask}
                additionalButtonClick={handleAdditionalButtonClick}
                changeTaskStatus={changeTaskStatus}
                deleteFromChildes={deleteFromChildes} />
            </Box>
            {selectedListId && (
              <Paper component="form" sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1, alignItems: 'center', mt: 1, mx: 1 }}>
                <IconButton aria-label="menu" onClick={() => {
                  addTask(newTask);
                  setNewTask(''); // Очистить поле ввода после добавления задачи
                }}>
                  <AddIcon />
                </IconButton>
                <InputBase
                  sx={{ flex: 1 }}
                  placeholder="Добавить задачу"
                  inputProps={{ 'aria-label': 'add task' }}
                  value={newTask}
                  onKeyDown={(e) => handleKeyDown(e)}
                  onChange={(e) => setNewTask(e.target.value)}
                />
              </Paper>
            )}
          </Grid>

          {/* Третий столбец */}
          {selectedTaskId && (
            <Grid item xs={12} sm={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={() => setSelectedTaskId(null)} sx={{}}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ px: 1, flexGrow: 1, overflowY: 'auto', height: '100%', }}>
                <TaskDetails
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  taskFields={taskFields}
                  addSubTask={addSubTask}
                  updateTask={updateTask}
                  changeTaskStatus={changeTaskStatus}
                  deleteTask={deleteTask}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
  );
}

export default ToDoLayout;

ToDoLayout.propTypes = {
  containerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
