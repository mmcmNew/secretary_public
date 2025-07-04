import React from 'react';
import PropTypes from 'prop-types';
import { Box, Checkbox, IconButton, Typography, CircularProgress, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import MarkdownEditor from './MarkdownEditor';
import MDNotionEditor from './MDNotionEditor';
import FileRenderer from '../FileRenderer';

function RecordEditor({
  editor,
  index,
  tableSurvey,
  onCheck,
  onSave,
  onAIEnhance,
  onGenerateImage,
  onPostToSocials,
  dispatchEditors
}) {
  const record = editor.record || {};
  const fieldRefs = editor.ref;
  const fieldsOrder = tableSurvey?.fields?.map(f => f.field_id) || [];
  const fields = (fieldsOrder.length ? fieldsOrder : Object.keys(record));

  const getFieldName = (field) => {
    const found = tableSurvey?.fields?.find(fld => fld.field_id === field);
    return found ? found.field_name : field;
  };

  const fileUrl = (file) => `/api/journals/${tableSurvey?.table_name}/${record.id}/files/${file.id}?raw=1`;
  const getFilesForField = (fieldId) => {
    return (record.files || []).filter(f => f.field_name === fieldId);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, alignItems: 'stretch', marginBottom: 0, background: 'transparent' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        backgroundColor: 'background.paper',
        padding: 0,
        borderBottom: `2px solid  '#ccc'`,
        boxShadow: '0 2px 8px -5px rgba(0,0,0,0.3)',
        marginBottom: '-2px',
        transition: 'border-color 0.5s ease',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Checkbox
            checked={editor.checked}
            onChange={(e) => onCheck(index, e.target.checked)}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            variant="contained"
            disabled={editor.saveStatus !== 'idle'}
            onClick={() => onSave(index)}
            sx={{
              '&:hover': {
                backgroundColor: editor.hasUnsavedChanges ? '#c8e6c9' : undefined
              },
              '& .MuiSvgIcon-root': {
                color: editor.hasUnsavedChanges ? '#4caf50' : undefined,
                animation: editor.hasUnsavedChanges ? 'pulseIcon 1.2s infinite' : undefined,
              },
              '@keyframes pulseIcon': {
                '0%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 #4caf50)' },
                '70%': { transform: 'scale(1.15)', filter: 'drop-shadow(0 0 8px #4caf50)' },
                '100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 #4caf50)' },
              },
            }}
          >
            {editor.saveStatus === 'saving' ? (
              <CircularProgress size={24} />
            ) : editor.saveStatus === 'success' ? (
              <CheckIcon />
            ) : (
              <SaveIcon />
            )}
          </IconButton>

          <IconButton
            variant="contained"
            onClick={() => onAIEnhance(index)}
            disabled={editor.aiResponseStatus === 'loading'}
          >
            {editor.aiResponseStatus === 'loading' ? (
              <CircularProgress size={24} />
            ) : editor.aiResponseStatus === 'success' ? (
              <CheckIcon />
            ) : (
              <AutoFixHighIcon />
            )}
          </IconButton>

          <IconButton
            variant="contained"
            disabled={editor.imageGenerateStatus === 'loading'}
            onClick={() => onGenerateImage(index)}
          >
            {editor.imageGenerateStatus === 'loading' ? (
              <CircularProgress size={24} />
            ) : (
              <ImageSearchIcon />
            )}
          </IconButton>

          <IconButton variant="contained">
            <AttachFileIcon />
          </IconButton>

          <IconButton
            variant="contained"
            onClick={() => onPostToSocials(index)}
            disabled={editor.sendToSocialsStatus === 'loading'}
          >
            {editor.sendToSocialsStatus === 'loading' ? (
              <CircularProgress size={24} />
            ) : editor.sendToSocialsStatus === 'success' ? (
              <CheckIcon />
            ) : editor.sendToSocialsStatus === 'fail' ? (
              <ReportProblemIcon />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </Box>
      </Box>

      <Box sx={{
        display: 'flex',
        gap: 2,
        borderBottom: `2px solid ${editor.hasUnsavedChanges ? '#f44336' : '#ccc'}`,
        background: 'white',
        transition: 'border-color 0.5s ease',
      }}>
        <Box sx={{ flex: editor.aiResponse ? 1 : '100%', p: 1 }}>
          {fields.map((field) => {
            if (field === 'files') return null; // скрываем старое поле
            if (field === 'id') {
              return (
                <Box key={field} sx={{ mb: 1 }}>
                  <Typography variant="h6">id Записи: {record[field]}</Typography>
                </Box>
              );
            }

            const fieldInfo = tableSurvey?.fields?.find(fld => fld.field_id === field);
            const isFileField = fieldInfo?.type === 'file';
            const filesForField = isFileField ? getFilesForField(fieldInfo.field_id) : [];

            return (
              <Box key={field} sx={{ mb: 1 }}>
                <Typography variant="h6">{getFieldName(field)}</Typography>
                {isFileField ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filesForField.map((f) => (
                      <FileRenderer key={f.id} url={fileUrl(f)} />
                    ))}
                  </Box>
                ) : (
                  <MarkdownEditor
                    ref={fieldRefs[field]}
                    initialMarkdown={record[field] || ''}
                    onChange={() => dispatchEditors({ type: 'SET_HAS_UNSAVED', index })}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {editor.aiResponse && (
          <Box sx={{ width: '50%', height: '100%', position: 'relative' }}>
            <IconButton
              onClick={() => dispatchEditors({ type: 'SET_AI_RESPONSE', index, value: null })}
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
            >
              <CloseIcon />
            </IconButton>
            <MDNotionEditor readOnly initialMarkdown={editor.aiResponse} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

RecordEditor.propTypes = {
  editor: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  tableSurvey: PropTypes.object,
  onCheck: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onAIEnhance: PropTypes.func.isRequired,
  onGenerateImage: PropTypes.func.isRequired,
  onPostToSocials: PropTypes.func.isRequired,
  dispatchEditors: PropTypes.func.isRequired,
};

export default RecordEditor;
