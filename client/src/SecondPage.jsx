// src/SecondPage.js
import { green } from '@mui/material/colors';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import useContainer from './components/DraggableComponents/useContainer';
import DraggableContainer from './components/DraggableComponents/DraggableContainer';
import MicrophoneButton from './components/MicrophoneButton';

const redTheme = createTheme({
  palette: {
    primary: {
      main: green[500],
    },
  },
});

const SecondPage = () => {
    const { containers } = useContainer()
  return (
    <ThemeProvider theme={redTheme}>
      <Box sx={{ width: '100%', height: '100vh', backgroundColor: 'primary.main', p: 0 }}>
        <Typography variant="h1" color="primary">Second Page</Typography>
        {containers.map(container => (
            !container.isMinimized && (
            <DraggableContainer
                key={container.id}
                containerData={container}
            />
            )
        ))}
      </Box>
      <MicrophoneButton />
    </ThemeProvider>
  );
};

export default SecondPage;
