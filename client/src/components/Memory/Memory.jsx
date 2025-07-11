
import { useRef, useState } from 'react';
import { Box, Button, ButtonGroup, IconButton, Slider, Switch, TextField, Typography, Accordion, AccordionSummary, AccordionDetails, Alert, CircularProgress } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { ExpandMore, PlayArrow, Pause, Replay, VolumeUp, VolumeOff, TextFields } from '@mui/icons-material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import axios from 'axios';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-flip';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './Memory.css';

import PropTypes from 'prop-types';


async function sendNewRecord(table_name, record_info) {
    const timeZone = new Date().getTimezoneOffset();
    let sendResult = null;
    const url = '/post_new_record';
    const formData = new FormData();
    formData.append('table_name', table_name);
    formData.append('time_zone', timeZone);
    formData.append('record_info', JSON.stringify(record_info));
    try {
        const response = await axios.post(url, formData);
        sendResult = response.data;
        console.log('Запись добавлена успешно');
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
    }
    return sendResult;
}


const MemoryComponent = ({ initInterval = 6000, initItems = [] }) => {
  const [paused, setPaused] = useState(true);
  const [expended, setExpended] = useState(false);
  const [interval, setInterval] = useState(initInterval);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [textEnabled, setTextEnabled] = useState(false);
  const [wordsCount, setWordsCount] = useState(50);
  const [textInput, setTextInput] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [delimiter, setDelimiter] = useState('');
  const [answerResult, setAnswerResult] = useState([]);
  const [items, setItems] = useState(initItems);
  const [inputError, setInputError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
  const swiperRef = useRef(null);

  const progressCircle = useRef(null);
  const progressContent = useRef(null);
  const onAutoplayTimeLeft = (s, time, progress) => {
    progressCircle.current.style.setProperty('--progress', 1 - progress);
    progressContent.current.textContent = `${Math.ceil(time / 1000)}s`;
  };

  function handlePlayPause() {
    if (items.length < 1) return;
    if (paused) {
      swiperRef.current.swiper.autoplay.start();
    } else {
      swiperRef.current.swiper.autoplay.stop();
    }
    setPaused(!paused);
  }

  function handleRestart() {
    if (items.length < 1) return;
    swiperRef.current.swiper.slideTo(0);
    swiperRef.current.swiper.autoplay.start();
    setPaused(false);
  }

  function handleIntervalChange(event, newValue){
    setInterval(newValue);
    swiperRef.current.swiper.params.autoplay.delay = newValue;
  }

  function handleSlideChange() {
    if ( swiperRef.current.swiper.activeIndex === items.length - 1) {
      setPaused(true);
      swiperRef.current.swiper.autoplay.stop();
    }

    if (soundEnabled) {
      const audio = new Audio('sounds/click1.mp3');
      audio.play();
    }
  }

  function handleTextSwitch() {
    setTextEnabled(!textEnabled);
  }

  function handleSoundSwitch() {
    setSoundEnabled(!soundEnabled);
  }

function handleNewSet(type) {
  let numbers = [];
  let num = 0;
  setPaused(true);
  swiperRef.current.swiper.autoplay.stop();
  swiperRef.current.swiper.slideTo(0);
  setAnswerResult([])
  setAnswerText('');

  if (type === 'numbers' || type === 'images') {
    // сгенерировать случайный набор чисел от 0 до 100 в количестве равном wordsCount
    numbers = Array.from({ length: wordsCount }, () => {
      num = Math.floor(Math.random() * 100) + 1;
      return {
        text: num.toString(),
        url: `${num}.jpg`
      };
    });

    if (type === 'images') {
      setTextEnabled(false);
    } else {
      setTextEnabled(true);
    }

    setTextInput(numbers.map(item => item.text).join(' '));
  } else if (type === 'base') {
    // сгенерировать случайный набор чисел в виде 1.1.1 каждое число от 1 до 5 в количестве равном wordsCount
    numbers = Array.from({ length: wordsCount }, () => ({
      text: `${Math.ceil(Math.random() * 5)}.${Math.ceil(Math.random() * 5)}.${Math.ceil(Math.random() * 5)}`,
      url: ''
    }));
    setTextEnabled(true);
  }
  // добавляем еще один пустой элемент в конце который будет на последнем слайде
  const newItems = numbers.concat([{ text: '', url: '' }]);
  setItems(newItems);
}


  function handleStartMemorizing() {
    // Определить разделитель
    setAnswerText('');
    if (textInput.trim() === '') {
      console.log('Пустой текст');
      return;
    }
    setAnswerResult([])
    swiperRef.current.swiper.slideTo(0);
    swiperRef.current.swiper.autoplay.start();
    setPaused(false);
    setTextEnabled(true);
    setExpended(false);
    const splitDelimiter = delimiter || ' ';

    // Разделить текст на слова
    const words = textInput.split(splitDelimiter).filter(word => word.trim() !== '');

    // Создать элементы массива items
    const newItems = words.map((word) => ({
      text: word,
      url: '' // Для слов URL будет пустым
    }));

    // Обновить состояние items
    setItems(newItems);

    // Запустить запоминание (например, начать показывать слайды)
    // console.log(`Начало запоминания с текстом: ${textInput}, разделитель: ${splitDelimiter}`);
  }


  async function handleCheckText() {
    // console.log('Проверка текста');
    const splitDelimiter = delimiter || ' ';
    const words = textInput.split(splitDelimiter).filter(word => word.trim() !== '');
    const answerWords = answerText.split(splitDelimiter).filter(word => word.trim() !== '');
    let resultWords = [];
    let correctCount = 0;

    for (let i = 0; i < words.length; i++) {
      if (words[i] === answerWords[i]) {
        resultWords.push({ word: words[i], correct: true });
        correctCount++;
      } else {
        resultWords.push({ word: words[i], correct: false });
      }
    }

    const resultString = resultWords.map(word => word.correct ? word.word : `<span style="color: red;">${word.word}</span>`).join(' ');
    const percentage = ((correctCount / words.length) * 100).toFixed(2);
    const resultSummary = `Результат: ${correctCount} из ${words.length} (${percentage}%)`;
    setAnswerResult({ summary: resultSummary, words: resultWords, resultString: resultString });
    let result = null;

    try {
      setIsSending(true)
      result = await sendNewRecord('diary', { reason: 'Memory', comment: `Результат: ${correctCount} из ${words.length} (${percentage}%)` });
      setIsSending(false)
      if (!result) {
          throw new Error('Ошибка при отправке');
      }
      setIsUpdateSuccess(true);
    } catch (record_edit_error) {
        setInputError(record_edit_error.message || 'An unexpected error occurred');
    } finally {
        setIsSending(false);
    }

    setTimeout(() => {
      setIsUpdateSuccess(false);
      setInputError(false)
    }, 5000);

  }


  return (
    <Box sx={{ margin: 2, display: 'flex', flexDirection: 'column', maxHeight: '95vh', maxWidth: '700px', minWidth: '300px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, }}>
            <TextField
              label="Количество слов"
              type="number"
              variant="outlined"
              size="small"
              min={1}
              max={1000}
              value={wordsCount}
              onChange={(e) => setWordsCount(e.target.value)}
            />
            <Box display={'flex'} gap={1}>
              <Button variant="outlined" size="small" onClick={() => handleNewSet('images')}>
              Опорные образы
              </Button>
              <Button variant="outlined" size="small" onClick={() => handleNewSet('numbers')}>
              Числа
              </Button>
              <Button variant="outlined" size="small" onClick={() => handleNewSet('base')}>
              База
              </Button>
            </Box>
        </Box>
        <Accordion expanded={expended} onChange={() => setExpended(!expended)}>
          <AccordionSummary expandIcon={<ExpandMore />} >
            <Typography>Набор слов для запоминания</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
                label="Введите текст"
                multiline
                maxRows={10}
                variant="outlined"
                fullWidth
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
            />
            <TextField
                label="Введите разделитель"
                variant="outlined"
                fullWidth
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                sx={{ marginTop: 2 }}
            />
            <Button variant="outlined" size="small" onClick={handleStartMemorizing} sx={{ marginTop: 2 }}>
                Начать запоминание
            </Button>
          </AccordionDetails>
        </Accordion>
        <Box sx={{ flexGrow: 1, marginTop: 2, height: '100%', width: '100%' }}>
          <Swiper
            ref={swiperRef}
            spaceBetween={30}
            centeredSlides={true}
            autoplay={{
              enabled: !paused,
              delay: interval,
              disableOnInteraction: false,
            }}
            lazy={'true'}
            pagination={{
              type: 'fraction',
            }}
            height={'100%'}
            navigation={true}
            modules={[Autoplay, Pagination, Navigation]}
            onAutoplayTimeLeft={onAutoplayTimeLeft}
            onSlideChange={() => handleSlideChange()}
          >
            {items.map((item, index) => (
              <SwiperSlide key={index} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
                height: '400px' }}>
                {textEnabled ? (
                    <Typography variant="h3">{item.text}</Typography>
                ) : (
                  <img
                    src={item.url ? `memory/${item.url}` : 'memory/placeholder.jpg'}
                    alt={item.text}
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </SwiperSlide>
            ))}
            <div className="autoplay-progress" slot="container-end">
              <svg viewBox="0 0 48 48" ref={progressCircle}>
                <circle cx="24" cy="24" r="20"></circle>
              </svg>
              <span ref={progressContent}></span>
            </div>
          </Swiper>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 2, width: '100%' }}>
            <ButtonGroup size="small">
            <IconButton onClick={handlePlayPause}>
                {paused ? <PlayArrow /> : <Pause />}
            </IconButton>
            <IconButton onClick={handleRestart}>
                <Replay />
            </IconButton>
            </ButtonGroup>
            <Slider
              min={500}
              max={15000}
              step={500}
              value={interval}
              onChange={handleIntervalChange}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value / 1000}s`}
              aria-labelledby="interval-slider"
              sx={{ width: '150px', marginLeft: 2, marginRight: 2 }}
            />
            <Switch
              checked={soundEnabled}
              onChange={handleSoundSwitch}
              icon={<VolumeOff />}
              checkedIcon={<VolumeUp />}
            />
            <Switch
              checked={textEnabled}
              onChange={handleTextSwitch}
              icon={<TextFields />}
              checkedIcon={<TextFields />}
            />
        </Box>
        <TextField
          label="Введите текст для проверки"
          multiline
          maxRows={10}
          variant="outlined"
          fullWidth
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          sx={{ marginTop: 2 }}
        />
        <Button variant="outlined" size="large" onClick={handleCheckText} sx={{ marginTop: 2 }}>
            Проверить
        </Button>
        <Box sx={{height: '100px'}}>
          <Typography>{answerResult.summary}</Typography>
          <Typography sx={{color: 'green'}} dangerouslySetInnerHTML={{ __html: answerResult.resultString }} />
          {isSending && <CircularProgress size={24} />}
          {inputError && <p style={{ color: 'red' }}>{inputError}</p>}
          {isUpdateSuccess &&
            <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
                Результат записан в личный дневник
            </Alert>}
        </Box>
      </Box>
  );
};

MemoryComponent.propTypes = {
  initInterval: PropTypes.number,
  initItems: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string,
      url: PropTypes.string,
    })
  ),
};

export default MemoryComponent;
