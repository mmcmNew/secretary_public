import { PropTypes } from 'prop-types';
import { Alert, Button, CircularProgress, TextField } from "@mui/material";
import { Box } from "@mui/system";
import CheckIcon from '@mui/icons-material/Check';
import { useEffect, useRef, useState } from "react";
import TTSText from './TTSText';
import get_tts_audio_filename from '../Tools/getTTSText';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import FilesListComponent from '../Chat/FilesList';


async function sendNewRecord(table_name, record_info, sendingFiles) {
    const timeZone = new Date().getTimezoneOffset();
    let sendResult = null;
    const url = '/post_new_record';
    const formData = new FormData();
    formData.append('table_name', table_name);
    formData.append('time_zone', timeZone);
    formData.append('record_info', JSON.stringify(record_info));
    sendingFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
    });
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Ошибка при отправке новой записи на сервер');
        }
        const data = await response.json();
        sendResult = data;
        console.log('Запись добавлена успешно');
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
    }
    return sendResult;
}

async function updateRecord(table_name, record_info, sendingFiles) {
    const timeZone = new Date().getTimezoneOffset();
    let sendResult = null;
    const url = '/post_edited_record_api';
    const formData = new FormData();
    formData.append('table_name', table_name);
    formData.append('time_zone', timeZone);
    formData.append('record_info', JSON.stringify(record_info));
    sendingFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
    });
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
        throw new Error('Ошибка при отправке обновленной записи на сервер');
        }
        const data = await response.json();
        sendResult = data;
        console.log('Запись обновлена успешно');
    } catch (error) {
        console.error('Ошибка при обновлении записи:', error);
    }
    return sendResult;
}


export default function Survey({ id, survey, activeElementId=null, onExpireFunc=null, autosend=true, taskId=null }) {

    const unfiltredFields = survey?.fields
    // Массив полей, которые нужно исключить
    const excludeFields = ['id', 'date', 'files', 'time', 'table_name', 'task_id'];

    // Фильтруем поля, исключая те, которые есть в excludeFields
    const fields = unfiltredFields.filter((field) => !excludeFields.includes(field.field_id));

    const initialEditedParams = fields.reduce((acc, field) => {
        acc[field.field_id] = field.value || '';
        return acc;
    }, {});

    const [editedParams, setEditedParams] = useState(initialEditedParams);
    const [inputError, setInputError] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
    // const [loading, setLoading] = useState(false);
    const [isWaitingSTT, setIsWaitingSTT] = useState(false);
    const [currentFieldId, setCurrentFieldId] = useState(0);
    const [actionIdTTS, setActionIdTTS] = useState(null)
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);

    const { finalTranscript, resetTranscript, listening } = useSpeechRecognition();

    useEffect(() => {
        if (activeElementId === id)
            setActionIdTTS(id + survey.table_name)
    }, [activeElementId, id, survey.table_name])

    // useEffect на случай если распознавание речи было прервано
    useEffect(() => {
        if (isWaitingSTT && !listening) {
            setIsWaitingSTT(false);
        }
    }, [isWaitingSTT, listening])


    useEffect(() => {
        if (isWaitingSTT) {
            // console.log(finalTranscript)
            SpeechRecognition.stopListening();
            const fieldKey = fields[currentFieldId-1].field_id
            // console.log(fields[currentFieldId-1].field_id)
            let updatedParams = editedParams;
            if (finalTranscript.toLocaleLowerCase() !== 'дальше') {
                handleParamChange(fieldKey, finalTranscript);
                updatedParams = { ...editedParams, [fieldKey]: finalTranscript };
            }
            // console.log(updatedParams)
            resetTranscript();
            setIsWaitingSTT(false);
            onExpireTTS(currentFieldId, updatedParams);
        }
    }, [finalTranscript])

    if (!fields) return null;

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

    function handleParamChange(key, value) {
        setEditedParams((prevParams) => {
            const updatedParams = { ...prevParams, [key]: value };
            return updatedParams;
        });
    }

    async function handleSubmit(event, updatedParams=null) {
        setInputError(false);
        setIsSending(true);
        // console.log(updatedParams);
        if (!updatedParams) updatedParams = editedParams;
        // console.log(updatedParams);
        if (taskId !== null) {
            updatedParams['task_id'] = taskId;
        }
        let result = null;
        try {
            if (updatedParams.id) {
                result = await updateRecord(survey.table_name, updatedParams, files);
            } else {
                result = await sendNewRecord(survey.table_name, updatedParams, files);
            }
            if (!result) {
                throw new Error('Ошибка при отправке');
            }
            setFiles([]);
            // console.log(result);
            setEditedParams(result);
            setIsUpdateSuccess(true);
        } catch (record_edit_error) {
            setInputError(record_edit_error.message || 'An unexpected error occurred');
        } finally {
            setIsSending(false);
            if (onExpireFunc) {
                onExpireFunc(id);
            }
        }
    }

    async function onExpireTTS(elementId, updatedParams=null) {
        // console.log(updatedParams)
        if (!updatedParams) updatedParams = editedParams;
        let filedId = currentFieldId;
        if (elementId == id + survey.table_name) {
            filedId = 0;
            setCurrentFieldId(0);
        }
        let field = fields[filedId];

        // Проверка поля check, если false, переход к следующему полю
        while (field && field.check === "false") {
            filedId++;
            field = fields[filedId];
        }

        // Обновление состояния текущего поля
        setCurrentFieldId(filedId + 1);

        // Если достигнут конец списка полей, завершить обработку
        if (filedId >= fields.length) {
            // console.log(updatedParams)
            if (autosend)
                handleSubmit(null, updatedParams);
            return;
        }

        // console.log('field.field_name', field.field_name)
        const fieldTTSFilename = await get_tts_audio_filename(field.field_name);
        const fieldAudioUrl = `temp/${fieldTTSFilename}`;
        const fieldAudio = new Audio(fieldAudioUrl);
        fieldAudio.onended = () => {
            setIsWaitingSTT(true);
            // console.log('start');
            SpeechRecognition.startListening();
        };
        fieldAudio.play();
    }


    return (
        <Box>
            <p>Имя таблицы: {survey.table_name}</p>
            <TTSText key={id + survey.table_name} element={{'text': survey.text}}
                elementId={id + survey.table_name} onExpireFunc={onExpireTTS} currentActionId={actionIdTTS}/>
            {fields.map((field) => (
                <div key={id + field.field_id} style={{ marginBottom: '1rem' }}>
                    <TextField
                        id={id + field.field_id}
                        label={field.field_name}
                        multiline
                        maxRows={15}
                        fullWidth
                        value={editedParams[field.field_id] || ''}
                        onChange={(e) => handleParamChange(field.field_id, e.target.value)}
                    />
                </div>
            ))}
            {isSending ? <CircularProgress size={24} /> :
                <Box>
                    {files && files.length > 0 && <FilesListComponent files={files} setFiles={setFiles} />}
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleAddFiles}
                    />
                    <Button onClick={handleSubmit} disabled={isSending}>Записать</Button>
                    <Button onClick={() => fileInputRef.current.click()} disabled={isSending}>Прикрепить файл</Button>
                </Box>}
            {inputError && <p style={{ color: 'red' }}>{inputError}</p>}
            {isUpdateSuccess &&
                <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
                    Запись обновлена
                </Alert>}
        </Box>
    )
}


Survey.propTypes = {
    id: PropTypes.string.isRequired,
    survey: PropTypes.object.isRequired,
    activeElementId: PropTypes.string,
    onExpireFunc: PropTypes.func,
    autosend: PropTypes.bool,
    taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}
