import { Button } from "@mui/material";
import useContainer from "../DraggableComponents/useContainer";
import MyTimer from "./Timer";
import { Box } from "@mui/system";

export default function TimersToolbar() {

const { timers, setTimers, sendTimersToServer, addContainer } = useContainer();

if (!timers) return null

function handleUpdateTimers(id, fields) {
  // console.log('Timer updated:', id, fields);
  // console.log(timers)
  const updatedTimers = timers.map(timer =>
    timer.id === id ? { ...timer, ...fields } : timer
  );
  setTimers(updatedTimers);
  sendTimersToServer(updatedTimers);
}

function handleCloseTimer(id) {
  console.log('Timer closed:', id);
  const updatedTimers = timers.filter(timer => timer.id !== id);
  console.log(updatedTimers)
  setTimers(updatedTimers);
  sendTimersToServer(updatedTimers);
}

  if (!timers) return null

  return (
    <Box sx={{ overflowY: 'auto', maxHeight: '80vh'}}>
      <Button onClick={() => addContainer('timersToolbar')}>Add Timer</Button>
      {timers.map((timer) => (
          <MyTimer key={timer.id} id={timer.id} {...timer} handleUpdateTimers={handleUpdateTimers}
           handleCloseTimer={handleCloseTimer} />
        )
      )}
    </Box>
  );
}
