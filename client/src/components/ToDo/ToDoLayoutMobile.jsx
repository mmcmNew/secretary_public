import { useState } from 'react';
import { Box, Button, IconButton, Paper, InputBase } from '@mui/material';
import ListsList from './ListsList';
import TasksList from './TasksList';
import TaskDetails from './TaskEditor';
import QueueIcon from '@mui/icons-material/Queue';
import AddIcon from '@mui/icons-material/Add';
import { useToDo } from './hooks/useToDoContext';
import { AccountTree } from '@mui/icons-material';

function ToDoLayoutMobile() {
  const { selectedTaskId, addTask, addList } = useToDo();
  const { listsList, selectedListId, setSelectedListId, updateList, deleteFromChildes,
    defaultLists, setSelectedTaskId, projects, updateAll, updateEvents, linkListGroup } = useToDo();
  const {tasks, taskFields, addSubTask, updateTask, changeTaskStatus, deleteTask} = useToDo();
  const { linkTaskList, selectedList,} = useToDo();
  const [newTask, setNewTask] = useState('');

  function handleAdditionalButtonClick(task){
    const priority = task.priority_id === 3 ? 1 : 3;
    if (typeof updateTask === 'function')
      updateTask(task.id, { priority_id: priority });
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (newTask.trim() === '') return;
      addTask({ title: newTask });
      setNewTask('');
    }
  }

  return (
    <>
        <Box
          sx={{
            height: '100%',
            display: !selectedListId ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'space-between',
             width: '100%' }}
        >
          <Box sx={{ flexGrow: 1, overflowY: 'auto', height: '100%' }}>
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
            <Button variant="outlined" sx={{ width: '100%' }} onClick={() => { addList('list'); setSelectedListId(null) }}>
              Создать список
            </Button>
            <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={() => { addList('group'); setSelectedListId(null) }}>
              <QueueIcon />
            </IconButton>
            <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={() => { addList('project'); setSelectedListId(null) }}>
              <AccountTree />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            height: '100%',
            display: selectedListId && !selectedTaskId ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%' }}
        >
          <Box sx={{ px: 2, flexGrow: 1, overflowY: 'auto', height: '100%' }}>
            <Button onClick={() => setSelectedListId(null)}>Назад</Button>
            <TasksList
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              listsList={listsList}
              selectedList={selectedList}
              isNeedContextMenu={true}
              setSelectedTaskId={setSelectedTaskId}
              updateList={updateList}
              linkTaskList={linkTaskList}
              additionalButtonClick={handleAdditionalButtonClick}
              changeTaskStatus={changeTaskStatus}
              deleteFromChildes={deleteFromChildes} />
          </Box>
          <Paper component="form" sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1, alignItems: 'center', mt: 1, mx: 1 }}>
            <IconButton aria-label="menu" onClick={() => {
              addTask(newTask);
              setNewTask('');
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
        </Box>
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
        </Box>
    </>
  );
}

export default ToDoLayoutMobile;
