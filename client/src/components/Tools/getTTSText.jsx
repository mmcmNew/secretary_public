

import axios from 'axios';
import { apiPost } from '../../utils/api';

export default async function get_tts_audio_filename(text) {
    try {
        const response = await apiPost('/get_tts_audio_filename', new URLSearchParams({ text }));
        console.log('Filename:', response.data.filename);
        return response.data.filename;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}
