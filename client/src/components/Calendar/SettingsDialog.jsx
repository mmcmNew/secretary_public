import { useState } from 'react';
import { PropTypes } from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Slider, Typography, Button } from '@mui/material';

export default function SettingsDialog({ open, onClose, onApply, slotDuration, timeRange, timeOffset })
{
    const [tempSlotDuration, setTempSlotDuration] = useState(slotDuration);
    const [tempTimeRange, setTempTimeRange] = useState(timeRange);
    const [tempTimeOffset, setTempTimeOffset] = useState(timeOffset);


  // Обновление временных значений при изменении слайдеров
  const handleTempSlotDurationChange = (event, newValue) => {
    setTempSlotDuration(newValue);
  };

  const handleTempTimeRangeChange = (event, newValue) => {
    setTempTimeRange(newValue);
  };

  const handleTempTimeOffsetChange = (event, newValue) => {
    setTempTimeOffset(newValue);
  };

  const handleApply = () => {
    onApply(tempSlotDuration, tempTimeRange, tempTimeOffset);
  };

  return (
    <Dialog open={open} onClose={onClose} sx={{ maxWidth: '100%' }}>
      <DialogTitle>Настройки календаря</DialogTitle>
      <DialogContent sx={{ padding: '24px' }}>
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Интервал сетки (минуты)
          </Typography>
          <Slider
            value={tempSlotDuration}
            onChange={handleTempSlotDurationChange}
            aria-labelledby="slot-duration-slider"
            valueLabelDisplay="auto"
            step={5}
            min={5}
            max={60}
            marks
          />
        </Box>

        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Временной диапазон (часы)
          </Typography>
          <Slider
            value={tempTimeRange}
            onChange={handleTempTimeRangeChange}
            aria-labelledby="time-range-slider"
            valueLabelDisplay="auto"
            min={0}
            max={24}
            step={1}
            marks
          />
        </Box>
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Смещение времени (часы)
          </Typography>
          <Slider
            value={tempTimeOffset}
            onChange={handleTempTimeOffsetChange}
            aria-labelledby="time-offset-slider"
            valueLabelDisplay="auto"
            min={-12}
            max={12}
            step={1}
            marks
          />
        </Box>
      </DialogContent>


      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button onClick={onClose} sx={{ marginRight: 'auto', color: 'grey.600' }}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleApply} sx={{ backgroundColor: 'primary.main' }}>
          Применить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SettingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  slotDuration: PropTypes.number,
  timeRange: PropTypes.array,
  timeOffset: PropTypes.number,
};
