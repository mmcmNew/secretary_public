import { useEffect, useState, useCallback, useMemo, memo, useContext, useRef } from "react";
import { useForm, Controller, useFieldArray, FormProvider } from "react-hook-form";
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
import DateTimeRangePickerField from "./DateTimeRangePicker.jsx";


function TaskEditor({
    taskFields,
    tasks = [],
    selectedTaskId = null,
    clickedStart = null,
    updateTask = null,
    changeTaskStatus = null,
    addSubTask = null,
    deleteTask = null,
    selectedListId = null,
}) {
    const methods = useForm({ defaultValues: { subtasks: [] } });
    const { control, getValues, setValue, reset, watch, setError, clearErrors, formState: { errors } } = methods;
    const fields = watch();
    const { fields: subtaskFields, append, remove } = useFieldArray({ control, name: 'subtasks' });
    const [newRecordDialogOpen, setNewRecordDialogOpen] = useState(false);
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [newTypeData, setNewTypeData] = useState({ name: '', color: '#3788D8', description: '' });
    const updateNewTypeData = (field, value) => setNewTypeData(prev => ({ ...prev, [field]: value }));
    const { addTaskType, getSubtasksByParentId } = useTasks();
    const { playAudio } = useContext(AudioContext);
    const [subtasks, setSubtasks] = useState([]);

    useEffect(() => {
        if (!selectedTaskId) return;
        getSubtasksByParentId(selectedTaskId)
            .then(setSubtasks)
            .catch(() => setSubtasks([]));
    }, [selectedTaskId, getSubtasksByParentId]);

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
            } else if (field.type === 'range') {
                initial[key] = {
                    start: task.start ? dayjs(task.start).toISOString() : null,
                    end: task.end ? dayjs(task.end).toISOString() : null,
                };
            } else {
                initial[key] = task[key] ?? '';
            }
        });
        initial.title = task.title;
        initial.start = task.start ? dayjs(task.start).toISOString() : null;
        initial.end = task.end ? dayjs(task.end).toISOString() : null;
        // Используем подзадачи, полученные с сервера
        initial.subtasks = subtasks.map(st => ({ id: st.id, title: st.title, status_id: st.status_id }));
        reset(initial);
    }, [task, taskFields, reset, subtasks]);

    const lastSent = useRef({});

    const handleUpdate = useCallback(async (field, value) => {
        setValue(field, value);


        if (task && value !== lastSent.current[field] && value !== task[field]) {
            lastSent.current[field] = value;
            let listId = null;
            if (selectedListId) {
                listId = selectedListId;
            }
            await updateTask({ taskId: task.id, [field]: value, listId });
        }
    }, [task, updateTask, selectedListId, setValue]);

    const handleRangeUpdate = useCallback((val) => {
        handleUpdate('start', val?.start || null);
        handleUpdate('end', val?.end || null);
    }, [handleUpdate]);

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
            if (clickedStart) payload.current_start = clickedStart;
            playAudio("/sounds/isComplited.wav", { queued: false });
        }
        await changeTaskStatus(payload);
    }, [changeTaskStatus, task, taskMap, selectedListId]);

    const handleSubBlur = useCallback(async (index) => {
        const field = subtaskFields[index];
        const title = getValues(`subtasks.${index}.title`).trim();
        if (!title) return;
        let listId = null;
        const sub = field.id ? taskMap.get(field.id) : null;
        if (Array.isArray(sub?.lists) && sub.lists.length > 0) {
            listId = sub.lists[0].id;
        } else if (selectedListId) {
            listId = selectedListId;
        }
        if (field.id) {
            if (sub && sub.title !== title) {
                await updateTask({ taskId: field.id, title, listId });
            }
        } else {
            await addSubTask({ title, parentTaskId: task.id, listId });
            remove(index);
        }
    }, [subtaskFields, getValues, addSubTask, updateTask, task, selectedListId, taskMap, remove]);


    const handleKeyDown = useCallback((e, field, subId = null) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (subId) handleSubBlur(subId);
            else handleUpdate(field, e.target.value);
        }
    }, [handleSubBlur, handleUpdate]);


    const handleDeleteSubTask = useCallback(async (subId) => {
        let listId = null;
        const sub = taskMap.get(subId);
        if (Array.isArray(sub?.lists) && sub.lists.length > 0) {
            listId = sub.lists[0].id;
        } else if (selectedListId) {
            listId = selectedListId;
        }
        await deleteTask({ taskId: subId, listId });
    }, [deleteTask, taskMap, selectedListId]);

    const handleDeleteTask = useCallback(async () => {
        let listId = null;
        if (Array.isArray(task.lists) && task.lists.length > 0) {
            listId = task.lists[0].id;
        } else if (selectedListId) {
            listId = selectedListId;
        }
        await deleteTask({ taskId: task.id, listId });
    }, [deleteTask, task, selectedListId]);

    if (!task) return null;

    return (
        <FormProvider {...methods}>
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
                    {subtaskFields.map((sub, idx) => (
                        <Grid container alignItems="center" spacing={0.5} key={sub.id || idx} sx={{ marginY: 0.5 }}>
                            <Grid item xs width="100%">
                                <Box component="form" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Checkbox
                                        checked={sub.status_id === 2}
                                        sx={{ m: 0, p: 0 }}
                                        onChange={(e) => sub.id && handleToggle(sub.id, e.target.checked)}
                                    />
                                    <Controller
                                        name={`subtasks.${idx}.title`}
                                        control={control}
                                        render={({ field }) => (
                                            <InputBase
                                                sx={{ ml: 1, flex: 1, textDecoration: sub.status_id === 2 ? 'line-through' : 'none', width: '100%' }}
                                                placeholder="Подзадача"
                                                {...field}
                                                onBlur={() => handleSubBlur(idx)}
                                                onKeyDown={(e) => handleKeyDown(e, `subtasks.${idx}.title`, idx)}
                                                inputProps={{ 'aria-label': 'subtask' }}
                                            />
                                        )}
                                    />
                                    <Divider sx={{ height: 15, m: 0.5 }} orientation="vertical" />
                                    <IconButton sx={{ m: 0, p: 0 }} onClick={() => sub.id ? handleDeleteSubTask(sub.id) : remove(idx)}>
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                                <Divider sx={{ m: 0.5 }} />
                            </Grid>
                        </Grid>
                    ))}
                </Box>
                <Grid item xs>
                    <Box component="form" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <IconButton sx={{ m: 0, p: 0 }} onClick={() => append({ id: null, title: '', status_id: 1 })}>
                            <AddIcon />
                        </IconButton>
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
                                {field.type === 'range' ? (
                                    <DateTimeRangePickerField name={key} onValidBlur={handleRangeUpdate} />
                                ) : field.type === 'datetime' ? (
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
                                                        onChange={(nv) => {
                                                            const iso = nv ? nv.toISOString() : null;
                                                            ctrl.onChange(iso);
                                                            handleUpdate(key, iso);
                                                        }}
                                                        slotProps={{ textField: { inputProps: { readOnly: false }, error: !!errors[key], helperText: errors[key]?.message } }}
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
        </FormProvider>
    );
}

TaskEditor.propTypes = {
    taskFields: PropTypes.object,  // сюда передаётся TaskField.data
    tasks: PropTypes.array,
    selectedTaskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clickedStart: PropTypes.string,
    updateTask: PropTypes.func,
    changeTaskStatus: PropTypes.func,
    addSubTask: PropTypes.func,
    deleteTask: PropTypes.func,
    selectedListId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default TaskEditor;
