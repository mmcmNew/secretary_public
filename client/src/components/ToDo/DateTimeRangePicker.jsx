import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

dayjs.locale('ru');

/**
 * Компонент для выбора диапазона даты и времени с использованием Material-UI.
 * @param {{
 *   value: { start: string | null, end: string | null },
 *   onChange: (value: { start: string | null, end: string | null }) => void,
 * }} props
 * @returns {JSX.Element}
 */
export default function DateTimeRangePicker({ value = {}, onChange }) {
  const { start = null, end = null } = value;

  const [internalStart, setInternalStart] = useState(start ? dayjs(start) : null);
  const [internalEnd, setInternalEnd] = useState(end ? dayjs(end) : null);

  useEffect(() => {
    setInternalStart(start ? dayjs(start) : null);
  }, [start]);

  useEffect(() => {
    setInternalEnd(end ? dayjs(end) : null);
  }, [end]);

  const handleDateChange = () => {
    let newStart = internalStart;
    let newEnd = internalEnd;

    if (newStart && newEnd && newStart.isAfter(newEnd)) {
      [newStart, newEnd] = [newEnd, newStart];
    }

    if (newStart?.toISOString() !== start || newEnd?.toISOString() !== end) {
      onChange({
        start: newStart ? newStart.toISOString() : null,
        end: newEnd ? newEnd.toISOString() : null,
      });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleDateChange();
    }
  };

  const handleStartChange = (date) => {
    setInternalStart(date);
  };

  const handleEndChange = (date) => {
    setInternalEnd(date);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <DateTimePicker
          label="Начало"
          clearable
          value={internalStart}
          onChange={handleStartChange}
          ampm={false}
          sx={{ width: '100%' }}
          size="small"
          slotProps={{
            textField: { onKeyDown: handleKeyDown },
            actionBar: {
              actions: ['clear', 'cancel', 'accept'],
            },
          }}
        />
        <DateTimePicker
          label="Окончание"
          clearable
          value={internalEnd}
          onChange={handleEndChange}
          ampm={false}
          sx={{ width: '100%' }}
          size="small"
          slotProps={{
            textField: { onKeyDown: handleKeyDown },
            actionBar: {
              actions: ['clear', 'cancel', 'accept'],
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}

DateTimeRangePicker.displayName = 'DateTimeRangePicker'; // Set display name for better debugging
DateTimeRangePicker.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
};