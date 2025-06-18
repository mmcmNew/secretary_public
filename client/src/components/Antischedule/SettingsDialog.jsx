import { useState } from 'react';
import { PropTypes } from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Slider, Typography, Button, FormControl, ToggleButton, } from '@mui/material';
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";


export default function SettingsDialog({ open, onClose, onApply,
  settingsProp={} })
{
  const { workIntervalDuration, breakDuration, additionalBreakDuration, isBackgroundTasks } = settingsProp;
  const [tempWorkIntervalDuration, setWorkIntervalDuration] = useState(Math.floor(workIntervalDuration/60));
  const [tempBreakDuration, setBreakDuration] = useState(Math.floor(breakDuration/60));
  const [tempAdditionalBreakDuration, setAdditionalBreakDuration] = useState(Math.floor(additionalBreakDuration/60));
  const [tempIsBackgroundTasks, setTempIsBackgroundTasks] = useState(isBackgroundTasks || true)

  // Обновление временных значений при изменении слайдеров
  const handleTempWorkIntervalDurationChange = (event, newValue) => {
    setWorkIntervalDuration(newValue);
  };

  const handleTempBreakDurationChange = (event, newValue) => {
    setBreakDuration(newValue);
  };

  const handleTempAdditionalBreakDurationChange = (event, newValue) => {
    setAdditionalBreakDuration(newValue);
  };

  const handleApply = () => {
    onApply({workIntervalDuration: tempWorkIntervalDuration * 60,
            breakDuration: tempBreakDuration * 60,
            additionalBreakDuration: tempAdditionalBreakDuration * 60,
            isBackgroundTasks: tempIsBackgroundTasks
          });
  };

  return (
    <Dialog open={open} onClose={onClose} sx={{ maxWidth: '100%' }}>
      <DialogTitle>Настройки календаря</DialogTitle>
      <DialogContent sx={{ padding: '24px' }}>
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {`Длительность рабочего интервала ${tempWorkIntervalDuration}`}
          </Typography>
          <Slider
            value={tempWorkIntervalDuration}
            onChange={handleTempWorkIntervalDurationChange}
            aria-labelledby="work-duration-slider"
            valueLabelDisplay="auto"
            step={5}
            min={10}
            max={120}
            marks
          />
        </Box>

        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {`Длительность обычного перерыва ${tempBreakDuration}`}
          </Typography>
          <Slider
            value={tempBreakDuration}
            onChange={handleTempBreakDurationChange}
            aria-labelledby="break-duration-slider"
            valueLabelDisplay="auto"
            min={3}
            max={15}
            step={1}
            marks
          />
        </Box>
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {`Длительность дополнительного перерыва ${tempAdditionalBreakDuration} (каждый 3-й перерыв для длительной задачи)`}
          </Typography>
          <Slider
            value={tempAdditionalBreakDuration}
            onChange={handleTempAdditionalBreakDurationChange}
            aria-labelledby="additional-duration-slider"
            valueLabelDisplay="auto"
            min={3}
            max={30}
            step={1}
            marks
          />
        </Box>

        <FormControl fullWidth key={`toggleIsBackgroundTasks`}>
          <ToggleButton
              value="check"
              size="small"
              selected={!!tempIsBackgroundTasks}
              onChange={() => {
                  setTempIsBackgroundTasks(!tempIsBackgroundTasks);
              }}
          >
              {tempIsBackgroundTasks ? (
                <CheckBoxIcon />
              ) : (
                <CheckBoxOutlineBlankIcon />
              )}
              {
                <Typography sx={{ ml: 1, textTransform: "none" }}>
                  Выводить фоновые задачи в список
                </Typography>
              }
          </ToggleButton>
        </FormControl>
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
  settingsProp: PropTypes.object,
};
