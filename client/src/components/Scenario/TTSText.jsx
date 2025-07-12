import { useEffect, useState } from 'react';
import { PropTypes } from 'prop-types';
import { IconButton, ListItemButton, ListItemIcon, ListItemText, CircularProgress } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';


export default function TTSText({ element, elementId, isStartPlay = null, onExpireFunc = null,
    currentActionId=null }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isStartPlay) {
            setIsPlaying(true);
            handleClick();
        } else {
            setIsPlaying(false);
            if (audio) {
                audio.pause();
            }
        }
    }, [isStartPlay]);

    useEffect(() => {
        if (currentActionId === elementId) {
            setIsPlaying(true);
            handleClick();
        }
    }, [currentActionId]);

    const ttsMutation = useMutation({
        mutationFn: (text) =>
            axios.post('/get_tts_audio', new URLSearchParams({ text }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                responseType: 'blob'
            })
    });

    async function handleClick() {
        if (audio && isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            if (!audio) {
                setLoading(true);

                const response = await ttsMutation.mutateAsync(element.text);

                const blob = response.data;  // Получаем аудиофайл в виде Blob
                const audioUrl = URL.createObjectURL(blob);  // Создаем URL для аудиофайла

                const newAudio = new Audio(audioUrl);
                setAudio(newAudio);

                newAudio.onended = () => {
                    setIsPlaying(false);
                    if (onExpireFunc) {
                        onExpireFunc(elementId);
                    }
                };

                setLoading(false);
                newAudio.play();
                setIsPlaying(true);
            } else {
                audio.play();
                setIsPlaying(true);
            }
        }
    }

    return (
        <ListItemButton sx={{ margin: 0, padding: 0 }}>
            <ListItemIcon onClick={loading ? null : handleClick}>
                <IconButton aria-label={isPlaying ? "pause" : "play"} color="primary" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : (isPlaying ? <PauseIcon /> : <PlayArrowIcon />)}
                </IconButton>
            </ListItemIcon>
            <ListItemText id={elementId} primary={element.text} />
        </ListItemButton>
    );
}

TTSText.propTypes = {
    element: PropTypes.object.isRequired,
    elementId: PropTypes.string.isRequired,
    isStartPlay: PropTypes.bool,
    onExpireFunc: PropTypes.func,
    currentActionId: PropTypes.string,
};
