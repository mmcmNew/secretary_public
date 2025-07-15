import { useEffect, useState, useRef } from "react";
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
import DateTimeRangePickerField from "./DateTimeRangePicker.jsx";

function TaskEditor({
    taskFields,
    task = null,
    subtasks = [],
    onChange = null,
    addSubTask = null,
    updateTask = null,
    changeTaskStatus = null,
    deleteTask = null,
}) {
    const methods = useForm({ defaultValues: { subtasks: [] } });
    const { control, setValue, reset, watch, formState: { errors } } = methods;
    const { fields: subtaskFields, append, remove, replace } = useFieldArray({ control, name: 'subtasks' });
    const [newRecordDialogOpen, setNewRecordDialogOpen] = useState(false);
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [newTypeData, setNewTypeData] = useState({ name: '', color: '#3788D8', description: '' });
    const updateNewTypeData = (field, value) => setNewTypeData(prev => ({ ...prev, [field]: value }));
    const lastSent = useRef({});

    // Инициализация формы из пропсов
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
        initial.subtasks = subtasks.map(st => ({ id: st.id, title: st.title, status_id: st.status_id }));
        reset(initial);
        replace(initial.subtasks);
    }, [task, taskFields, subtasks, reset, replace]);

    // Обработчики
    const handleUpdate = (field, value, opts = {}) => {
        setValue(field, value);
        if (opts.immediate && onChange) {
            // Собираем актуальные значения формы
            const values = methods.getValues();
            const updatedTask = {
                ...task,
                ...values,
                subtasks: values.subtasks,
            };
            onChange(updatedTask);
        }
    };

    const handleRangeUpdate = (val) => {
        handleUpdate('start', val?.start || null, { immediate: true });
        handleUpdate('end', val?.end || null, { immediate: true });
    };

    const handleToggle = (taskId, checked, subIdx = null) => {
        if (changeTaskStatus) changeTaskStatus(taskId, checked);
        // onChange вызовется через родителя, но для локальных чекбоксов тоже отправим
        if (onChange) {
            const values = methods.getValues();
            const updatedTask = {
                ...task,
                ...values,
                subtasks: values.subtasks,
            };
            onChange(updatedTask);
        }
    };

    const handleSubBlur = async (index) => {
        const field = subtaskFields[index];
        const title = methods.getValues(`subtasks.${index}.title`).trim();
        if (!title) return;
        if (!field.id && addSubTask) {
            await addSubTask({ title, parentTaskId: task.id });
            // onChange вызовется через обновление subtasks пропа
        } else if (onChange) {
            // Для существующей подзадачи отправим изменения
            const values = methods.getValues();
            const updatedTask = {
                ...task,
                ...values,
                subtasks: values.subtasks,
            };
            onChange(updatedTask);
        }
    };

    const handleKeyDown = (e, field, subIdx = null) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (subIdx !== null) handleSubBlur(subIdx);
            else {
                handleUpdate(field, e.target.value, { immediate: true });
            }
        }
    };

    const handleDeleteSubTask = (subId) => {
        if (deleteTask) deleteTask(subId);
        // onChange вызовется через обновление subtasks пропа
    };

    const handleDeleteTask = () => {
        if (deleteTask) deleteTask(task.id);
    };

    if (!task) return null;

    return (
        <FormProvider {...methods}>
        <Box sx={{ width: '100%', height: '96%', pb: 2 }}>
            <Paper variant="outlined" sx={{ p: 1, my: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                        checked={task.status_id === 2}
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
                                onBlur={(e) => handleUpdate('title', e.target.value, { immediate: true })}
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
                                        onChange={(e) => sub.id && handleToggle(sub.id, e.target.checked, idx)}
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
            {task.status_id === 2 && (
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
                                                            handleUpdate(key, iso, { immediate: true });
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
                                                        handleUpdate(key, nv ? nv.value : null, { immediate: true });
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
                                                onBlur={(e) => handleUpdate(key, e.target.value, { immediate: true })}
                                                onKeyDown={(e) => handleKeyDown(e, key)}
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
                                                    onChange={() => handleUpdate(key, !ctrl.value, { immediate: true })}
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
                                                onColorChange={(_, color) => handleUpdate(key, color, { immediate: true })}
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
                                                onChange={(e, nv) => handleUpdate(key, nv, { immediate: true })}
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
                                                onBlur={(e) => handleUpdate(key, e.target.value, { immediate: true })}
                                                onKeyDown={(e) => handleKeyDown(e, key)}
                                                variant="outlined"
                                            />
                                        )}
                                    />
                                )}
                            </Box>
                        );
                    })}
            </Paper>
            <NewRecordDialog open={newRecordDialogOpen} handleClose={() => setNewRecordDialogOpen(false)} taskId={task.id} />
            <TaskTypeDialog
                open={typeDialogOpen}
                onClose={() => setTypeDialogOpen(false)}
                data={newTypeData}
                onChange={updateNewTypeData}
                onSave={async () => {
                    // Типы задач должны обновляться вне компонента
                        setTypeDialogOpen(false);
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
    taskFields: PropTypes.object,
    task: PropTypes.object,
    subtasks: PropTypes.array,
    onChange: PropTypes.func,
    addSubTask: PropTypes.func,
    updateTask: PropTypes.func,
    changeTaskStatus: PropTypes.func,
    deleteTask: PropTypes.func,
};

export default TaskEditor;
