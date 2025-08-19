import { Box, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateContainer } from '../../store/dashboardSlice';

function MinimizedContainers() {
  const dispatch = useDispatch();
  const minimizedContainers = useSelector(state => state.dashboard?.containers) || [];
  console.log('MinimizedContainers: minimizedContainers=', minimizedContainers);


  return (
    <Box sx={{ display: 'flex', overflowX: 'auto', padding: 1 }}>
      {minimizedContainers.map((container, index) => (
        <Button
          key={index}
          onClick={() => dispatch(updateContainer({ id: container.id, data: { isMinimized: !container.isMinimized } }))}
          sx={{ margin: 0.5 }}
        >
          {container?.name}
        </Button>
      ))}
    </Box>
  );
}

export default MinimizedContainers;
