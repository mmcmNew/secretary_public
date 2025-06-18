import { useRef, useEffect, useCallback } from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function useSpeechToText(isContinuous) {
  const timerRef = useRef(null);
  const { transcript, resetTranscript } = useSpeechRecognition();

  const getFinalResult = useCallback(() => {
    return new Promise((resolve) => {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: isContinuous });

      if (timerRef.current) clearTimeout(timerRef.current);

      const checkTranscript = () => {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          const finalTranscript = transcript.trim();
          console.log("Final result after pause:", finalTranscript);
          resolve(finalTranscript);
        }, 900);
      };

      checkTranscript();

      return finalTranscript;
    });
  }, [isContinuous, resetTranscript, transcript]);

  useEffect(() => {
    if (transcript) {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const finalTranscript = transcript.trim();
        console.log("Final result after pause:", finalTranscript);
        resolve(finalTranscript);
      }, 900);
    }
  }, [transcript]);

  return { getFinalResult };
}

export default useSpeechToText;
