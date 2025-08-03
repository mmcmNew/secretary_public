import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, IconButton, Autocomplete } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import ColorPicker from '../ColorPicker.jsx';
import { useTasks } from '../ToDo/hooks/useTasks';
import TaskTypeGroupDialog from './TaskTypeGroupDialog.jsx';
import { ErrorContext } from '../../contexts/ErrorContext';

export default function TaskTypeDialog({ open, onClose, data, onChange, onSave, title }) {
  const { setError } = useContext(ErrorContext);
  const { getTaskTypeGroups, addTaskTypeGroup } = useTasks({
    onError: (error) => {
      console.error('Error in useTasks:', error);
      if (setError) setError(error);
    }
  });
  const [groups, setGroups] = useState([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', color: '#3788D8', description: '' });

  const handleGroupChange = (field, value) => setGroupForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (open) fetchGroups();
  }, [open]);

  const fetchGroups = async () => {
    try {
      const data = await getTaskTypeGroups();
      const arr = Object.values(data || {});
      setGroups(arr);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  };

  const saveGroup = async () => {
    try {
      const g = await addTaskTypeGroup(groupForm);
      setGroupDialogOpen(false);
      fetchGroups();
      onChange('group_id', g.id);
    } catch (err) {
      console.error('Failed to add group', err);
    }
  };

  const handleChange = (field) => (e) => onChange(field, e.target.value);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Название" value={data.name} onChange={handleChange('name')} required />
          <ColorPicker fieldKey="color" fieldName="Цвет" selectedColorProp={data.color} onColorChange={(_, c) => onChange('color', c)} />
          <Autocomplete
            options={[...groups, { id: '__add__', name: 'Добавить группу...' }]}
            getOptionLabel={(opt) => opt.name || ''}
            value={groups.find(g => g.id === data.group_id) || null}
            onChange={(e, nv) => {
              if (nv && nv.id === '__add__') {
                setGroupForm({ name: '', color: '#3788D8', description: '' });
                setGroupDialogOpen(true);
              } else {
                onChange('group_id', nv ? nv.id : null);
              }
            }}
            renderInput={(params) => <TextField {...params} label="Группа" />}
          />
          <TextField label="Описание" value={data.description} onChange={handleChange('description')} multiline rows={3} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onSave(data)}>Сохранить</Button>
        <Button onClick={onClose}>Отмена</Button>
      </DialogActions>
      <TaskTypeGroupDialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        data={groupForm}
        onChange={handleGroupChange}
        onSave={saveGroup}
      />
    </Dialog>
  );
}

TaskTypeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  title: PropTypes.string,
};

TaskTypeDialog.defaultProps = {
  title: 'Создать тип задачи',
};
