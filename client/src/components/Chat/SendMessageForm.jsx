import { useState, useEffect, useRef } from 'react';
import { Box, IconButton, TextField, Icon, CircularProgress } from '@mui/material';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import useWebSocket from './hooks/useWebSocket';
import FilesListComponent from './FilesList';

const user = { id: '1', name: 'me', avatar: 'me.png' };

function SendMessageForm() {
  const [newMessage, setNewMessage] = useState('');
  const [inputError, setInputError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef(null);

  const timerRef = useRef(null);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const { sendMessageAPI, sendTranscript, files, setFiles } = useWebSocket();

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (transcript) {
        if (transcript.toLowerCase() === 'останови прослушивание' ||
            (transcript.toLowerCase().includes('стоп стоп стоп'))) {
          SpeechRecognition.stopListening()
          resetTranscript()
          return
        }
        // если это голосовой ввод в поле то на сервер транскрипт не отправляем
        if (isListening) {
          setNewMessage(transcript);
          setIsListening(false); // Обновляем состояние
        } else {
          sendTranscript({ user_id: user.id, text: transcript });
        }
        resetTranscript();
      }
    }, 1100);
    return () => clearTimeout(timerRef.current);
  }, [transcript, resetTranscript, sendTranscript]);


  function handleMicClick() {
  if (isListening) {
    SpeechRecognition.stopListening();
    setIsListening(false);
  } else {
    SpeechRecognition.startListening({ continuous: false });
    setIsListening(true);
  }
}

  async function handleSendMessage() {
    if (!newMessage.trim()) {
      setInputError('Введите сообщение');
      return;
    }

    setInputError(false);
    setIsSending(true);

    try {
      await sendMessageAPI(user.id, newMessage);
      setNewMessage('');
    } catch (error) {
      setInputError(error.message || 'An unexpected error occurred');
      setIsSending(false);
    } finally {
      setIsSending(false);
    }
  }

  function handleAddFiles(event) {
    const selectedFiles = Array.from(event.target.files);

    setFiles((prevFiles) => {
      // Проверяем уникальность файла по 'name' и 'lastModified'
      const newFiles = selectedFiles.filter(newFile => {
        return !prevFiles.some(existingFile =>
          existingFile.name === newFile.name && existingFile.lastModified === newFile.lastModified
        );
      });

      return [...prevFiles, ...newFiles];

    });

    fileInputRef.current.value = "";
  }

  return (
    <>
      <FilesListComponent files={files} setFiles={setFiles} />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          position: 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          backgroundColor: 'background.paper',
          mt: 0,
          p: 1,
        }}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleAddFiles}
        />
        <IconButton aria-label="add" onClick={() => fileInputRef.current.click()}>
          <Icon>add_circle_outline</Icon>
        </IconButton>
        <TextField
          id="message_field"
          label="Сообщение"
          multiline
          maxRows={15}
          fullWidth
          error={!!inputError}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          helperText={inputError || ""}
        />
        <IconButton onClick={handleMicClick}>
          <Icon>{isListening ? 'stop' : 'mic'}</Icon>
        </IconButton>
        <IconButton onClick={handleSendMessage} disabled={isSending}>
          {isSending ? <CircularProgress size={24} /> : <Icon>send</Icon>}
        </IconButton>
      </Box>
    </>
  );
}

export default SendMessageForm;
