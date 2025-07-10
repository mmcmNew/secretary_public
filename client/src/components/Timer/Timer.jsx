import { PropTypes } from 'prop-types';
import { useState, useEffect, useContext } from 'react';
import { useTimer } from 'react-timer-hook';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import { AudioContext } from '../../contexts/AudioContext.jsx';


export default function MyTimer({ id, initialTimeProp, initialEndTimeProp, resultText, isRunningProp=false, onExpireFunc=null, handleCloseTimer=null, handleUpdateTimers=null,  playSoundProp=true, soundUrl='/sounds/endTimer.mp3', currentActionId=null }) {
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [textToTts, setTextToTts] = useState(resultText || 'Таймер завершился');
  const { playSound } = useContext(AudioContext);
  const initialTime = isRunningProp ?
    (initialEndTimeProp ? new Date(initialEndTimeProp) : new Date())
    : (initialTimeProp ? new Date(new Date().getTime() + initialTimeProp * 1000) : new Date());

  const initialRemainingTime = initialTime.getTime() - new Date().getTime();

  const [editableTime, setEditableTime] = useState({
    days: Math.trunc(initialRemainingTime / (1000 * 60 * 60 * 24)),
    hours: Math.trunc((initialRemainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.trunc((initialRemainingTime % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.trunc((initialRemainingTime % (1000 * 60)) / 1000),
  });

  useEffect(() => {
    if (currentActionId === id) {
      const remainingTime = seconds + minutes * 60 + hours * 3600 + days * 86400;
      if (!remainingTime && onExpireFunc ){
        onExpireFunc(id)
        return;
      }
      handleStart()
    }
  }, [currentActionId]);

  function sendTextAndPlayAudio(text) {
      return fetch('/get_tts_audio', {
          method: 'POST',
          body: new URLSearchParams({text: text}),
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
      })
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.blob();
      })
      .then(blob => {
          const audioUrl = URL.createObjectURL(blob);
          return playSound(audioUrl);
      })
      .catch(error => {
          console.error('There has been a problem with your fetch operation:', error);
      });
  }

  function onExpire() {
    let playAudioPromise = Promise.resolve();

    if (playSoundProp) {
      if (soundUrl) {
        // Сначала воспроизводим пользовательский или стандартный звук завершения
        playAudioPromise = playSound(soundUrl);
      }
    }

    // После завершения звука проигрываем TTS
    playAudioPromise
      .then(() => sendTextAndPlayAudio(textToTts)) // Воспроизведение текста после звука
      .then(() => {
        resetTime(); // Сбрасываем таймер
        if (onExpireFunc) {
          onExpireFunc(id); // Вызываем функцию окончания
        }
      });
  }

  const {
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    pause,
    restart,
  } = useTimer({ expiryTimestamp: initialTime, onExpire, autoStart: false });

  useEffect(() => {
    if (isRunning) {
      setEditableTime({ days, hours, minutes, seconds });
    }
  }, [isRunning, days, hours, minutes, seconds]);

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }
    if (!isRunning) {
      const remainingTime = seconds + minutes * 60 + hours * 3600 + days * 86400;
      if (handleUpdateTimers)
        handleUpdateTimers(id, { initialTimeProp: remainingTime, resultText: textToTts, isRunningProp: false })
      console.log(id, days, hours, minutes, seconds, isRunning, textToTts)
    }

    if (isRunning) {
      // вывести в консоль время завершения таймера
      const endTime = new Date();
      endTime.setSeconds(
        endTime.getSeconds() +
        seconds +
        minutes * 60 +
        hours * 3600 +
        days * 86400
      );
      if (handleUpdateTimers)
        {
          handleUpdateTimers(id, { initialEndTimeProp: endTime.toISOString(), isRunningProp: true })
        }
      // console.log(id, endTime, isRunning, textToTts);
    }
  }, [isRunning])

  useEffect(() => {
    if (isRunningProp) {
      handleStart();
    }
  }, [isRunningProp]);

  function handleChange(event) {
    const { name, value } = event.target;
    setEditableTime((prev) => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  }

  function handleStart() {
    const time = new Date();
    time.setSeconds(
      time.getSeconds() +
      editableTime.seconds +
      editableTime.minutes * 60 +
      editableTime.hours * 3600 +
      editableTime.days * 86400
    );
    if (time > new Date()) {
      restart(time);
    }
  }

  function handleRestart() {
    pause();
    resetTime();
  }

  function resetTime() {
    setEditableTime({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  }

  return (
    <Box textAlign="center" border={1} padding='3px' sx={{ maxWidth: '450px' }}>
      <Box textAlign='right'>
        <IconButton size="small" onClick={() => {if (handleCloseTimer) handleCloseTimer(id)}}>
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </Box>
      <TextField
        size="small"
        value={ textToTts }
        onChange={(e) => setTextToTts(e.target.value)}
        onBlur={() => {if (handleUpdateTimers) handleUpdateTimers(id, { resultText: textToTts })}}
        style={{ width: "calc(100% - 20px)", margin: "0px 0px" }}
      />
      <Box display="flex" justifyContent="center" alignItems="center" fontSize="30px" marginTop={1}>
        <Box>
          <IconButton onClick={isRunning ? pause : handleStart}>
            {isRunning ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton onClick={handleRestart}>
            <RestartAltIcon />
          </IconButton>
        </Box>
        <TextField
          size="small"
          type="number"
          name="hours"
          value={editableTime.hours + editableTime.days*24}
          onChange={handleChange}
          disabled={isRunning}
          inputProps={{ min: 0}}
          style={{ width: '70px' }}
        />
        :
        <TextField
          size="small"
          type="number"
          name="minutes"
          value={editableTime.minutes}
          onChange={handleChange}
          disabled={isRunning}
          inputProps={{ min: 0, max: 59 }}
          style={{ width: '70px' }}
        />
        :
        <TextField
          size="small"
          type="number"
          name="seconds"
          value={editableTime.seconds}
          onChange={handleChange}
          disabled={isRunning}
          inputProps={{ min: 0, max: 59 }}
          style={{ width: '70px' }}
        />
      </Box>
    </Box>
  );
}

MyTimer.propTypes = {
  id: PropTypes.string,
  initialTimeProp: PropTypes.number,
  initialEndTimeProp: PropTypes.string,
  resultText: PropTypes.string,
  isRunningProp: PropTypes.bool,
  playSoundProp: PropTypes.bool,
  soundUrl: PropTypes.string,
  onExpireFunc: PropTypes.func,
  handleCloseTimer: PropTypes.func,
  handleUpdateTimers: PropTypes.func,
  currentActionId: PropTypes.string,
};
