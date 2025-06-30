import { createContext, useState, useEffect, useReducer } from "react";
import PropTypes from "prop-types";
import { containerTypes } from "./containerConfig";

const ContainerContext = createContext();

const ContainerProvider = ({ children }) => {
    const dashboard_id = 0;
    const [dashboardData, setDashboardData] = useState({ id: 0, name: "dashboard 1" });
    const [containers, setContainers] = useState([]);
    const [timers, setTimers] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [minimizedContainers, setMinimizedContainers] = useState([]);
    const [themeMode, setThemeMode] = useState("light");
    const [updates, setUpdates] = useState([]);
    const [isSecretarySpeak, setIsSecretarySpeak] = useState(false);
    const [windowOrder, setWindowOrder] = useState([]);

    function generateUniqueId() {
        const timePart = Date.now().toString();
        const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // Генерация 4 случайных чисел
        return timePart + randomPart;
    }

    function createComponentFromType(type, id, containerData) {
        const componentConfig = containerTypes[type];
        if (!componentConfig) {
            console.error(`Unknown container type: ${type}`);
            return null;
        }
        const Component = componentConfig.content?.type;

        const props = {
            ...componentConfig.content?.props,
            containerId: id,
            ...containerData.content?.props,
            ...containerData,
        };

        const newContainer = {
            ...containerData,
            id,
            type,
            name: containerData.name || componentConfig.name,
            position: containerData.position || componentConfig.position,
            size: containerData.size || componentConfig.size,
            maxSize: componentConfig.maxSize,
            minSize: componentConfig.minSize,
            isLockAspectRatio: containerData.isLockAspectRatio ?? componentConfig.isLockAspectRatio,
            isResizable: componentConfig.isResizable,
            isDisableDragging: componentConfig.isDisableDragging,
            isLocked: containerData.isLocked ?? componentConfig.isLocked,
            isMinimized: containerData.isMinimized ?? componentConfig.isMinimized,
            componentType: Component,
            componentProps: props,
            content: !Component ? componentConfig.content : null,
        };
        // console.log(newContainer)
        return newContainer;
    }

    function addContainer(type, props = {}) {
        if (containers.length >= 20) {
            console.log("Maximum number of containers (20) reached");
            return;
        }

        const newId = generateUniqueId();

        if (type === "timersToolbar") {
            // console.log(props)
            if (Object.keys(props).length === 0) {
                // Check if props is an empty object
                console.log("Props are empty");
                props = { isRunningProp: false, initialTimeProp: 1 };
            }
            // console.log(props)
            // console.log(type, newId, { containerId: newId, ...props })
            // console.log('timers:', timers)
            const newTimers = [...timers, { id: newId, ...props }];
            // console.log('newTimers:', newTimers)
            setTimers(newTimers);
            sendTimersToServer(newTimers);
            // console.log(newTimers)
            return;
        }

        // console.log(type, newId, { containerId: newId, ...props })
        const newContainer = createComponentFromType(type, newId, { containerId: newId, ...props });
        // console.log(newContainer)

        if (newContainer) {
            setContainers((prevContainers) => {
                const updatedContainers = [...prevContainers, newContainer];
                return updatedContainers;
            });
            setWindowOrder((prevOrder) => {
                const newOrder = prevOrder.filter((windowId) => windowId !== newId);
                return [...newOrder, newId];
            });
        }
    }

    const handleActive = (id) => {
        setActiveId(id);
        setWindowOrder((prevOrder) => {
            const newOrder = prevOrder.filter((windowId) => windowId !== id);
            return [...newOrder, id];
        });
    };

    const handleClose = (id) => {
        setContainers(containers.filter((container) => container.id !== id));
        setMinimizedContainers(minimizedContainers.filter((container) => container.id !== id));
        setWindowOrder((prevOrder) => prevOrder.filter((windowId) => windowId !== id));
    };

    const handleMinimizeToggle = (id) => {
        setActiveId(id);
        setContainers((prevContainers) => {
            const updatedContainers = prevContainers.map((container) =>
                container.id === id ? { ...container, isMinimized: !container.isMinimized } : container,
            );
            return updatedContainers;
        });
        setWindowOrder((prevOrder) => {
            const newOrder = prevOrder.filter((windowId) => windowId !== id);
            return [...newOrder, id];
        });
    };

    // загрузка контейнеров с сервера
    useEffect(() => {
        console.log("ContainerProvider: старт загрузки dashboard");
        const fetchDashboard = async () => {
            try {
                const response = await fetch(`/dashboard/${dashboard_id}`);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                // console.log("ContainerProvider: dashboard загружен", data, Date.now() - (window.mainStart || 0), "мс с начала main.jsx");
                setDashboardData({ id: data.id, name: data.name });


                const loadedTimers = data.timers || null;
                setTimers(loadedTimers);
                const loadedContainers = data.containers.map((containerData) =>
                    createComponentFromType(containerData.type, containerData.id, containerData),
                );

                setContainers(loadedContainers);
                // console.log("ContainerProvider: контейнеры установлены", loadedContainers, Date.now() - (window.mainStart || 0), "мс с начала main.jsx");
                setThemeMode(data.themeMode);
            } catch (error) {
                console.error("Failed to fetch dashboard from server:", error);
            }
        };

        fetchDashboard();
    }, [dashboard_id]);

    const sendContainersToServer = async () => {
        // console.log('[ContainerContext] sendContainersToServer called');
        // отправляем все контейнеры кроме таймеров
        const sendingContainers = containers.filter((container) => container.type !== "timersToolbar");
        // console.log('[ContainerContext] Containers to send:', sendingContainers);
        try {
            const response = await fetch("/dashboard", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    dashboard_data: dashboardData,
                    containers: sendingContainers.map(c => {
                        const { componentType, content, componentProps, ...serializableContainer } = c;
                        // console.log('[ContainerContext] Container props to send:', serializableContainer, 'componentProps:', componentProps);
                        return serializableContainer;
                    }),
                    themeMode: themeMode,
                    timers: timers
                }),
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            console.log("Dashboard сохранен");
        } catch (error) {
            console.error("Failed to send containers to server:", error);
        }
    };

    useEffect(() => {
        // setMinimizedContainers(containers.filter(container => container.isMinimized));
        setMinimizedContainers(containers); // сделал временно чтоб все контейнеры всегда отображались на панели
    }, [containers]);

    const handleLock = (id) => {
        setContainers((prevContainers) => {
            const updatedContainers = prevContainers.map((container) =>
                container.id === id ? { ...container, isLocked: !container.isLocked } : container,
            );
            return updatedContainers;
        });
    };

    const handleContainerResize = (id, newSize = {}, newPosition = {}) => {
        // console.log("Container resized:", id, newSize, newPosition);

        setContainers(
            containers.map((container) =>
                container.id === id
                    ? {
                          ...container,
                          size: { ...container.size, ...newSize }, // Обновляем только переданные свойства size
                          position: { ...container.position, ...newPosition }, // Обновляем только переданные свойства position
                      }
                    : container,
            ),
        );
    };

    const handleContainerPosition = (id, position) => {
        setContainers(containers.map((container) => (container.id === id ? { ...container, position } : container)));
    };

    // Функция для обновления данных содержимого контейнера
    const handleUpdateContent = (id, updatedData) => {
        console.log('[ContainerContext] handleUpdateContent called:', id, updatedData);
        setContainers((prevContainers) =>
            prevContainers.map((container) => {
                if (container.id === id) {
                    const newProps = { ...container.componentProps, ...updatedData };
                    const updatedContainer = { ...container, ...updatedData, componentProps: newProps };
                    // console.log('[ContainerContext] Updated container:', updatedContainer);
                    return updatedContainer;
                }
                return container;
            }),
        );
    };

    //audio context
    const audioReducer = (state, action) => {
        switch (action.type) {
            case "SET_QUEUE":
                return { ...state, queue: action.queue };
            case "PLAY":
                return { ...state, isPlaying: true };
            case "PAUSE":
                return { ...state, isPlaying: false };
            case "NEXT_TRACK":
                return {
                    ...state,
                    currentTrackIndex: (state.currentTrackIndex + 1) % state.queue.length,
                    isPlaying: true,
                };
            default:
                return state;
        }
    };

    const initialState = {
        queue: ["track1.mp3", "track2.mp3", "track3.mp3"],
        currentTrackIndex: 0,
        isPlaying: false,
    };

    const [state, dispatch] = useReducer(audioReducer, initialState);

    function sendTimersToServer(updatedTimers) {
        // отправляем таймеры на сервер
        // console.log(updatedTimers);
        fetch("/post_timers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ dashboardId: 0, timers: updatedTimers }),
        })
            .then((response) => response.json())
            .then((data) => console.log("Timers saved:", data.message))
            .catch((error) => console.error("Failed to save timers:", error));
    }

    useEffect(() => {
        // Логика для воспроизведения или паузы аудио в зависимости от состояния
        if (state.queue.length > 0) {
            const audio = new Audio(state.queue[state.currentTrackIndex]);
            state.isPlaying ? audio.play() : audio.pause();
        }
    }, [state.queue, state.currentTrackIndex, state.isPlaying]);

    return (
        <ContainerContext.Provider
            value={{
                windowOrder,
                dashboardData,
                containers,
                activeId,
                minimizedContainers,
                timers,
                setTimers,
                sendTimersToServer,
                themeMode,
                state,
                updates,
                setUpdates,
                dispatch,
                setThemeMode,
                addContainer,
                handleActive,
                handleClose,
                handleMinimizeToggle,
                sendContainersToServer,
                handleLock,
                handleContainerResize,
                handleContainerPosition,
                handleUpdateContent,
                isSecretarySpeak,
                setIsSecretarySpeak,
                createComponentFromType,
            }}
        >
            {children}
        </ContainerContext.Provider>
    );
};

export { ContainerProvider, ContainerContext };

ContainerProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
