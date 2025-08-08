import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { Box, Button, Paper } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import { IconButton, Icon } from '@mui/material';
import { useState, useEffect } from 'react';
import TimersToolbar from './TimersToolbar';
import { useDispatch, useSelector } from 'react-redux';
import { addContainer } from '../../store/dashboardSlice';

export default function MiniTimers(props) {
  const dispatch = useDispatch();
  const timers = useSelector(state => state?.timers?.timers);
  const [expanded, setExpanded] = useState(false);
  const [currentTimers, setCurrentTimers] = useState(timers);

  useEffect(() => {
    if (!timers || timers.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTimers([...timers]); // Обновляем состояние таймеров каждую секунду
    }, 1000);

    return () => clearInterval(interval); // Очищаем интервал при размонтировании компонента
  }, [timers]);

  const calculateProgress = (timer) => {
    let remainingTime;
    let isPaused
    if (!timer.isRunningProp && timer.initialTimeProp) {
      remainingTime = timer.initialTimeProp * 1000;
      isPaused = true
    } else {
      const now = new Date().getTime();
      const endTime = new Date(timer.initialEndTimeProp).getTime() || null;
      remainingTime = endTime - now + 2000; // по какой то причине возникает разница в 2 секунды
      isPaused = false
    }

      // Прогресс рассчитывается от одного часа
      const hourDuration = 60 * 60 * 1000;
      let progress = (remainingTime <= hourDuration) ? (remainingTime / hourDuration) * 100 : 100;

    if (remainingTime<0) {
      progress = 100
    }

    return {
      progress: Math.max(progress, 0),
      remainingTime,
      isPaused,
    };
  };

  const formatRemainingTime = (remainingTime) => {
    const seconds = (remainingTime / 1000) % 60 | 0;
    const minutes = (remainingTime / 1000 / 60) % 60 | 0;
    const hours = (remainingTime / (1000 * 60 * 60)) % 24 | 0;

    if (Math.abs(hours) > 0) {
      return `${hours} h`;
    } else if (Math.abs(minutes) > 0) {
      return `${minutes} m`;
    } else {
      return `${seconds} s`;
    }
  };


  if (!currentTimers || currentTimers.length === 0)
    return (
      <Button onClick={() => addContainer('timersToolbar')}>Запустить таймер</Button>
    );

  return (
    <Box sx={{ overflowX: 'auto', maxWidth: '50vw'}}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 1,
        }}
      >
        {currentTimers.map((timer) => {
          const { progress, remainingTime, isPaused } = calculateProgress(timer);

          return (
            <Box key={timer.id} sx={{ position: 'relative', display: 'inline-flex', margin: 1 }}
              onClick={() => setExpanded(!expanded)}>
              <CircularProgress variant="determinate" {...props} value={progress}
              color={isPaused ? 'warning' : remainingTime < 0 ? 'error' : 'primary'} />
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
                {isPaused ? (
                <Icon color="action">pause</Icon>  // Отображаем иконку паузы
              ) : (
                <Typography variant="caption" component="div" color="text.secondary">
                  {formatRemainingTime(remainingTime)}
                </Typography>
              )}
              </Box>
            </Box>
          );
        })}
        <IconButton onClick={() => setExpanded(!expanded)} color="inherit">
          {expanded ? <Icon>expand_less</Icon> : <Icon>expand_more</Icon>}
        </IconButton>
      </Box>
      <Collapse in={expanded} sx={{ position: 'absolute', zIndex: 999, minWidth: '360px', right: '30px' }}>
        <Paper sx={{ padding: 1, border: '1px solid #ccc' }}>
          <TimersToolbar />
        </Paper>
      </Collapse>
    </Box>
  );
}
