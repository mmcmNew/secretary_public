import { Box, FormHelperText, IconButton, InputAdornment } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Controller, useFormContext } from "react-hook-form";
import dayjs from "dayjs";
import ClearIcon from "@mui/icons-material/Clear";
import 'dayjs/locale/ru';
dayjs.locale('ru');

export default function DateTimeRangePickerField({ name = "startEnd", onValidBlur }) {
    const { control, trigger, getValues } = useFormContext();

    return (
        <Controller
            name={name}
            control={control}
            rules={{
                validate: (value = {}) => {
                    const { start = null, end = null } = value;
                    if (!start && !end) return true;
                    if (!start || !end) return "Выберите дату и время начала и окончания";
                    
                    const startDate = dayjs(start);
                    const endDate = dayjs(end);
                    if (!startDate.isValid() || !endDate.isValid()) return "Некорректная дата";
                    if (!startDate.isBefore(endDate)) return "Дата окончания должна быть позже даты начала";
                    return true;
                }                
            }}
            render={({ field: { value = {}, onChange }, fieldState: { error } }) => {
                const { start = null, end = null } = value;
                const parsedStart = start ? dayjs(start) : null;
                const parsedEnd = end ? dayjs(end) : null;

                const handleAccept = async () => {
                    let currentValue = getValues(name) || {};
                    const { start, end } = currentValue;

                    if (start && !end) {
                        const newEnd = dayjs(start).add(1, "hour");
                        currentValue = { ...currentValue, end: newEnd };
                        onChange(currentValue);
                    }

                    if (await trigger(name)) {
                        onValidBlur?.({
                            start: currentValue.start
                                ? dayjs(currentValue.start).toISOString()
                                : null,
                            end: currentValue.end
                                ? dayjs(currentValue.end).toISOString()
                                : null,
                        });
                    }
                };

                const handleStartChange = (newStart) => {
                    onChange({ ...value, start: newStart });
                };

                const handleEndChange = (newEnd) => {
                    onChange({ ...value, end: newEnd });
                };

                const clearStart = () => {
                    onChange({ ...value, start: null });
                };

                const clearEnd = () => {
                    onChange({ ...value, end: null });
                };

                return (
                    <LocalizationProvider 
                        dateAdapter={AdapterDayjs}
                        adapterLocale="ru">
                        <Box display="flex" gap={2} flexWrap="wrap" width="100%">
                            <DateTimePicker
                                label="Начало"
                                format="DD.MM.YYYY HH:mm"
                                value={parsedStart}
                                onChange={handleStartChange}
                                onAccept={handleAccept}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        error: !!error,
                                        onBlur: handleAccept,
                                        InputProps: {
                                            endAdornment: start ? (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={clearStart} size="small">
                                                        <ClearIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null
                                        }
                                    }
                                }}
                            />
                            <DateTimePicker
                                label="Окончание"
                                format="DD.MM.YYYY HH:mm"
                                value={parsedEnd}
                                onChange={handleEndChange}
                                onAccept={handleAccept}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        error: !!error,
                                        onBlur: handleAccept,
                                        InputProps: {
                                            endAdornment: end ? (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={clearEnd} size="small">
                                                        <ClearIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null
                                        }
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