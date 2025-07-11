

import axios from 'axios';

export default async function get_tts_audio_filename(text) {
    try {
        const response = await axios.post('/get_tts_audio_filename', new URLSearchParams({ text }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log('Filename:', response.data.filename);
        return response.data.filename;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}
