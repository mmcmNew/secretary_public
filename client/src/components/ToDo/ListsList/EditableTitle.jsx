import { TextField } from '@mui/material';
import PropTypes from 'prop-types';

export default function EditableTitle({
  value,
  onChange,
  onKeyDown,
  onBlur,
  inputRef,
  autoFocus = false
}) {
  return (
    <TextField
      size="small"
      sx={{ p: 0, m: 0, width: '100%' }}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      inputRef={inputRef}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
    />
  );
}

EditableTitle.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
  onBlur: PropTypes.func,
  inputRef: PropTypes.object,
  autoFocus: PropTypes.bool
};
