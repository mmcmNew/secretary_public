import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
    Box,
    TextField,
    IconButton,
    Grid,
    Checkbox,
    Divider,
    Paper,
    InputBase,
    FormControl,
    Typography,
    ToggleButton,
    Autocomplete,
    Chip,
    Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { renderTimeViewClock } from "@mui/x-date-pickers";
import ColorPicker from "../ColorPicker";
import NewRecordDialog from "../JournalEditor/NewRecordDialog";
import PropTypes from "prop-types";
import useCalendar from "./hooks/useCalendar";

function TaskDetails({
    taskFields,
    tasks = [],
    selectedTaskId = null,
    updateTask = null,
    changeTaskStatus = null,
    addSubTask = null,
    deleteTask = null,
    selectedListId = null,
}) {
    const [fields, setFields] = useState({});
    const [subTasks, setSubTasks] = useState({});
    const [newSubTask, setNewSubTask] = useState("");
    const [newRecordDialogOpen, setNewRecordDialogOpen] = useState(false);
    const { fetchCalendarEvents } = useCalendar();

    const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
    const task = taskMap.get(+selectedTaskId) || null;
    const [taskStatus, setTaskStatus] = useState(task?.status_id || 1);

    useEffect(() => {
        if (task) setTaskStatus(task.status_id);
    }, [task]);

    // Инициализация полей задачи
    useEffect(() => {
        if (!task || !taskFields) return;
        const sorted = Object.entries(taskFields)
            .sort(([, a], [, b]) => (a.id || 0) - (b.id || 0));
        const initial = {};
        sorted.forEach(([key, field]) => {
            if (field.type === 'toggle') {
                initial[key] = typeof task[key] === 'boolean' ? task[key] : !!task[key];
            } else if (field.type === 'color') {
                initial[key] = typeof task[key] === 'string' ? task[key] : '';
            } else if (field.type === 'multiselect') {
                initial[key] = Array.isArray(task[key]) ? task[key] : [];
            } else {
                initial[key] = task[key] ?? '';
            }
        });
        initial.title = task.title;
        setFields(initial);
    }, [task, taskFields]);

    // Инициализация подзадач
    useEffect(() => {
        if (!task || !task.childes_order) return;
        const subs = task.childes_order.reduce((acc, subId) => {
            const st = taskMap.get(subId);
            if (st) acc[subId] = st.title;
            return acc;
        }, {});
        setSubTasks(subs);
    }, [task, taskMap]);

    const handleUpdate = useCallback(async (field, value) => {
        setFields(prev => ({ ...prev, [field]: value }));
        if (task[field] !== value) {
            let listId = null;
            if (Array.isArray(task.lists) && task.lists.length > 0) {
                listId = task.lists[0].id;
            } else if (selectedListId) {
                listId = selectedListId;
            }
            await updateTask({ taskId: task.id, [field]: value, listId });
            if (fetchCalendarEvents) await fetchCalendarEvents();
        }
    }, [task, updateTask, selectedListId, fetchCalendarEvents]);

    const handleToggle = useCallback(async (taskId, checked) => {
        const status_id = checked ? 2 : 1;
        let listId = null;
        if (taskId === task.id) {
            if (Array.isArray(task.lists) && task.lists.length > 0) {
                listId = task.lists[0].id;
            } else if (selectedListId) {
                listId = selectedListId;
            }
            setTaskStatus(status_id);
        } else {
            const sub = taskMap.get(taskId);
            if (Array.isArray(sub?.lists) && sub.lists.length > 0) {
                listId = sub.lists[0].id;
            } else if (selectedListId) {
                listId = selectedListId;
            }
        }
        const payload = { taskId, status_id, listId };
        if (status_id === 2) {
            payload.completed_at = dayjs().toISOString();
            const audio = new Audio("/sounds/isComplited.wav");
            audio.play();
        }
        await changeTaskStatus(payload);
        if (fetchCalendarEvents) await fetchCalendarEvents();
    }, [changeTaskStatus, task, taskMap, selectedListId, fetchCalendarEvents]);

    const handleSubBlur = useCallback(async (subId) => {
        const title = subTasks[subId]?.trim();
        const sub = taskMap.get(subId);
        if (!sub || sub.title === title) return;
        let listId = null;
        if (Array.isArray(sub?.lists) && sub.lists.length > 0) {
            listId = sub.lists[0].id;
        } else if (selectedListId) {
            listId = selectedListId;
        }
        await updateTask({ taskId: subId, title, listId });
        if (fetchCalendarEvents) await fetchCalendarEvents();
    }, [subTasks, taskMap, updateTask, selectedListId, fetchCalendarEvents]);

    const handleKeyDown = useCallback((e, field, subId = null) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (subId) handleSubBlur(subId);
            else handleUpdate(field, e.target.value);
        }
    }, [handleSubBlur, handleUpdate]);

    const handleAddSubTask = useCallback(async () => {
        if (newSubTask.trim()) {
            let listId = null;
            if (Array.isArray(task.lists) && task.lists.length > 0) {
                listId = task.lists[0].id;
            } else if (selectedListId) {
                listId = selectedListId;
            }
            await addSubTask({ title: newSubTask, parentTaskId: task.id, listId });
            if (fetchCalendarEvents) await fetchCalendarEvents();
            setNewSubTask('');
        }
    }, [newSubTask, addSubTask, task, selectedListId, fetchCalendarEvents]);

    const handleDeleteSubTask = useCallback(async (subId) => {
        let listId = null;
        const sub = taskMap.get(subId);
        if (Array.isArray(sub?.lists) && sub.lists.length > 0) {
            listId = sub.lists[0].id;
        } else if (selectedListId) {
            listId = selectedListId;
        }
        await deleteTask({ taskId: subId, listId });
        if (fetchCalendarEvents) await fetchCalendarEvents();
    }, [deleteTask, taskMap, selectedListId, fetchCalendarEvents]);

    const handleDeleteTask = useCallback(async () => {
        let listId = null;
        if (Array.isArray(task.lists) && task.lists.length > 0) {
            listId = task.lists[0].id;
        } else if (selectedListId) {
            listId = selectedListId;
        }
        await deleteTask({ taskId: task.id, listId });
        if (fetchCalendarEvents) await fetchCalendarEvents();
    }, [deleteTask, task, selectedListId, fetchCalendarEvents]);

    if (!task) return null;

    return (
        <Box sx={{ width: '100%', height: '96%', pb: 2 }}>
            <Paper variant="outlined" sx={{ p: 1, my: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                        checked={taskStatus === 2}
                        sx={{ mr: 1, p: 0 }}
                        onChange={(e) => handleToggle(task.id, e.target.checked)}
                    />
                    <TextField
                        label="Название задачи"
                        sx={{ width: '100%', my: 1 }}
                        value={fields.title || ''}
                        onChange={(e) => setFields(f => ({ ...f, title: e.target.value }))}
                        onBlur={(e) => handleUpdate('title', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'title')}
                        multiline maxRows={3}
                        variant="outlined"
                    />
                </Box>
                <Box sx={{ marginY: 0 }}>
                    {task.childes_order?.map(id => {
                        const sub = taskMap.get(id);
                        if (!sub) return null;
                        return (
                            <Grid container alignItems="center" spacing={0.5} key={id} sx={{ marginY: 0.5 }}>
                                <Grid item xs width="100%">
                                    <Box component="form" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Checkbox
                                            checked={sub.status_id === 2}
                                            sx={{ m: 0, p: 0 }}
                                            onChange={(e) => handleToggle(sub.id, e.target.checked)}
                                        />
                                        <InputBase
                                            sx={{ ml: 1, flex: 1, textDecoration: sub.status_id === 2 ? 'line-through' : 'none', width: '100%' }}
                                            placeholder="Подзадача"
                                            value={subTasks[sub.id] || ''}
                                            onChange={(e) => setSubTasks(s => ({ ...s, [sub.id]: e.target.value }))}
                                            onBlur={() => handleSubBlur(sub.id)}
                                            onKeyDown={(e) => handleKeyDown(e, 'title', sub.id)}
                                            inputProps={{ 'aria-label': 'subtask' }}
                                        />
                                        <Divider sx={{ height: 15, m: 0.5 }} orientation="vertical" />
                                        <IconButton sx={{ m: 0, p: 0 }} onClick={() => handleDeleteSubTask(sub.id)}>
                                            <CloseIcon />
                                        </IconButton>
                                    </Box>
                                    <Divider sx={{ m: 0.5 }} />
                                </Grid>
                            </Grid>
                        );
                    })}
                </Box>
                <Grid item xs>
                    <Box component="form" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <IconButton sx={{ m: 0, p: 0 }} onClick={handleAddSubTask}>
                            <AddIcon />
                        </IconButton>
                        <InputBase
                            sx={{ ml: 1, flex: 1 }}
                            placeholder="Добавить подзадачу"
                            value={newSubTask}
                            onChange={(e) => setNewSubTask(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubTask(); } }}
                            inputProps={{ 'aria-label': 'add subtask' }}
                        />
                    </Box>
                </Grid>
            </Paper>
            {taskStatus === 2 && (
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                    Завершено: {task.completed_at ? dayjs(task.completed_at).format('DD/MM/YYYY HH:mm') : ''}
                </Typography>
            )}
            <Paper variant="outlined" sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1.5, paddingY: 2 }}>
                <Button variant="outlined" onClick={() => setNewRecordDialogOpen(true)}>Добавить запись в журнал проекта</Button>
                {Object.entries(taskFields)
                    .sort(([, a], [, b]) => (a.id || 0) - (b.id || 0))
                    .map(([key, field]) => {
                        if (!field) return null;
                        if (field.type === 'divider') return <Divider key={key} sx={{ my: 0.5 }} />;
                        const value = field.type === 'datetime' && fields[key]
                            ? dayjs(fields[key])
                            : null;
                        return (
                            <Box key={key} sx={{ mt: 1 }}>
                                {field.type === 'datetime' ? (
                                    <FormControl fullWidth>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DateTimePicker
                                                viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock, seconds: renderTimeViewClock }}
                                                ampm={false}
                                                label={field.name}
                                                value={value}
                                                format="DD/MM/YYYY HH:mm"
                                                onChange={(nv) => { if (nv && nv.isValid()) handleUpdate(key, nv.toISOString()); }}
                                                onAccept={(nv) => { if (nv && nv.isValid()) handleUpdate(key, nv.toISOString()); }}
                                                slotProps={{ textField: { onBlur: () => handleUpdate(key, fields[key]) } }}
                                                onKeyDown={(e) => handleKeyDown(e, key)}
                                            />
                                        </LocalizationProvider>
                                    </FormControl>
                                ) : field.type === 'select' ? (
                                    <Autocomplete
                                        options={field.groupBy ? [...field.options].sort((a, b) => {
                                            const ga = a.groupLabel || '';
                                            const gb = b.groupLabel || '';
                                            if (ga !== gb) return ga.localeCompare(gb);
                                            return (a.label || '').localeCompare(b.label || '');
                                        }) : field.options}
                                        groupBy={field.groupBy ? opt => opt.groupLabel || 'Без группы' : undefined}
                                        getOptionLabel={opt => opt.label || ''}
                                        value={field.options.find(opt => opt.value === fields[key]) || null}
                                        onChange={(e, nv) => handleUpdate(key, nv ? nv.value : null)}
                                        renderInput={(params) => <TextField {...params} label={field.name} />}
                                    />
                                ) : field.type === 'text' ? (
                                    <TextField
                                        fullWidth
                                        label={field.name}
                                        multiline rows={5}
                                        value={fields[key] || ''}
                                        onChange={(e) => setFields(f => ({ ...f, [key]: e.target.value }))}
                                        onBlur={(e) => handleUpdate(key, e.target.value)}
                                        variant="outlined"
                                    />
                                ) : field.type === 'toggle' ? (
                                    <FormControl fullWidth>
                                        <ToggleButton
                                            value="check"
                                            size="small"
                                            selected={!!fields[key]}
                                            onChange={() => handleUpdate(key, !fields[key])}
                                            sx={{ border: '1px solid', borderColor: fields[key] ? 'darkgrey' : 'grey.400', justifyContent: 'flex-start', p: 0 }}
                                        >
                                            <Checkbox checked={!!fields[key]} />
                                            <Typography sx={{ ml: 1, textTransform: 'none' }}>{field.name}</Typography>
                                        </ToggleButton>
                                    </FormControl>
                                ) : field.type === 'color' ? (
                                    <ColorPicker
                                        fieldKey={key}
                                        fieldName={field.name}
                                        selectedColorProp={fields[key] || ''}
                                        onColorChange={(_, color) => handleUpdate(key, color)}
                                    />
                                ) : field.type === 'multiselect' ? (
                                    <Autocomplete
                                        multiple
                                        options={field.options}
                                        getOptionLabel={opt => opt.title}
                                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                        value={Array.isArray(fields[key]) ? fields[key] : []}
                                        onChange={(e, nv) => handleUpdate(key, nv)}
                                        renderInput={(params) => <TextField {...params} label={field.name} />}
                                        renderTags={(val, getTagProps) => val.map((opt, idx) => <Chip key={opt.id} label={opt.title} {...getTagProps({ idx })} />)}
                                    />
                                ) : (
                                    <TextField
                                        fullWidth
                                        label={field.name}
                                        type={field.type}
                                        value={fields[key] || ''}
                                        onChange={(e) => setFields(f => ({ ...f, [key]: e.target.value }))}
                                        onBlur={(e) => handleUpdate(key, e.target.value)}
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        );
                    })}
            </Paper>
            <NewRecordDialog open={newRecordDialogOpen} handleClose={() => setNewRecordDialogOpen(false)} taskId={selectedTaskId} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleDeleteTask}>
                    Удалить задачу
                </Button>
            </Box>
        </Box>
    );
}

TaskDetails.propTypes = {
    taskFields: PropTypes.object,  // сюда передаётся TaskField.data
    tasks: PropTypes.array,
    selectedTaskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    updateTask: PropTypes.func,
    changeTaskStatus: PropTypes.func,
    addSubTask: PropTypes.func,
    deleteTask: PropTypes.func,
    selectedListId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default TaskDetails;
