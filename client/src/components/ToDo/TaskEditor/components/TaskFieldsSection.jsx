import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    TextField,
    Divider,
    Paper,
    FormControl,
    Typography,
    ToggleButton,
    Autocomplete,
    Chip,
    Button,
} from '@mui/material';
import { Checkbox } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { renderTimeViewClock } from '@mui/x-date-pickers';
import { Controller } from 'react-hook-form';
import ColorPicker from '../../../ColorPicker.jsx';
import DateTimeRangePicker from '../../../../components/ToDo/DateTimeRangePicker.jsx';
import TimeRangePickerField from '../../../../components/ToDo/TimeRangePicker.jsx';

/**
 * Component for task fields section
 */

const TaskFieldsSection = memo(function TaskFieldsSection({
    taskFields,
    control,
    errors,
    triggerParentOnChange,
    showJournalButton = true,
    setTypeDialogOpen,
}) {
    const handleKeyDown = useCallback((e, field, onEnter) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onEnter(e.target.value);
        }
    }, []);

    // Handle datetime field changes
    const handleDateTimeChange = useCallback((key, newValue, onFieldChange) => {
        const iso = newValue ? newValue.toISOString() : null;
        onFieldChange(iso);
        triggerParentOnChange(key, iso);
    }, [triggerParentOnChange]);

    const renderField = useCallback(([key, field]) => {
        if (!field) return null;
        if (field.type === 'divider') return <Divider key={key} sx={{ my: 0.5 }} />;
        
        return (
            <Box key={key} sx={{ mt: 1 }}>
                {field.type === 'range' ? (
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
                ) : field.type === 'time-range' ? (
                    <TimeRangePickerField 
                        name={key} 
                        onValidBlur={(val) => {
                            triggerParentOnChange(key, val);
                        }} 
                    />
                ) : field.type === 'datetime' ? (
                    <FormControl fullWidth>
                        <Controller
                            name={key}
                            control={control}
                            render={({ field: ctrl }) => (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DateTimePicker
                                        viewRenderers={{ 
                                            hours: renderTimeViewClock, 
                                            minutes: renderTimeViewClock, 
                                            seconds: renderTimeViewClock 
                                        }}
                                        ampm={false}
                                        label={field.name}
                                        value={ctrl.value ? dayjs(ctrl.value) : null}
                                        format="DD/MM/YYYY HH:mm"
                                        onChange={(nv) => {
                                            handleDateTimeChange(key, nv, ctrl.onChange);
                                        }}
                                        onAccept={(nv) => {
                                            handleDateTimeChange(key, nv, ctrl.onChange);
                                        }}
                                        slotProps={{ 
                                            textField: { 
                                                inputProps: { readOnly: false }, 
                                                error: !!errors[key], 
                                                helperText: errors[key]?.message 
                                            } 
                                        }}
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
                                options={(key === 'type_id' ? 
                                    [...field.options, { value: '__add__', label: 'Добавить тип...' }] : 
                                    field.options
                                ).slice().sort((a, b) => {
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
                                        const newValue = nv ? nv.value : null;
                                        ctrl.onChange(newValue);
                                        triggerParentOnChange(key, newValue);
                                    }
                                }}
                                onBlur={() => {
                                    // Ensure changes are saved on blur for select fields
                                    console.log('Select field blur:', { key, value: ctrl.value });
                                    if (ctrl.value !== undefined) {
                                        triggerParentOnChange(key, ctrl.value);
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
                                onBlur={(e) => {
                                    // Always trigger update on blur for text fields to ensure changes are saved
                                    const currentValue = e.target.value;
                                    console.log('Text field blur:', { key, value: currentValue });
                                    triggerParentOnChange(key, currentValue);
                                }}
                                onChange={(e) => {
                                    ctrl.onChange(e.target.value);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, key, (value) => {
                                    console.log('TextField onKeyDown:', { key, value });
                                    triggerParentOnChange(key, value);
                                })}
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
                                    sx={{ 
                                        border: '1px solid', 
                                        borderColor: ctrl.value ? 'darkgrey' : 'grey.400', 
                                        justifyContent: 'flex-start', 
                                        p: 0 
                                    }}
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
                                onColorChange={(_, color) => {
                                    ctrl.onChange(color);
                                    triggerParentOnChange(key, color);
                                }}
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
                                onChange={(e, nv) => {
                                    ctrl.onChange(nv);
                                    triggerParentOnChange(key, nv);
                                }}
                                onBlur={() => {
                                    // Ensure changes are saved on blur for multiselect fields
                                    console.log('Multiselect field blur:', { key, value: ctrl.value });
                                    if (Array.isArray(ctrl.value)) {
                                        triggerParentOnChange(key, ctrl.value);
                                    }
                                }}
                                renderInput={(params) => <TextField {...params} label={field.name} />}
                                renderTags={(val, getTagProps) => 
                                    val.map((opt, idx) => <Chip key={opt.id} label={opt.title} {...getTagProps({ idx })} />)
                                }
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
                                onBlur={(e) => {
                                    console.log('Default field onBlur:', { key, value: e.target.value });
                                    triggerParentOnChange(key, e.target.value);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, key, (value) => {
                                    console.log('Default field onKeyDown:', { key, value });
                                    triggerParentOnChange(key, value);
                                })}
                                variant="outlined"
                            />
                        )}
                    />
                )}
            </Box>
        );
    }, [control, errors, triggerParentOnChange, setTypeDialogOpen, handleDateTimeChange]);

    return (
        <Paper variant="outlined" sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1.5, paddingY: 2 }}>
            {showJournalButton && (
                <Button variant="outlined">Добавить запись в журнал проекта</Button>
            )}
            {Object.entries(taskFields)
                .slice()
                .sort(([, a], [, b]) => (a.id || 0) - (b.id || 0))
                .map(renderField)}
        </Paper>
    );
});

TaskFieldsSection.propTypes = {
    taskFields: PropTypes.object.isRequired,
    control: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    triggerParentOnChange: PropTypes.func.isRequired,
    showJournalButton: PropTypes.bool,
    setTypeDialogOpen: PropTypes.func.isRequired,
};

export default TaskFieldsSection;
