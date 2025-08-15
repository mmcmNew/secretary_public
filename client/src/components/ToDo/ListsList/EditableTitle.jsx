import { TextField } from '@mui/material';
import PropTypes from 'prop-types';

export default function EditableTitle({ value, onChange, onKeyDown, onBlur, inputRef, sx, ...props }) {
  return (
    <TextField
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      inputRef={inputRef}
      variant="standard"
      size="small"
      sx={{ ...sx, '& .MuiInputBase-input': { padding: 0 } }} // Borderless
      {...props}
    />
  );
}

EditableTitle.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  sx: PropTypes.object,
  onKeyDown: PropTypes.func,
  onBlur: PropTypes.func,
  inputRef: PropTypes.object,
  autoFocus: PropTypes.bool
};
