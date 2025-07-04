import React from 'react';
import { PropTypes } from 'prop-types';
import { Box, Typography, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Download, Delete } from '@mui/icons-material';
import FileRenderer from '../FileRenderer';

export default function JournalFilesList({ files, journalType, entryId, onFileDelete }) {
    if (!files || files.length === 0) {
        return null;
    }

    const fileUrl = (file, raw = true) => {
        const flag = raw ? '1' : '0';
        return `/api/journals/${journalType}/${entryId}/files/${file.id}?raw=${flag}`;
    };

    const handleDownload = async (file) => {
        try {
            const response = await fetch(fileUrl(file, false));
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.original_filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Ошибка при скачивании файла:', error);
        }
    };

    const handleDelete = async (file) => {
        if (window.confirm(`Удалить файл "${file.original_filename}"?`)) {
            try {
                const response = await fetch(`/api/journals/${journalType}/${entryId}/files/${file.id}`, {
                    method: 'DELETE'
                });
                if (response.ok && onFileDelete) {
                    onFileDelete(file.id);
                }
            } catch (error) {
                console.error('Ошибка при удалении файла:', error);
            }
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
                Прикрепленные файлы:
            </Typography>
            <List dense>
                {files.map((file) => (
                    <ListItem
                        key={file.id}
                        secondaryAction={
                            <Box>
                                <IconButton
                                    edge="end"
                                    aria-label="download"
                                    onClick={() => handleDownload(file)}
                                    size="small"
                                >
                                    <Download />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() => handleDelete(file)}
                                    size="small"
                                    color="error"
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        }
                    >
                        <ListItemText
                            primary={file.original_filename}
                            secondary={`${formatFileSize(file.file_size)} • ${file.field_name}`}
                        />
                        <Box sx={{ mt: 1 }}>
                            <FileRenderer url={fileUrl(file, true)} />
                        </Box>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

JournalFilesList.propTypes = {
    files: PropTypes.array,
    journalType: PropTypes.string.isRequired,
    entryId: PropTypes.number.isRequired,
    onFileDelete: PropTypes.func,
};