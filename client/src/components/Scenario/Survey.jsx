import { PropTypes } from 'prop-types';
import { Alert, Autocomplete, Button, CircularProgress, TextField } from "@mui/material";
import { Box } from "@mui/system";
import CheckIcon from '@mui/icons-material/Check';
import { useEffect, useRef, useState } from "react";
import TTSText from './TTSText';
import get_tts_audio_filename from '../Tools/getTTSText';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import FilesListComponent from '../Chat/FilesList';


async function sendNewRecord(table_name, record_info) {
    const url = `/api/journals/${table_name}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record_info),
        });
        if (!response.ok) {
            throw new Error('Ошибка при отправке новой записи на сервер');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
        return null;
    }
}

async function sendNewRecordWithFiles(table_name, formData) {
    const url = `/api/journals/${table_name}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Ошибка при отправке новой записи с файлами');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка при создании записи с файлами:', error);
        return null;
    }
}

async function updateRecord(table_name, record_info) {
    const url = `/api/journals/${table_name}/${record_info.id}`;
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record_info),
        });
        if (!response.ok) {
            throw new Error('Ошибка при отправке обновленной записи на сервер');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка при обновлении записи:', error);
        return null;
    }
}

async function updateRecordWithFiles(table_name, record_id, formData) {
    const url = `/api/journals/${table_name}/${record_id}`;
    try {
        const response = await fetch(url, {
            method: 'PUT',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Ошибка при обновлении записи с файлами');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка при обновлении записи с файлами:', error);
        return null;
    }
}


export default function Survey({ id, survey, activeElementId=null, onExpireFunc=null, autosend=true, taskId=null }) {

    const unfiltredFields = survey?.fields
    // Массив полей, которые нужно исключить
    const excludeFields = ['id', 'date', 'time', 'table_name', 'task_id'];

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
    const [successMessage, setSuccessMessage] = useState('');
    // const [loading, setLoading] = useState(false);
    const [isWaitingSTT, setIsWaitingSTT] = useState(false);
    const [currentFieldId, setCurrentFieldId] = useState(0);
    const [actionIdTTS, setActionIdTTS] = useState(null)
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [fieldFiles, setFieldFiles] = useState({});  // Файлы для конкретных полей
    const [fieldOptions, setFieldOptions] = useState({});

    const { finalTranscript, resetTranscript, listening } = useSpeechRecognition();

    // Загружаем опции для полей при монтировании
    useEffect(() => {
        const loadFieldOptions = async () => {
            try {
                const response = await fetch(`/get_tables_filters/${survey.table_name}`);
                if (response.ok) {
                    const data = await response.json();
                    setFieldOptions(data);
                }
            } catch (error) {
                console.error('Error loading field options:', error);
            }
        };
        if (survey?.table_name) {
            loadFieldOptions();
        }
    }, [survey?.table_name]);

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

    function addUniqueFiles(selectedFiles) {
        setFiles((prevFiles) => {
            const newFiles = selectedFiles.filter(newFile => {
                return !prevFiles.some(existingFile =>
                    existingFile.name === newFile.name && existingFile.lastModified === newFile.lastModified
                );
            });
            return [...prevFiles, ...newFiles];
        });
    }

    function addFieldFiles(fieldId, selectedFiles) {
        setFieldFiles(prev => {
            const existing = prev[fieldId] || [];
            const newFiles = selectedFiles.filter(newFile => !existing.some(ex =>
                ex.name === newFile.name && ex.lastModified === newFile.lastModified));
            return { ...prev, [fieldId]: [...existing, ...newFiles] };
        });
    }

    function handleAddFiles(event) {
        const selectedFiles = Array.from(event.target.files);
        addUniqueFiles(selectedFiles);
        fileInputRef.current.value = "";
    }

    function handleFieldInputChange(fieldId, event) {
        const selectedFiles = Array.from(event.target.files);
        addFieldFiles(fieldId, selectedFiles);
    }

    function handlePaste(event) {
        const items = event.clipboardData?.items;
        if (!items) return;
        const pastedFiles = [];
        for (const item of items) {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) pastedFiles.push(file);
            }
        }
        if (pastedFiles.length) {
            event.preventDefault();
            addUniqueFiles(pastedFiles);
        }
    }

    function handleFieldPaste(fieldId, event) {
        const items = event.clipboardData?.items;
        if (!items) return;
        const pastedFiles = [];
        for (const item of items) {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) pastedFiles.push(file);
            }
        }
        if (pastedFiles.length) {
            event.preventDefault();
            addFieldFiles(fieldId, pastedFiles);
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);
        if (droppedFiles.length) {
            addUniqueFiles(droppedFiles);
        }
    }

    function handleFieldDrop(fieldId, event) {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);
        if (droppedFiles.length) {
            addFieldFiles(fieldId, droppedFiles);
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleFieldDragOver(event) {
        event.preventDefault();
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
        if (!updatedParams) updatedParams = editedParams;
        if (taskId !== null) {
            updatedParams['task_id'] = taskId;
        }
        const isNew = !updatedParams.id;
        let result = null;
        try {
            // Создаем FormData для отправки файлов
            const formData = new FormData();
            
            // Добавляем обычные поля
            Object.keys(updatedParams).forEach(key => {
                if (updatedParams[key] !== null && updatedParams[key] !== undefined) {
                    formData.append(key, updatedParams[key]);
                }
            });
            
            // Добавляем файлы для каждого поля
            Object.keys(fieldFiles).forEach(fieldName => {
                const files = fieldFiles[fieldName] || [];
                files.forEach(file => {
                    formData.append(fieldName, file);
                });
            });
            
            if (isNew) {
                result = await sendNewRecordWithFiles(survey.table_name, formData);
            } else {
                result = await updateRecordWithFiles(survey.table_name, updatedParams.id, formData);
            }
            if (!result) {
                throw new Error('Ошибка при отправке');
            }
            setFiles([]);
            setFieldFiles({});
            // Обновляем поля данными созданной/обновленной записи
            const newParams = {};
            if (result.data) {
                // Для новых записей данные в result.data
                Object.keys(result.data).forEach(key => {
                    if (fields.some(field => field.field_id === key)) {
                        newParams[key] = result.data[key];
                    }
                });
                newParams.id = result.id;
            } else {
                // Для обновленных записей данные в result
                Object.keys(result).forEach(key => {
                    if (fields.some(field => field.field_id === key)) {
                        newParams[key] = result[key];
                    }
                });
                newParams.id = result.id;
            }
            setEditedParams(newParams);
            setSuccessMessage(isNew ? 'Запись создана' : 'Запись обновлена');
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
        <Box onPaste={handlePaste} onDrop={handleDrop} onDragOver={handleDragOver}>
            <p>Имя таблицы: {survey.table_name}</p>
            <TTSText key={id + survey.table_name} element={{'text': survey.text}}
                elementId={id + survey.table_name} onExpireFunc={onExpireTTS} currentActionId={actionIdTTS}/>
            {fields.map((field) => {
                const fieldType = field.type || 'text';
                const options = fieldOptions[field.field_id] || [];
                
                if (fieldType === 'file') {
                    return (
                        <div
                            key={id + field.field_id}
                            style={{ marginBottom: '1rem' }}
                            onDrop={(e) => handleFieldDrop(field.field_id, e)}
                            onDragOver={handleFieldDragOver}
                            onPaste={(e) => handleFieldPaste(field.field_id, e)}
                        >
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                {field.field_name}
                            </label>
                            <input
                                type="file"
                                multiple={field.multiple}
                                onChange={(e) => handleFieldInputChange(field.field_id, e)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            {fieldFiles[field.field_id] && fieldFiles[field.field_id].length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <strong>Выбранные файлы:</strong>
                                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                                        {fieldFiles[field.field_id].map((file, index) => (
                                            <li key={index}>{file.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                }
                
                if (fieldType === 'select' && options.length > 0) {
                    return (
                        <div key={id + field.field_id} style={{ marginBottom: '1rem' }}>
                            <Autocomplete
                                freeSolo
                                options={options}
                                value={editedParams[field.field_id] || ''}
                                onChange={(event, newValue) => {
                                    handleParamChange(field.field_id, newValue || '');
                                }}
                                onInputChange={(event, newInputValue) => {
                                    handleParamChange(field.field_id, newInputValue);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={field.field_name}
                                        fullWidth
                                    />
                                )}
                            />
                        </div>
                    );
                }
                
                return (
                    <div key={id + field.field_id} style={{ marginBottom: '1rem' }}>
                        <TextField
                            id={id + field.field_id}
                            label={field.field_name}
                            multiline={fieldType === 'textarea'}
                            maxRows={15}
                            fullWidth
                            type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                            value={editedParams[field.field_id] || ''}
                            onChange={(e) => handleParamChange(field.field_id, e.target.value)}
                        />
                    </div>
                );
            })}
            {isSending ? <CircularProgress size={24} /> :
                <Box>
                    <Button onClick={handleSubmit} disabled={isSending}>Записать</Button>
                </Box>}
            {inputError && <p style={{ color: 'red' }}>{inputError}</p>}
            {isUpdateSuccess &&
                <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
                    {successMessage}
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
