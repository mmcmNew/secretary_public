import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import TimerIcon from "@mui/icons-material/Timer";
import MetronomeIcon from "@mui/icons-material/MusicNote";
import ChatIcon from "@mui/icons-material/Chat";
import TableViewIcon from "@mui/icons-material/TableView";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import SdStorageIcon from "@mui/icons-material/SdStorage";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import useContainer from "./useContainer";

const actions = [
    // { icon: <TimerIcon />, name: "Timers", type: "timersToolbar" },
    { icon: <MetronomeIcon />, name: "Metronome", type: "metronome" },
    // { icon: <ChatIcon />, name: "Chat", type: "chatCollapsed" },
    { icon: <ChecklistIcon />, name: "tasks", type: "tasks" },
    { icon: <EditCalendarIcon />, name: "calendar", type: "calendar" },
    { icon: <SdStorageIcon />, name: "Memory", type: "memory" },
    { icon: <AssignmentTurnedInIcon />, name: "Scenario", type: "Scenario" },
    { icon: <TableViewIcon />, name: "SecretaryGIF", type: "SecretaryGIF" },
    { icon: <EditNoteIcon />, name: "JournalEditor", type: "JournalEditorDrawer" },
    { icon: <AccessTimeIcon />, name: "AntiSchedule", type: "AntiSchedule" },
    // { icon: <ChecklistIcon />, name: "ToDo", type: "tasksTree" },
];
function ContainerSpeedDial() {
    const { addContainer, containers } = useContainer();
    const availableActions = actions;

    return (
        <SpeedDial
            ariaLabel="Add Container"
            sx={{ position: "absolute", bottom: 80, left: 16 }}
            icon={<SpeedDialIcon />}
        >
            {availableActions.map((action) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    onClick={() => addContainer(action.type)}
                />
            ))}
        </SpeedDial>
    );
}

export default ContainerSpeedDial;
