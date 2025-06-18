import { useState } from 'react';
import { Paper, Button, List, ListItem, ListItemText, IconButton, Collapse } from '@mui/material';
import { PlayArrow, Pause, SkipNext, ExpandLess, ExpandMore } from '@mui/icons-material';
import useContainer from './DraggableComponents/useContainer';

function AudioPlayer() {
  const { state, dispatch } = useContainer();
  const [open, setOpen] = useState(true);

  const handlePlayPause = () => {
    dispatch({ type: state.isPlaying ? 'PAUSE' : 'PLAY' });
  };

  const handleNextTrack = () => {
    dispatch({ type: 'NEXT_TRACK' });
  };

  const toggleList = () => {
    setOpen(!open);
  };

  return (
    <Paper elevation={3} style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={toggleList} endIcon={open ? <ExpandLess /> : <ExpandMore />}>
          {open ? 'Скрыть' : 'Показать'} список
        </Button>
      </div>
      <Collapse in={open}>
        <List>
          {state.queue.map((track, index) => (
            <ListItem key={index} selected={index === state.currentTrackIndex}>
              <ListItemText primary={track} />
            </ListItem>
          ))}
        </List>
      </Collapse>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
        <IconButton onClick={handlePlayPause}>
          {state.isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton onClick={handleNextTrack}>
          <SkipNext />
        </IconButton>
      </div>
    </Paper>
  );
}

export default AudioPlayer;
