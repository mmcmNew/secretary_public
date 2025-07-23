import { Box, FormHelperText, IconButton, InputAdornment } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Controller, useFormContext } from "react-hook-form";
import dayjs from "dayjs";
import ClearIcon from "@mui/icons-material/Clear";
import CheckIcon from "@mui/icons-material/CheckCircle";
import 'dayjs/locale/ru';
dayjs.locale('ru');

import { useState, useRef } from "react";

export default function TimeRangePickerField({ name = "startEnd", onValidBlur }) {
    const { control, trigger, getValues } = useFormContext();
    const [editing, setEditing] = useState({ start: false, end: false });
    const [lastSent, setLastSent] = useState({ start: null, end: null });
    const startInputRef = useRef();
    const endInputRef = useRef();

    // Универсальный обработчик для отправки
    const handleSave = async (field) => {
        let currentValue = getValues(name) || {};
        const { start, end } = currentValue;
        let valid = await trigger(name);
        if (valid) {
            onValidBlur?.({
                start: start ? dayjs(start).toISOString() : null,
                end: end ? dayjs(end).toISOString() : null,
            });
            setLastSent({ start, end });
            setEditing((prev) => ({ ...prev, [field]: false }));
        }
    };

    return (
        <Controller
            name={name}
            control={control}
            rules={{
                validate: (value = {}) => {
                    const { start = null, end = null } = value;
                    if (!start && !end) return true;
                    if (!start || !end) return "Выберите время начала и окончания";
                    const startDate = dayjs(start);
                    const endDate = dayjs(end);
                    if (!startDate.isValid() || !endDate.isValid()) return "Некорректное время";
                    if (!startDate.isBefore(endDate)) return "Время окончания должно быть позже времени начала";
                    return true;
                }
            }}
            render={({ field: { value = {}, onChange }, fieldState: { error } }) => {
                const { start = null, end = null } = value;
                const parsedStart = start ? dayjs(start) : null;
                const parsedEnd = end ? dayjs(end) : null;
                const isStartChanged = start !== lastSent.start;
                const isEndChanged = end !== lastSent.end;

                const handleStartChange = (newStart) => {
                    onChange({ ...value, start: newStart });
                    setEditing((prev) => ({ ...prev, start: true }));
                };

                const handleEndChange = (newEnd) => {
                    onChange({ ...value, end: newEnd });
                    setEditing((prev) => ({ ...prev, end: true }));
                };

                const clearStart = () => {
                    onChange({ ...value, start: null });
                    setEditing((prev) => ({ ...prev, start: true }));
                };

                const clearEnd = () => {
                    onChange({ ...value, end: null });
                    setEditing((prev) => ({ ...prev, end: true }));
                };

                return (
                    <LocalizationProvider 
                        dateAdapter={AdapterDayjs}
                        adapterLocale="ru">
                        <Box display="flex" gap={2} flexWrap="wrap" width="100%">
                            <TimePicker
                                label="Начало"
                                format="HH:mm"
                                value={parsedStart}
                                onChange={handleStartChange}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        error: !!error,
                                        inputRef: startInputRef,
                                        InputProps: {
                                            endAdornment: (
                                                <>
                                                    {start && (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={clearStart} size="small">
                                                                <ClearIcon />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )}
                                                    {/* Галочка всегда видна */}
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            color="success"
                                                            size="small"
                                                            title="Сохранить"
                                                            onClick={() => handleSave('start')}
                                                        >
                                                            <CheckIcon style={{ color: '#43a047' }} />
                                                        </IconButton>
                                                    </InputAdornment>
                                                </>
                                            )
                                        },
                                        onFocus: () => setEditing((prev) => ({ ...prev, start: true })),
                                    }
                                }}
                            />
                            <TimePicker
                                label="Окончание"
                                format="HH:mm"
                                value={parsedEnd}
                                onChange={handleEndChange}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        error: !!error,
                                        inputRef: endInputRef,
                                        InputProps: {
                                            endAdornment: (
                                                <>
                                                    {end && (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={clearEnd} size="small">
                                                                <ClearIcon />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )}
                                                    {/* Галочка всегда видна */}
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            color="success"
                                                            size="small"
                                                            title="Сохранить"
                                                            onClick={() => handleSave('end')}
                                                        >
                                                            <CheckIcon style={{ color: '#43a047' }} />
                                                        </IconButton>
                                                    </InputAdornment>
                                                </>
                                            )
                                        },
                                        onFocus: () => setEditing((prev) => ({ ...prev, end: true })),
                                    }
                                }}
                            />
                            {error?.message && (
                                <Box width="100%">
                                    <FormHelperText error>{error.message}</FormHelperText>
                                </Box>
                            )}
                        </Box>
                    </LocalizationProvider>
                );
            }}
        />
    );
} 