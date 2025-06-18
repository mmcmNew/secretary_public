import useContainer from './useContainer';
import { Box, Button } from '@mui/material';

function MinimizedContainers() {
  const {minimizedContainers,
      handleMinimizeToggle} = useContainer();
  return (
    <Box sx={{ display: 'flex', overflowX: 'auto', padding: 1 }}>
      {minimizedContainers.map((container, index) => (
        <Button
          key={index}
          onClick={() => handleMinimizeToggle(container.id)}
          sx={{ margin: 0.5 }}
        >
          {container.name}
        </Button>
      ))}
    </Box>
  );
}

export default MinimizedContainers;
