import { useEffect, useState } from 'react';
import { Box, Button, Grid, Popover, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import PropTypes from 'prop-types';

const ColorPicker = ({ fieldKey, fieldName, selectedColorProp, onColorChange }) => {
  const [anchorEl, setAnchorEl] = useState(null); // Управляем Popper
  const [open, setOpen] = useState(false); // Состояние для показа Popper
  const [selectedColor, setSelectedColor] = useState(selectedColorProp || '#3788D8');
  const colors = ['#FF0000', '#009900', '#0000FF', '#FF00FF', '#A52A2A', '#000080',
    '#800000', '#808000', '#800080', '#008080', '#FFA500', '#DFD030', '#3788D8'];  // Набор цветов

    useEffect(() => {
      if (selectedColorProp) {
        setSelectedColor(selectedColorProp);
      }
    }, [selectedColorProp]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget); // Устанавливаем якорь для Popper
    setOpen((prev) => !prev); // Переключаем показ Popper
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    onColorChange(fieldKey, color); // Передаем выбранный цвет наверх через onColorChange
    setOpen(false); // Закрываем Popper после выбора
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpen(false);
  };

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
            {colors.map((color) => (
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
