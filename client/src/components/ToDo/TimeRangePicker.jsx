import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

dayjs.locale('ru');

/**
 * A component for selecting a time range with optional start and end times, using Material-UI.
 * @param {{
 *   value: { start: string | null, end: string | null },
 *   onChange: (value: { start: string | null, end: string | null }) => void,
 * }} props
 * @returns {JSX.Element}
 */
export default function TimeRangePicker({ value = {}, onChange }) {
  const { start = null, end = null } = value;

  // Internal state to prevent parent's onChange from being called on every modification
  const [internalStart, setInternalStart] = useState(start ? dayjs(start) : null);
  const [internalEnd, setInternalEnd] = useState(end ? dayjs(end) : null);

  // Sync internal state with props
  useEffect(() => {
    setInternalStart(start ? dayjs(start) : null);
  }, [start]);

  useEffect(() => {
    setInternalEnd(end ? dayjs(end) : null);
  }, [end]);

  const handleStartAccept = (date) => {
    onChange({
      start: date ? date.toISOString() : null,
      end,
    });
  };

  const handleEndAccept = (date) => {
    onChange({
      start,
      end: date ? date.toISOString() : null,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
        <TimePicker
          label="Начало"
          value={internalStart}
          onChange={setInternalStart} // Update only internal state
          onAccept={handleStartAccept} // Call parent's onChange on accept
          maxTime={end ? dayjs(end) : undefined}
          ampm={false}
          sx={{ width: '50%' }}
          slotProps={{
            actionBar: {
              actions: ['accept', 'cancel', 'clear'],
            },
          }}
        />
        <TimePicker
          label="Окончание"
          value={internalEnd}
          onChange={setInternalEnd} // Update only internal state
          onAccept={handleEndAccept} // Call parent's onChange on accept
          minTime={start ? dayjs(start) : undefined}
          ampm={false}
          sx={{ width: '50%' }}
          slotProps={{
            actionBar: {
              actions: ['accept', 'cancel', 'clear'],
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}

TimeRangePicker.displayName = 'TimeRangePicker'; // Set display name for better debugging
TimeRangePicker.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
};