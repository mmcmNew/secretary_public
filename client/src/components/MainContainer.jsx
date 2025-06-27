import { useNavigate } from 'react-router-dom';
import { createContext, useEffect, useMemo, useState, memo, useCallback } from 'react';
import { Box, Button, IconButton, Paper } from '@mui/material';
import DraggableContainer from './DraggableComponents/DraggableContainer';
import ContainerSpeedDial from './DraggableComponents/ContainerSpeedDial';
import MinimizedContainers from './DraggableComponents/MinimizedContainers';
import MicrophoneButton from "./MicrophoneButton";
import useContainer from './DraggableComponents/useContainer';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ChatAccordion from './ChatAccordion';
import MiniTimers from './Timer/MiniTimers';
// import MiniScenario from './Scenario/MiniScenario';
import SmartphoneIcon from '@mui/icons-material/Smartphone';

// import AudioPlayer from './AudioPlayer';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

// Memoize the header component to prevent unnecessary re-renders
const Header = memo(({ mode, colorMode, theme, onNavigateMobile, onSave }) => (
  <Paper sx={{
    width: '100%',
    height: '60px',
    position: 'relative',
    margin: '0px',
    px: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <Box sx={{maxWidth: '40vw'}}>
      <MinimizedContainers />
    </Box>
    <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
      <MiniTimers />
      {/* <MiniScenario /> */}
      <IconButton onClick={colorMode.toggleColorMode} color="inherit">
        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
      <IconButton onClick={onNavigateMobile} color="inherit">
        <SmartphoneIcon />
      </IconButton>
      <Button onClick={onSave}>Save</Button>
    </Box>
  </Paper>
));

// Memoize the main content component
const MainContent = memo(({ containers }) => (
  <Box sx={{ width: '99vw', height: '92vh', position: 'relative', margin: '0px' }}>
    {containers.map(container => (
      !container.isMinimized && (
        <DraggableContainer
          key={container.id}
          containerData={container}
        />
      )
    ))}
    <ContainerSpeedDial />
    <MicrophoneButton />
    {/* <AudioPlayer /> */}
  </Box>
));

function MainContainer() {
  const {
    containers,
    sendContainersToServer,
    themeMode,
    setThemeMode,
  } = useContainer();
  const navigate = useNavigate();

  const [mode, setMode] = useState(themeMode);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        setThemeMode(newMode);
      },
    }),
    [mode, setThemeMode],
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.mainStart) {
      console.log("MainContainer.jsx: первый рендер завершён, время:", Date.now() - window.mainStart, "мс");
    }
  }, []);

  const theme = useMemo(
    () => createTheme({
      palette: {
        mode,
      },
    }),
    [mode],
  );

  const handleNavigateMobile = useCallback(() => {
    navigate('/mobile');
  }, [navigate]);

  const handleSave = useCallback(() => {
    sendContainersToServer();
  }, [sendContainersToServer]);

  // if (process.env.NODE_ENV === 'development') {
  //   console.log('[MainContainer] Rendering with mode:', mode);
  // }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header
          mode={mode}
          colorMode={colorMode}
          theme={theme}
          onNavigateMobile={handleNavigateMobile}
          onSave={handleSave}
        />
        <MainContent containers={containers} />
        <ChatAccordion />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default memo(MainContainer);
