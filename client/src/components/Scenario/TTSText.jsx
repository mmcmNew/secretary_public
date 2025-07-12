import { useEffect, useState } from 'react';
import { PropTypes } from 'prop-types';
import { IconButton, ListItemButton, ListItemIcon, ListItemText, CircularProgress } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../utils/api';


export default function TTSText({ element, elementId, isStartPlay = null, onExpireFunc = null,
    currentActionId=null }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState(null);
    const ttsMutation = useMutation({
        mutationFn: (text) =>
            apiPost('/get_tts_audio', new URLSearchParams({ text }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                responseType: 'blob'
            })
    });

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

    async function handleClick() {
        if (audio && isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            if (!audio) {
                const blob = await ttsMutation.mutateAsync(element.text);
                const audioUrl = URL.createObjectURL(blob);

                const newAudio = new Audio(audioUrl);
                setAudio(newAudio);

                newAudio.onended = () => {
                    setIsPlaying(false);
                    if (onExpireFunc) {
                        onExpireFunc(elementId);
                    }
                };

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
            <ListItemIcon onClick={ttsMutation.isLoading ? null : handleClick}>
                <IconButton aria-label={isPlaying ? "pause" : "play"} color="primary" disabled={ttsMutation.isLoading}>
                    {ttsMutation.isLoading ? <CircularProgress size={24} /> : (isPlaying ? <PauseIcon /> : <PlayArrowIcon />)}
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
