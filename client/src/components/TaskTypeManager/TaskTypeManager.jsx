import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, List, ListItem, Card, CardContent, IconButton } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import TaskTypeDialog from './TaskTypeDialog.jsx';
import useTasks from '../ToDo/hooks/useTasks';

export default function TaskTypeManager() {
  const { getTaskTypes, addTaskType, updateTaskType, deleteTaskType } = useTasks();
  const [types, setTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#3788D8', description: '' });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const data = await getTaskTypes();
      setTypes(data || {});
    } catch (err) {
      console.error('Failed to fetch task types', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ name: '', color: '#3788D8', description: '' });
    setDialogOpen(true);
  };

  const handleEdit = (id) => {
    setEditingId(id);
    const t = types[id];
    setFormData({ name: t.name || '', color: t.color || '#3788D8', description: t.description || '' });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить тип задачи?')) return;
    try {
      await deleteTaskType(id);
      fetchTypes();
    } catch (err) {
      console.error('Failed to delete task type', err);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateTaskType(editingId, formData);
      } else {
        await addTaskType(formData);
      }
      setDialogOpen(false);
      fetchTypes();
    } catch (err) {
      console.error('Failed to save task type', err);
    }
  };

  if (loading) return <Typography>Загрузка...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Типы задач</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Создать тип
        </Button>
      </Box>
      <List>
        {Object.entries(types).map(([id, type]) => (
          <ListItem key={id} sx={{ p: 0, mb: 2 }}>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: type.color }} />
                    <Typography variant="h6">{type.name}</Typography>
                  </Box>
                  <Box>
                    <IconButton onClick={() => handleEdit(id)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(id)}><DeleteIcon /></IconButton>
                  </Box>
                </Box>
                {type.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {type.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </ListItem>
        ))}
      </List>
      <TaskTypeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        data={formData}
        onChange={updateFormData}
        onSave={handleSave}
        title={editingId ? 'Редактировать тип' : 'Создать тип'}
      />
    </Box>
  );
}
