import { useGetTtsAudioFilenameMutation } from '../../store/chatApi';

export const useGetTtsAudioFilename = () => {
  const [getTtsAudioFilename] = useGetTtsAudioFilenameMutation();

  const getFilename = async (text) => {
    try {
      const response = await getTtsAudioFilename(text).unwrap();
      console.log('Filename:', response.filename);
      return response.filename;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
      return null;
    }
  };

  return getFilename;
};
