import { PropTypes } from 'prop-types';
import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Box } from '@mui/system';
import { TextField } from '@mui/material';

export default function NewTaskDialog({ open, handleClose, scroll, selectedDate, addTask }) {
  const [newTaskName, setNewTaskName] = React.useState('');


  function handleCreateClick() {
    if (newTaskName && selectedDate) {
      console.log('selectedDate', selectedDate);
      addTask({
        title: newTaskName,
        listId: 'tasks',
        start: selectedDate.start,
        end: selectedDate.end? selectedDate.end : null,
        type: 'event',
      });
      setNewTaskName('');
      handleCloseClick();
    }
  }

  function handleCloseClick() {
    if (handleClose) handleClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleCloseClick}
      scroll={scroll}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
    >
      <DialogTitle id="scroll-dialog-title">Создать задачу</DialogTitle>
      <DialogContent dividers={scroll === 'paper'} style={{ width: '500px', maxWidth: '100%' }}>
        <Box>
          <TextField
            id={`createTask-input`}
            fullWidth
            label={'Введите название задачи'}
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreateClick}>Создать задачу</Button>
        <Button onClick={handleCloseClick}>Отмена</Button>
      </DialogActions>
    </Dialog>
  );
}

NewTaskDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func,
  scroll: PropTypes.string.isRequired,
  selectedDate: PropTypes.object,
  addTask: PropTypes.func.isRequired,
};
