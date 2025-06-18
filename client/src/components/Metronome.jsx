import { PropTypes } from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

export default function Metronome ({ id, initialName = "Metronome", initialBpm = 120, initialCount = 0, isRunningProp = false, onExpireFunc = null, currentActionId = null }) {
  console.log('Metronome', id, initialName, initialBpm, initialCount, isRunningProp);
  const [name, setName] = useState(initialName);
  const [bpm, setBpm] = useState(parseInt(initialBpm));
  const [countTicks, setCountTicks] = useState(parseInt(initialCount));
  const [isPlaying, setIsPlaying] = useState(isRunningProp);
  const intervalRef = useRef(null);
  const tickCountRef = useRef(0);
  const audio = new Audio('/sounds/click1.mp3');

  useEffect(() => {
    if (isPlaying) {
      startMetronome();
    } else {
      stopMetronome();
    }
    return () => stopMetronome();
  }, [isPlaying, bpm, countTicks]);

  useEffect(() => {
    if (currentActionId === id) {
      startMetronome();
    }
  }, [currentActionId]);

  function startMetronome() {
    if (intervalRef.current) return;
    const interval = (60 / bpm) * 1000;
    tickCountRef.current = 0; // Reset tick count when metronome starts
    intervalRef.current = setInterval(() => {
      audio.play();
      tickCountRef.current += 1;
      if (tickCountRef.current >= countTicks && countTicks > 1) {
        stopMetronome();
        setIsPlaying(false);
        tickCountRef.current = 0;
        if (onExpireFunc) {
          onExpireFunc(currentActionId);
        }
      }
    }, interval);
  }

  const stopMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleBpmChange = (event, newValue) => {
    setBpm(newValue);
  };

  const handleCountChange = (event) => {
    setCountTicks(event.target.value);
  };

  return (
    <Box sx={{ p: 2, textAlign: 'center', border:1, height: '320px',}}>
      <TextField
        fullWidth
        size="small"
        value={name}
        onChange={(e) => setName(e.target.value)}
        variant="outlined"
        label="Name"
      />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {bpm} BPM
      </Typography>
      <Slider
        value={bpm}
        onChange={handleBpmChange}
        min={1}
        max={240}
        step={1}
        valueLabelDisplay="auto"
        sx={{ mt: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
        <Button onClick={() => setIsPlaying(true)} variant="outlined" startIcon={<PlayArrowIcon />}>
          Start
        </Button>
        <Button onClick={() => setIsPlaying(false)} variant="outlined" startIcon={<StopIcon />} sx={{ ml: 2 }}>
          Stop
        </Button>
      </Box>
      <TextField
        fullWidth
        size="small"
        type="number"
        value={countTicks}
        onChange={handleCountChange}
        variant="outlined"
        label="Ticks Count"
        sx={{ mt: 2 }}
      />
    </Box>
  );
}

Metronome.propTypes = {
  id: PropTypes.string,
  initialName: PropTypes.string,
  initialBpm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  initialCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  isRunningProp: PropTypes.bool,
  onExpireFunc: PropTypes.func,
  currentActionId: PropTypes.string,
};

