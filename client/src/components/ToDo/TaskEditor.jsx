import { useEffect, useState, memo } from "react";
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
import TaskTypeDialog from "../TaskTypeManager/TaskTypeDialog.jsx";
import PropTypes from "prop-types";
import DateTimeRangePicker from "./DateTimeRangePicker.jsx";
import TimeRangePickerField from "./TimeRangePicker.jsx";

function TaskEditor({
    taskFields,
    task = null,
    subtasks = [],
    onChange = null,
    addSubTask = null,
    changeTaskStatus = null,
    deleteTask = null,
    showJournalButton = true,
}) {
    const methods = useForm({ defaultValues: { subtasks: [] } });
    const { control, setValue, reset, watch, formState: { errors }, getValues } = methods;
    const { fields: subtaskFields, append, remove, replace } = useFieldArray({ control, name: 'subtasks' });
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [newTypeData, setNewTypeData] = useState({ name: '', color: '#3788D8', description: '' });
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const updateNewTypeData = (field, value) => setNewTypeData(prev => ({ ...prev, [field]: value }));

    // Инициализация формы из пропсов
    useEffect(() => {
        if (!task || !taskFields) return;
        const initial = {};
        Object.entries(taskFields).forEach(([key, field]) => {
            if (field.type === 'range') {
                initial[key] = {
                    start: task.start ? dayjs(task.start).toISOString() : null,
                    end: task.end ? dayjs(task.end).toISOString() : null,
                };
            } else {
                 initial[key] = task[key] ?? (field.type === 'toggle' ? false : (field.type === 'multiselect' ? [] : ''));
            }
        });
        initial.title = task.title;
        initial.subtasks = Array.isArray(subtasks) ? subtasks.map(st => ({ id: st.id, title: st.title, is_completed: st.is_completed })) : [];
        reset(initial);
        replace(initial.subtasks);
    }, [task, taskFields, subtasks, reset, replace]);

    // Обработчик для немедленного обновления родительского компонента
    const triggerParentOnChange = (updatedField, updatedValue) => {
        if (!onChange) return;
        const formValues = getValues();
        const updatedTask = {
            ...task,
            ...formValues,
            [updatedField]: updatedValue,
        };

        // Если обновляется диапазон дат, также обновим корневые start и end
        if (typeof updatedValue === 'object' && updatedValue !== null && ('start' in updatedValue || 'end' in updatedValue)) {
            updatedTask.start = updatedValue.start;
            updatedTask.end = updatedValue.end;
        }

        onChange(updatedTask);
    };

    const handleToggle = (taskId, is_completed) => {
        if (changeTaskStatus) {
            const completed_at = is_completed ? new Date().toISOString() : null;
            changeTaskStatus({ taskId, is_completed, completed_at });
        }
    };

    const handleSubBlur = async (index) => {
        const field = subtaskFields[index];
        const title = getValues(`subtasks.${index}.title`).trim();
        if (!title) return;
        if (!field.id && addSubTask) {
            await addSubTask({ title, parentTaskId: task.id });
        } else {
            triggerParentOnChange(`subtasks.${index}.title`, title);
        }
    };

    const handleAddSubtask = async (e) => {
        if (e.type === 'keydown' && e.key !== 'Enter') return;
        e.preventDefault();
        const title = newSubtaskTitle.trim();
        if (!title) return;
        if (addSubTask) {
            await addSubTask({ title, parentTaskId: task.id });
        } else {
            append({ title, status_id: 1 });
        }
        setNewSubtaskTitle('');
    };

    const handleKeyDown = (e, field, onEnter) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onEnter(e.target.value);
        }
    };

    const handleDeleteSubTask = (subId) => {
        if (deleteTask) deleteTask(subId);
    };

    if (!task) return null;
    console.log('TaskEditor render', { task, taskFields, subtasks });

    return (
        <FormProvider {...methods}>
        <Box sx={{ width: '100%', height: '96%', pb: 2 }}>
            <Paper variant="outlined" sx={{ p: 1, my: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                        checked={task.is_completed}
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
                                onBlur={(e) => triggerParentOnChange('title', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 'title', (value) => triggerParentOnChange('title', value))}
                                multiline
                                maxRows={3}
                                variant="outlined"
                            />
                        )}
                    />
                </Box>
                <Box sx={{ marginY: 0 }}>
                    {subtaskFields?.map((sub, idx) => (
                        <Grid container alignItems="center" spacing={0.5} key={sub.id || idx} sx={{ marginY: 0.5 }}>
                            <Grid item xs width="100%">
                                <Box component="form" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Checkbox
                                        checked={sub.is_completed}
                                        sx={{ m: 0, p: 0 }}
                                        onChange={(e) => sub.id && handleToggle(sub.id, e.target.checked)}
                                    />
                                    <Controller
                                        name={`subtasks.${idx}.title`}
                                        control={control}
                                        render={({ field }) => (
                                            <InputBase
                                                sx={{ ml: 1, flex: 1, textDecoration: sub.is_completed ? 'line-through' : 'none', width: '100%' }}
                                                placeholder="Подзадача"
                                                {...field}
                                                onBlur={() => handleSubBlur(idx)}
                                                onKeyDown={(e) => handleKeyDown(e, `subtasks.${idx}.title`, () => handleSubBlur(idx))}
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
                {typeof handleAddSubtask == 'function' &&
                    <Grid item xs>
                        <Box component="form" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <IconButton sx={{ m: 0, p: 0 }} onClick={handleAddSubtask}>
                                <AddIcon />
                            </IconButton>
                            <InputBase
                                sx={{ flex: 1, ml: 1 }}
                                placeholder="Новая подзадача"
                                value={newSubtaskTitle}
                                onChange={e => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={handleAddSubtask}
                                inputProps={{ 'aria-label': 'add subtask' }}
                            />
                        </Box>
                    </Grid>
                }
            </Paper>
            {task.is_completed && (
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                    Завершено: {task.completed_at ? dayjs(task.completed_at).format('DD/MM/YYYY HH:mm') : ''}
                </Typography>
            )}
            <Paper variant="outlined" sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1.5, paddingY: 2 }}>
                {showJournalButton && <Button variant="outlined">Добавить запись в журнал проекта</Button>}
                {Object.entries(taskFields)
                    .slice()
                    .sort(([, a], [, b]) => (a.id || 0) - (b.id || 0))
                    .map(([key, field]) => {
                        if (!field) return null;
                        if (field.type === 'divider') return <Divider key={key} sx={{ my: 0.5 }} />;
                        return (
                            <Box key={key} sx={{ mt: 1 }}>
                                {field.type === 'range' ?
                                    <Controller
                                        name={key}
                                        control={control}
                                        render={({ field: { onChange: onFieldChange, value }, fieldState: { error } }) => (
                                            <DateTimeRangePicker
                                                value={value}
                                                onChange={(newValue) => {
                                                    onFieldChange(newValue);
                                                    triggerParentOnChange(key, newValue);
                                                }}
                                                error={error}
                                            />
                                        )}
                                    />
                                 : field.type === 'time-range' ?
                                    <TimeRangePickerField name={key} onValidBlur={(val) => triggerParentOnChange(key, val)} />
                                 : field.type === 'datetime' ? (
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
                                                            triggerParentOnChange(key, iso);
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
                                                options={(key === 'type_id' ? [...field.options, { value: '__add__', label: 'Добавить тип...' }] : field.options).slice().sort((a, b) => {
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
                                                        triggerParentOnChange(key, nv ? nv.value : null);
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
                                                onBlur={(e) => triggerParentOnChange(key, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, key, (value) => triggerParentOnChange(key, value))}
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
                                                    onChange={() => {
                                                        const newValue = !ctrl.value;
                                                        ctrl.onChange(newValue);
                                                        triggerParentOnChange(key, newValue);
                                                    }}
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
                                                onColorChange={(_, color) => triggerParentOnChange(key, color)}
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
                                                onChange={(e, nv) => triggerParentOnChange(key, nv)}
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
                                                onBlur={(e) => triggerParentOnChange(key, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, key, (value) => triggerParentOnChange(key, value))}
                                                variant="outlined"
                                            />
                                        )}
                                    />
                                )}
                            </Box>
                        );
                    })}
            </Paper>
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
    showJournalButton: PropTypes.bool,
};

export default memo(TaskEditor);