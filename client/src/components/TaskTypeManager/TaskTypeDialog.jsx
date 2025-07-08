import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import ColorPicker from '../ColorPicker.jsx';

export default function TaskTypeDialog({ open, onClose, data, onChange, onSave, title }) {
  const handleChange = (field) => (e) => onChange(field, e.target.value);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Название" value={data.name} onChange={handleChange('name')} required />
          <ColorPicker fieldKey="color" fieldName="Цвет" selectedColorProp={data.color} onColorChange={(_, c) => onChange('color', c)} />
          <TextField label="Описание" value={data.description} onChange={handleChange('description')} multiline rows={3} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onSave(data)}>Сохранить</Button>
        <Button onClick={onClose}>Отмена</Button>
      </DialogActions>
    </Dialog>
  );
}

TaskTypeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  title: PropTypes.string,
};

TaskTypeDialog.defaultProps = {
  title: 'Создать тип задачи',
};
