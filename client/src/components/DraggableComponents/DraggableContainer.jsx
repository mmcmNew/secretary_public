import React from 'react';
import PropTypes from 'prop-types';
import { Rnd } from 'react-rnd';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useDispatch, useSelector } from 'react-redux';
import { removeContainer, updateContainer } from '../../store/dashboardSlice';
import { setActiveId, setDraggingContainer } from '../../store/uiSlice';

import ComponentLoader from './ComponentLoader';

function DraggableContainer({ containerData }) {
  const dispatch = useDispatch();
  const { themeMode, windowOrder } = useSelector(state => state.ui);

  const {
    id, size, position, isLocked, isResizable,
    isDisableDragging, isMinimized, maxSize, minSize,
    name, isLockAspectRatio,
    componentProps, type
  } = containerData;

  const handleActive = () => dispatch(setActiveId(id));
  const handleClose = () => dispatch(removeContainer(id));
  const handleMinimizeToggle = () => dispatch(updateContainer({ id, data: { isMinimized: !isMinimized } }));
  const handleLock = () => dispatch(updateContainer({ id, data: { isLocked: !isLocked } }));
  const handleContainerResize = (newSize, newPosition) => dispatch(updateContainer({ id, data: { size: newSize, position: newPosition } }));
  const handleContainerPosition = (newPosition) => dispatch(updateContainer({ id, data: { position: newPosition } }));

  return (
    <Rnd
      id={id} // добавляем ID для контейнера
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStart={() => dispatch(setDraggingContainer(id))}
      onDragStop={(e, d) => {
        handleContainerPosition({ x: d.x, y: d.y });
        dispatch(setDraggingContainer(null));
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        handleContainerResize({ width: ref.offsetWidth, height: ref.offsetHeight }, position);
      }}
      enableResizing={!isLocked && isResizable}
      disableDragging={isLocked || isDisableDragging}
      style={{ display: isMinimized ? 'none' : 'block',
              zIndex: windowOrder.indexOf(id) + 1,
              borderRadius: 8, border: '1px solid' }}
      bounds="parent"
      onMouseDown={handleActive}
      lockAspectRatio={isLockAspectRatio}
      dragHandleClassName="drag-handle"
      maxWidth={maxSize?.width}
      maxHeight={maxSize?.height}
      minWidth={minSize?.width || 150}
      minHeight={minSize?.height || 150}
    >
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
        }}
      >
        <Paper
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 1,
            backgroundColor: themeMode === 'dark'? '#292929': 'initial',
          }}
        >
          <Box
            className="drag-handle"
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: 1,
              cursor: 'move',
            }}
          >
            <Typography variant="body2">{name}</Typography>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <IconButton size="small" onClick={handleMinimizeToggle}>
              <ExpandLessIcon />
            </IconButton>
            <IconButton size="small" onClick={handleLock}>
              {isLocked ? <LockIcon /> : <LockOpenIcon />}
            </IconButton>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Paper>
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        >
          <ComponentLoader type={type} {...componentProps} />
        </Box>
      </Paper>
    </Rnd>
  );
}

DraggableContainer.propTypes = {
  containerData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    size: PropTypes.shape({
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }).isRequired,
    position: PropTypes.shape({
      x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      y: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }).isRequired,
    isLocked: PropTypes.bool,
    isResizable: PropTypes.bool,
    isDisableDragging: PropTypes.bool,
    isMinimized: PropTypes.bool,
    maxSize: PropTypes.shape({
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    minSize: PropTypes.shape({
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    name: PropTypes.string,
    isLockAspectRatio: PropTypes.bool,
    componentProps: PropTypes.object,
    type: PropTypes.string.isRequired,
  }).isRequired,
};

export default DraggableContainer;
