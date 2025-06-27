import { useEffect, useState, useCallback } from 'react';
import { Box, Button, Grid, Popover, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import PropTypes from 'prop-types';

const COLORS = [
  '#FF0000',
  '#009900',
  '#0000FF',
  '#FF00FF',
  '#A52A2A',
  '#000080',
  '#800000',
  '#808000',
  '#800080',
  '#008080',
  '#FFA500',
  '#DFD030',
  '#3788D8',
];
const DEFAULT_COLOR = '#3788D8';

const ColorPicker = ({ fieldKey, fieldName, selectedColorProp, onColorChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedColor, setSelectedColor] = useState(selectedColorProp || DEFAULT_COLOR);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (selectedColorProp) {
      setSelectedColor(selectedColorProp);
    }
  }, [selectedColorProp]);

  const handleClick = useCallback((event) => {
    setAnchorEl((prev) => (prev ? null : event.currentTarget));
  }, []);

  const handleColorSelect = useCallback((color) => {
    setSelectedColor(color);
    onColorChange(fieldKey, color);
    setAnchorEl(null);
  }, [fieldKey, onColorChange]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Кнопка с кружком выбранного цвета */}
      <Button
        variant="outlined"
        onClick={handleClick} // Показываем Popper при клике на кнопку
        sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'flex-start',
            border: '1px solid', borderColor: 'grey.400' , pl: 0.7,
        }}
      >
        <CircleIcon sx={{ color: selectedColor, fontSize: 24, ml: 0 }} /> {/* Кружок выбранного цвета */}
        {<Typography variant="body1" sx={{ ml: 1, textTransform: 'none', color: 'grey' }}  >
            {fieldName}
        </Typography>}
      </Button>

    <Popover
    id={fieldKey}
    open={open}
    anchorEl={anchorEl}
    onClose={handleClose}
    anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
    }} >
        <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 3 }}>
        {/* Сетка с цветами */}
        <Grid container spacing={1} sx={{ width: 150 }}>
            {COLORS.map((color) => (
            <Grid item xs={3} key={color}>
                <Button
                onClick={() => handleColorSelect(color)}
                sx={{ minWidth: 0, padding: 0, borderRadius: '50%', backgroundColor: color, width: 24, height: 24 }}
                />
            </Grid>
            ))}
        </Grid>
        </Box>
      </Popover>
    </Box>
  );
};


export default ColorPicker;

ColorPicker.propTypes = {
    fieldKey: PropTypes.string,
  fieldName: PropTypes.string,
  selectedColorProp: PropTypes.string,
  onColorChange: PropTypes.func,
};
