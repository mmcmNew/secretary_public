import { useState } from 'react';
import { Box, Typography, IconButton, CircularProgress, Collapse, Paper, Icon } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ScenarioComponent from '../Scenario';

export default function MiniScenario() {
  const [expanded, setExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(80);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [currentStep, setCurrentStep] = useState('Текущий шаг');
  const [scenarioName, setScenarioName] = useState('Мой день');

  // Обработчик паузы/запуска
  const handlePlayPause = () => {
    setIsRunning(!isRunning);
    setIsPaused(!isPaused);
  };

  // Функция для обновления прогресса и шага
  const updateProgress = (scenarioName, newProgress, newRemainingTime, newCurrentStep) => {
    // console.log(scenarioName, newProgress, newRemainingTime, newCurrentStep);
    setScenarioName(scenarioName)
    setProgress(newProgress);
    setRemainingTime(newRemainingTime || 0);
    setCurrentStep(newCurrentStep);
  };

  const formatRemainingTime = (remainingTime) => {
    const seconds = Math.floor((remainingTime / 1000) % 60);
    const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
    const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);

    if (hours > 0) {
      return `${hours} ч`;
    } else if (minutes > 0) {
      return `${minutes} м`;
    } else {
      return `${seconds} с`;
    }
  };

  return (
    <Box sx={{ width: '350px' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 1,
        }}
      >
        {/* Прогресс таймера */}
        <Box sx={{ position: 'relative', display: 'inline-flex', margin: 1 }}>
          <CircularProgress
            variant="determinate"
            value={progress}
            color={isPaused ? 'warning' : remainingTime < 0 ? 'error' : 'primary'}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" component="div" color="text.secondary">
              {formatRemainingTime(remainingTime)}
            </Typography>
          </Box>
        </Box>
        {/* Отображение названия сценария и текущего шага */}
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%'}}>
          <Typography variant="subtitle2">{scenarioName}</Typography>
          <Typography variant="caption">{currentStep}</Typography>
        </Box>

        {/* Кнопка паузы/запуска */}
        <IconButton onClick={handlePlayPause} color="inherit">
          {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
        </IconButton>
        <IconButton onClick={() => setExpanded(!expanded)} color="inherit">
          {expanded ? <Icon>expand_less</Icon> : <Icon>expand_more</Icon>}
        </IconButton>
      </Box>

      {/* Встроенный компонент сценария */}
      <Collapse in={expanded} sx={{ position: 'absolute', zIndex: 999, width: '500px', right: 0 }}>
        <Paper sx={{ padding: 1, border: '1px solid #ccc', maxHeight: '80vh', overflowY: 'auto' }}>
          <ScenarioComponent
            isRunningProp={isRunning}
            updateProgress={updateProgress} // Передаем функцию для обновления прогресса
          />
        </Paper>
      </Collapse>
    </Box>
  );
}
