

export default function get_tts_audio_filename(text) {
    return  fetch('/get_tts_audio_filename', {
        method: 'POST',
        body: new URLSearchParams({text: text}),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Filename:', data.filename);
        return data.filename;
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
}
