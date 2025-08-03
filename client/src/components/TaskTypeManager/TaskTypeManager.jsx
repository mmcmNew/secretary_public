import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Typography, List, ListItem, Card, CardContent, IconButton } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import TaskTypeDialog from './TaskTypeDialog.jsx';
import { useTasks } from '../ToDo/hooks/useTasks';
import { ErrorContext } from '../../contexts/ErrorContext';

export default function TaskTypeManager() {
  const { setError } = useContext(ErrorContext);
  const {
    getTaskTypes,
    addTaskType,
    updateTaskType,
    deleteTaskType,
    getTaskTypeGroups,
    updateTaskTypeGroup
  } = useTasks({
    onError: (error) => {
      console.error('Error in useTasks:', error);
      if (setError) setError(error);
    }
  });
  const [types, setTypes] = useState({});
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#3788D8', description: '', group_id: null });
  const [groupedTypes, setGroupedTypes] = useState({});

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tdata, gdata] = await Promise.all([getTaskTypes(), getTaskTypeGroups()]);
      setTypes(tdata || {});
      setGroups(Object.values(gdata || {}).sort((a,b)=> (a.order||0)-(b.order||0)));
      const grouped = {};
      Object.values(tdata || {}).forEach(t => {
        const gid = t.group_id || 'null';
        if (!grouped[gid]) grouped[gid] = [];
        grouped[gid].push(t);
      });
      Object.keys(grouped).forEach(k => {
        grouped[k].sort((a,b)=> (a.order||0)-(b.order||0));
      });
      setGroupedTypes(grouped);
    } catch (err) {
      console.error('Failed to fetch task types', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const grouped = {};
    Object.values(types).forEach(t => {
      const gid = t.group_id || 'null';
      if (!grouped[gid]) grouped[gid] = [];
      grouped[gid].push(t);
    });
    Object.keys(grouped).forEach(k => {
      grouped[k].sort((a,b)=> (a.order||0)-(b.order||0));
    });
    setGroupedTypes(grouped);
  }, [types]);

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ name: '', color: '#3788D8', description: '', group_id: null });
    setDialogOpen(true);
  };

  const handleEdit = (id) => {
    setEditingId(id);
    const t = types[id];
    setFormData({ name: t.name || '', color: t.color || '#3788D8', description: t.description || '', group_id: t.group_id || null });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить тип задачи?')) return;
    try {
      await deleteTaskType(id);
      fetchData();
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
      fetchData();
    } catch (err) {
      console.error('Failed to save task type', err);
    }
  };

  const handleDragEnd = async ({ destination, source, draggableId, type }) => {
    if (!destination) return;
    if (type === 'group') {
      const newGroups = Array.from(groups);
      const [moved] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, moved);
      setGroups(newGroups);
      newGroups.forEach((g, idx) => {
        if (g.order !== idx) updateTaskTypeGroup(g.id, { order: idx });
      });
    } else if (type === 'type') {
      const srcG = source.droppableId;
      const dstG = destination.droppableId;
      if (srcG === dstG && source.index === destination.index) return;
      const sourceList = Array.from(groupedTypes[srcG] || []);
      const [moved] = sourceList.splice(source.index, 1);
      const destList = srcG === dstG ? sourceList : Array.from(groupedTypes[dstG] || []);
      destList.splice(destination.index, 0, moved);
      const newGrouped = { ...groupedTypes, [srcG]: sourceList, [dstG]: destList };
      setGroupedTypes(newGrouped);
      // update moved type
      updateTaskType(moved.id, { group_id: dstG === 'null' ? null : Number(dstG), order: destination.index });
      destList.forEach((t, idx) => {
        if (t.id !== moved.id && t.order !== idx) updateTaskType(t.id, { order: idx });
      });
    }
  };

  if (loading) return <Typography>Загрузка...</Typography>;

  const allGroups = [...groups, { id: 'null', name: 'Без группы' }];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Типы задач</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Создать тип
        </Button>
      </Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="groups" type="group">
          {(prov) => (
            <div ref={prov.innerRef} {...prov.droppableProps}>
              {allGroups.map((g, idx) => (
                <Draggable draggableId={`group-${g.id}`} index={idx} key={g.id}>
                  {(p) => (
                    <div ref={p.innerRef} {...p.draggableProps}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* Drag handle icon for group */}
                          <IconButton {...p.dragHandleProps} size="small" sx={{ cursor: 'grab' }}>
                            <DragIndicatorIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="h6" sx={{ backgroundColor: g.color || '#eee', p: 1, flex: 1 }}>
                            {g.name}
                          </Typography>
                        </Box>
                        <Droppable droppableId={String(g.id)} type="type">
                          {(pr) => (
                            <List ref={pr.innerRef} {...pr.droppableProps}>
                              {(groupedTypes[g.id || 'null'] || []).map((t, i) => (
                                <Draggable key={t.id} draggableId={`type-${t.id}`} index={i}>
                                  {(pp) => (
                                    <ListItem ref={pp.innerRef} {...pp.draggableProps} sx={{ p: 0, mb: 1 }}>
                                      <Card sx={{ width: '100%' }}>
                                        <CardContent>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              {/* Drag handle icon */}
                                              <IconButton {...pp.dragHandleProps} size="small" sx={{ cursor: 'grab' }}>
                                                <DragIndicatorIcon fontSize="small" />
                                              </IconButton>
                                              <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: t.color }} />
                                              <Typography variant="body1">{t.name}</Typography>
                                            </Box>
                                            <Box>
                                              <IconButton onClick={() => handleEdit(t.id)}><EditIcon /></IconButton>
                                              <IconButton onClick={() => handleDelete(t.id)}><DeleteIcon /></IconButton>
                                            </Box>
                                          </Box>
                                          {t.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t.description}</Typography>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </ListItem>
                                  )}
                                </Draggable>
                              ))}
                              {pr.placeholder}
                            </List>
                          )}
                        </Droppable>
                      </Box>
                    </div>
                  )}
                </Draggable>
              ))}
              {prov.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
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
