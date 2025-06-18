import { Card, CardMedia } from '@mui/material';
import { useSpeechRecognition } from 'react-speech-recognition';
import useContainer from './DraggableComponents/useContainer';

const SecretaryGIF = () => {
  const { listening } = useSpeechRecognition();
  const { isSecretarySpeak } = useContainer();


  const imageSrc =  isSecretarySpeak ? 'avatars/speak-anime.gif' :
        listening ? 'avatars/noted.webp' : 'avatars/sleep.webp';

  return (
    <Card sx={{ maxWidth: 240 }} >
      <CardMedia
        component="img"
        height="250"
        image={imageSrc}
        alt="status image"
      />
    </Card>
  );
};

export default SecretaryGIF;
