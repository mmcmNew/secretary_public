import PropTypes from 'prop-types';
import { Rnd } from 'react-rnd';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import useContainer from './useContainer';
import { useEffect } from 'react';

function DraggableContainer({ containerData }) {
  const {
    handleActive,
    handleClose,
    handleMinimizeToggle,
    handleLock,
    handleContainerResize,
    handleContainerPosition,
    themeMode,
    windowOrder,
    setDraggingContainer,
  } = useContainer();

  const {
    id, size, position, isLocked, isResizable,
    isDisableDragging, isMinimized, maxSize, minSize,
    name, content, isLockAspectRatio,
    componentType: Component, componentProps
  } = containerData;

  useEffect(() => () => setDraggingContainer((prev) => (prev === id ? null : prev)), [id, setDraggingContainer]);

  return (
    <Rnd
      id={id} // добавляем ID для контейнера
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStart={() => setDraggingContainer(id)}
      onDragStop={(e, d) => {
        handleContainerPosition(id, { x: d.x, y: d.y });
        setDraggingContainer(null);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        handleContainerResize(id, { width: ref.offsetWidth, height: ref.offsetHeight }, position);
      }}
      enableResizing={!isLocked && isResizable}
      disableDragging={isLocked || isDisableDragging}
      style={{ display: isMinimized ? 'none' : 'block',
              zIndex: windowOrder.indexOf(id) + 1,
              borderRadius: 8, border: '1px solid' }}
      bounds="parent"
      onMouseDown={() => handleActive(id)}
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
            <IconButton size="small" onClick={() => handleMinimizeToggle(id)}>
              <ExpandLessIcon />
            </IconButton>
            <IconButton size="small" onClick={() => handleLock(id)}>
              {isLocked ? <LockIcon /> : <LockOpenIcon />}
            </IconButton>
            <IconButton size="small" onClick={() => handleClose(id)}>
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
          {Component ? <Component {...componentProps} /> : content}
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
    content: PropTypes.node,
    isLockAspectRatio: PropTypes.bool,
    componentType: PropTypes.elementType,
    componentProps: PropTypes.object,
  }).isRequired,
};

export default DraggableContainer;
