import { useEffect, useState, useCallback, useMemo, memo, useContext, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
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
import TaskTypeDialog from "../TaskTypeManager/TaskTypeDialog.jsx";
import PropTypes from "prop-types";
import useTasks from "./hooks/useTasks";
import { AudioContext } from "../../contexts/AudioContext.jsx";


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
    const {
        control,
        getValues,
        setValue,
        reset,
        watch,
        trigger,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm({ defaultValues: {} });
    const fields = watch();
    const [subTasks, setSubTasks] = useState({});
    const [newSubTask, setNewSubTask] = useState("");
    const [newRecordDialogOpen, setNewRecordDialogOpen] = useState(false);
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [newTypeData, setNewTypeData] = useState({ name: '', color: '#3788D8', description: '' });
    const updateNewTypeData = (field, value) => setNewTypeData(prev => ({ ...prev, [field]: value }));
    const { fetchCalendarEvents, addTaskType } = useTasks();
    const { playAudio } = useContext(AudioContext);

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
        reset(initial);
    }, [task, taskFields, reset]);

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

    const lastSent = useRef({});

    const handleUpdate = useCallback(async (field, value) => {
        setValue(field, value);

        if (['start', 'end'].includes(field)) {
            const start = field === 'start' ? value : getValues('start');
            const end = field === 'end' ? value : getValues('end');
            if (!start || !end || !dayjs(start).isValid() || !dayjs(end).isValid()) {
                setError(field, { type: 'manual', message: 'Неверная дата' });
                return;
            }
            if (dayjs(start).isAfter(dayjs(end))) {
                setError('end', { type: 'manual', message: 'Дата окончания должна быть позже даты начала' });
                return;
            }
            clearErrors(['start', 'end']);
        }

        const preparedValue = ['start', 'end'].includes(field) && dayjs(value).isValid()
            ? dayjs(value).toISOString()
            : value;

        if (task && preparedValue !== lastSent.current[field] && preparedValue !== task[field]) {
            lastSent.current[field] = preparedValue;
            let listId = null;
            if (Array.isArray(task.lists) && task.lists.length > 0) {
                listId = task.lists[0].id;
            } else if (selectedListId) {
                listId = selectedListId;
            }
            await updateTask({ taskId: task.id, [field]: preparedValue, listId });
            if (fetchCalendarEvents) await fetchCalendarEvents();
        }
    }, [task, updateTask, selectedListId, fetchCalendarEvents, setValue, getValues, setError, clearErrors]);

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
            playAudio("/sounds/isComplited.wav", { queued: false });
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

    const handleDateBlur = useCallback((field) => {
        handleUpdate(field, getValues(field));
    }, [handleUpdate, getValues]);

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
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                label="Название задачи"
                                sx={{ width: '100%', my: 1 }}
                                {...field}
                                onBlur={(e) => handleUpdate('title', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 'title')}
                                multiline
                                maxRows={3}
                                variant="outlined"
                            />
                        )}
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
                        return (
                            <Box key={key} sx={{ mt: 1 }}>
                                {field.type === 'datetime' ? (
                                    <FormControl fullWidth>
                                        <Controller
                                            name={key}
                                            control={control}
                                            render={({ field: ctrl }) => (
                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                    <DateTimePicker
                                                        viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock, seconds: renderTimeViewClock }}
                                                        ampm={false}
                                                        label={field.name}
                                                        value={ctrl.value ? dayjs(ctrl.value) : null}
                                                        format="DD/MM/YYYY HH:mm"
                                                        onChange={(nv) => { ctrl.onChange(nv); }}
                                                        onAccept={() => handleDateBlur(key)}
                                                        slotProps={{ textField: { onBlur: () => handleDateBlur(key), inputProps: { readOnly: false }, error: !!errors[key], helperText: errors[key]?.message } }}
                                                        onKeyDown={(e) => handleKeyDown(e, key)}
                                                    />
                                                </LocalizationProvider>
                                            )}
                                        />
                                    </FormControl>
                                ) : field.type === 'select' ? (
                                    <Controller
                                        name={key}
                                        control={control}
                                        render={({ field: ctrl }) => (
                                            <Autocomplete
                                                options={(key === 'type_id' ? [...field.options, { value: '__add__', label: 'Добавить тип...' }] : field.options).sort((a, b) => {
                                                    const ga = a.groupLabel || '';
                                                    const gb = b.groupLabel || '';
                                                    if (ga !== gb) return ga.localeCompare(gb);
                                                    return (a.label || '').localeCompare(b.label || '');
                                                })}
                                                groupBy={field.groupBy ? opt => opt.groupLabel || 'Без группы' : undefined}
                                                getOptionLabel={opt => opt.label || ''}
                                                value={field.options.find(opt => opt.value === ctrl.value) || null}
                                                onChange={(e, nv) => {
                                                    if (key === 'type_id' && nv && nv.value === '__add__') {
                                                        setTypeDialogOpen(true);
                                                    } else {
                                                        handleUpdate(key, nv ? nv.value : null);
                                                    }
                                                }}
                                                renderInput={(params) => <TextField {...params} label={field.name} />}
                                            />
                                        )}
                                    />
                                ) : field.type === 'text' ? (
                                    <Controller
                                        name={key}
                                        control={control}
                                        render={({ field: ctrl }) => (
                                            <TextField
                                                fullWidth
                                                label={field.name}
                                                multiline
                                                rows={5}
                                                {...ctrl}
                                                onBlur={(e) => handleUpdate(key, e.target.value)}
                                                variant="outlined"
                                            />
                                        )}
                                    />
                                ) : field.type === 'toggle' ? (
                                    <FormControl fullWidth>
                                        <Controller
                                            name={key}
                                            control={control}
                                            render={({ field: ctrl }) => (
                                                <ToggleButton
                                                    value="check"
                                                    size="small"
                                                    selected={!!ctrl.value}
                                                    onChange={() => handleUpdate(key, !ctrl.value)}
                                                    sx={{ border: '1px solid', borderColor: ctrl.value ? 'darkgrey' : 'grey.400', justifyContent: 'flex-start', p: 0 }}
                                                >
                                                    <Checkbox checked={!!ctrl.value} />
                                                    <Typography sx={{ ml: 1, textTransform: 'none' }}>{field.name}</Typography>
                                                </ToggleButton>
                                            )}
                                        />
                                    </FormControl>
                                ) : field.type === 'color' ? (
                                    <Controller
                                        name={key}
                                        control={control}
                                        render={({ field: ctrl }) => (
                                            <ColorPicker
                                                fieldKey={key}
                                                fieldName={field.name}
                                                selectedColorProp={ctrl.value || ''}
                                                onColorChange={(_, color) => handleUpdate(key, color)}
                                            />
                                        )}
                                    />
                                ) : field.type === 'multiselect' ? (
                                    <Controller
                                        name={key}
                                        control={control}
                                        render={({ field: ctrl }) => (
                                            <Autocomplete
                                                multiple
                                                options={field.options}
                                                getOptionLabel={opt => opt.title}
                                                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                                value={Array.isArray(ctrl.value) ? ctrl.value : []}
                                                onChange={(e, nv) => handleUpdate(key, nv)}
                                                renderInput={(params) => <TextField {...params} label={field.name} />}
                                                renderTags={(val, getTagProps) => val.map((opt, idx) => <Chip key={opt.id} label={opt.title} {...getTagProps({ idx })} />)}
                                            />
                                        )}
                                    />
                                ) : (
                                    <Controller
                                        name={key}
                                        control={control}
                                        render={({ field: ctrl }) => (
                                            <TextField
                                                fullWidth
                                                label={field.name}
                                                type={field.type}
                                                {...ctrl}
                                                onBlur={(e) => handleUpdate(key, e.target.value)}
                                                variant="outlined"
                                            />
                                        )}
                                    />
                                )}
                            </Box>
                        );
                    })}
            </Paper>
            <NewRecordDialog open={newRecordDialogOpen} handleClose={() => setNewRecordDialogOpen(false)} taskId={selectedTaskId} />
            <TaskTypeDialog
                open={typeDialogOpen}
                onClose={() => setTypeDialogOpen(false)}
                data={newTypeData}
                onChange={updateNewTypeData}
                onSave={async () => {
                    try {
                        await addTaskType(newTypeData);
                    } catch (err) {
                        console.error('Failed to add task type', err);
                    } finally {
                        setTypeDialogOpen(false);
                    }
                }}
            />
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
