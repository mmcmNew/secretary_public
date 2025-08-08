import React, { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

const componentMap = {
  // 'timer': React.lazy(() => import('../Timer/Timer')),
  // 'timersToolbar': React.lazy(() => import('../Timer/TimersToolbar')),
  // 'metronome': React.lazy(() => import('../Metronome')),
  // 'chat': React.lazy(() => import('../Chat')),
  'tasks': React.lazy(() => import('../ToDo/ToDoLayoutUniversal')),
  // 'calendar': React.lazy(() => import('../Calendar/CalendarLayout')),
  // 'memory': React.lazy(() => import('../Memory/Memory')),
  // 'scenario': React.lazy(() => import('../Scenario')),
  // 'secretaryGIF': React.lazy(() => import('../SecretaryGIF')),
  // 'journalEditorDrawer': React.lazy(() => import('../JournalEditor/JournalEditorDrawer')),
  // 'focusMode': React.lazy(() => import('../Antischedule/FocusMode')),
  // 'antiSchedule': React.lazy(() => import('../Antischedule/AntiScheduleWithContext')),
};

const ComponentLoader = ({ type, ...props }) => {
  const Component = componentMap[type];

  if (!Component) {
    console.error(`ComponentLoader: Unknown component type "${type}"`);
    return <div>Unknown component type: {type}</div>;
  }

  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    }>
      <Component {...props} />
    </Suspense>
  );
};

export default ComponentLoader;