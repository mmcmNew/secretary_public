// components/DateTimeRangePicker.jsx
import { Grid, TextField, FormHelperText } from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Controller } from "react-hook-form";
import dayjs from "dayjs";

export default function DateTimeRangePickerField({ control, name = "startEnd" }) {
    return (
        <Controller
            name={name}
            control={control}
            rules={{
                validate: ({ dateStart, dateEnd, timeStart, timeEnd }) => {
                    if (!dateStart || !dateEnd) return "Выберите обе даты";
                    if (!timeStart || !timeEnd) return "Укажите время начала и окончания";
                    const start = dayjs(dateStart).hour(timeStart.hour()).minute(timeStart.minute());
                    const end = dayjs(dateEnd).hour(timeEnd.hour()).minute(timeEnd.minute());
                    if (!start.isBefore(end)) return "Дата окончания должна быть позже даты начала";
                    return true;
                }
            }}
            render={({ field: { value = {}, onChange }, fieldState: { error } }) => {
                const { dateStart = null, dateEnd = null, timeStart = null, timeEnd = null } = value;

                return (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <DatePicker
                                    label="Дата начала"
                                    value={dateStart}
                                    onChange={(newDate) => onChange({ ...value, dateStart: newDate })}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TimePicker
                                    label="Время начала"
                                    value={timeStart}
                                    onChange={(newTime) => onChange({ ...value, timeStart: newTime })}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <DatePicker
                                    label="Дата окончания"
                                    value={dateEnd}
                                    onChange={(newDate) => onChange({ ...value, dateEnd: newDate })}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TimePicker
                                    label="Время окончания"
                                    value={timeEnd}
                                    onChange={(newTime) => onChange({ ...value, timeEnd: newTime })}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
                            {error?.message && (
                                <Grid item xs={12}>
                                    <FormHelperText error>{error.message}</FormHelperText>
                                </Grid>
                            )}
                        </Grid>
                    </LocalizationProvider>
                );
            }}
        />
    );
}