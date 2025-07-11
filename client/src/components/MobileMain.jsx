import { useState, useMemo, useEffect } from "react";
import { Box, IconButton, Paper, Drawer, List, ListItemText, ListItemButton, ListItemIcon } from "@mui/material";
import MicrophoneButton from "./MicrophoneButton";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import MenuIcon from "@mui/icons-material/Menu";
import MetronomeIcon from "@mui/icons-material/MusicNote";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import SdStorageIcon from "@mui/icons-material/SdStorage";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import EditNoteIcon from "@mui/icons-material/EditNote";
import ChatIcon from "@mui/icons-material/Chat";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ComputerIcon from "@mui/icons-material/Computer";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import { containerTypes } from "./DraggableComponents/containerConfig";
import { useMediaQuery } from "@mui/material";
import MiniTimers from "./Timer/MiniTimers";

const componentsTypes = [
    { icon: <MetronomeIcon />, name: "Метроном", type: "metronome" },
    { icon: <ChecklistIcon />, name: "Список задач", type: "tasks" },
    { icon: <EditCalendarIcon />, name: "Календарь", type: "calendar" },
    { icon: <SdStorageIcon />, name: "Память", type: "memory" },
    { icon: <AssignmentTurnedInIcon />, name: "Сценарий", type: "Scenario" },
    { icon: <EditNoteIcon />, name: "Журналы", type: "JournalEditorDrawer" },
    { icon: <ChatIcon />, name: "Chat", type: "chat" },
    { icon: <AccessTimeIcon />, name: "Режим фокусировки", type: "AntiSchedule" },
];

function MainContainerMobile() {
    const [mode, setMode] = useState("light");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentComponent, setCurrentComponent] = useState(null);
    const [currentComponentType, setCurrentComponentType] = useState("chat");
    const isMobileQuery = useMediaQuery("(max-width: 1100px)");

    const [isMobile, setIsMobile] = useState(isMobileQuery);

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
            },
        }),
        [],
    );

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
            }),
        [mode],
    );

    useEffect(() => {
        // console.log('isMobileQuery', isMobileQuery);
        setIsMobile(isMobileQuery);
    }, [isMobileQuery]);

    useEffect(() => {
        handleComponentOpen(currentComponentType);
    }, [isMobile]);

    function handleIsMobileToggle() {
        setIsMobile(!isMobile);
    }

    function createComponent(type) {
        if (type === "tasks" && isMobile) {
            type = "tasksMobile"; // Если мобильная версия, заменяем тип
        }

        const componentConfig = containerTypes[type];

        if (!componentConfig) {
            console.error(`Unknown container type: ${type}`);
            return null;
        }

        const Component = componentConfig.content?.type;
        return <Component />;
    }

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleComponentOpen = (componentType) => {
        const newComponent = createComponent(componentType);
        setCurrentComponent(newComponent);
        setDrawerOpen(false);
        setCurrentComponentType(componentType);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            {/* Верхняя панель */}
            <Paper
                sx={{
                    width: "100%",
                    height: "60px",
                    position: "relative",
                    margin: "0px",
                    px: 1,
                    display: "flex",
                    justifyContent: "end",
                    alignItems: "center",
                }}
            >
                <IconButton onClick={handleDrawerToggle} color="inherit" sx={{ position: "absolute", left: "10px" }}>
                    <MenuIcon />
                </IconButton>

                <MiniTimers />
            </Paper>

            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={handleDrawerToggle}
                sx={{
                    width: "400px",
                }}
                PaperProps={{
                    sx: {
                        width: "inherit",
                    },
                }}
            >
                <List>
                    {componentsTypes.map((component, index) => (
                        <ListItemButton
                            key={`component${index}`}
                            onClick={() => handleComponentOpen(component.type)}
                            selected={currentComponentType === component.type}
                            sx={{ height: "70px", borderBottom: "1px solid #ccc" }}
                        >
                            <ListItemIcon>{component.icon}</ListItemIcon>
                            <ListItemText primary={component.name} />
                        </ListItemButton>
                    ))}
                </List>
                <Box
                    sx={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        width: "100%",
                        justifyContent: "space-between",
                        display: "flex",
                        padding: "10px",
                    }}
                >
                    <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                        {theme.palette.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    <IconButton onClick={handleIsMobileToggle} color="inherit">
                        {!isMobile ? <SmartphoneIcon /> : <ComputerIcon />}
                    </IconButton>
                    v.1.3
                </Box>
            </Drawer>

            <Box
                sx={{
                    width: "98vw",
                    height: "91vh",
                    position: "relative",
                    margin: "0px",
                    justifyContent: "center",
                    alignItems: "center",
                    display: "flex",
                }}
            >
                {currentComponent ? (
                    <Box
                        sx={{
                            height: "100%",
                            position: "relative",
                            p: 2,
                            overflowY: "auto",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        {currentComponent}
                    </Box>
                ) : (
                    <Box sx={{ textAlign: "center", mt: 4 }}>Добро пожаловать!</Box>
                )}
                {currentComponentType !== "chat" && <MicrophoneButton />}
            </Box>
        </ThemeProvider>
    );
}

export default MainContainerMobile;
