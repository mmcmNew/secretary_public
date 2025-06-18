import { Fab, Icon } from '@mui/material';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';


function MicrophoneButton() {

  const {
    listening,
    resetTranscript,
  } = useSpeechRecognition();


  const handleMicClick = () => {
    if (listening) {
        SpeechRecognition.stopListening();
    } else {
        resetTranscript();
        SpeechRecognition.startListening({ continuous: true });
    }
  }

  return (
    <Fab color="primary" aria-label="microphone" onClick={handleMicClick}
      sx={{ position: 'absolute', bottom: 20, left: 16 }}
      //size='small'
      >
      <Icon>{listening ? 'stop' : 'mic'}</Icon>
    </Fab>
  );
}

export default MicrophoneButton;
