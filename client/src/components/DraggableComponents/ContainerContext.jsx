import { createContext, useState, useEffect, useReducer, useContext } from "react";
import PropTypes from "prop-types";
import { containerTypes } from "./containerConfig";

const ContainerContext = createContext();


const ContainerProvider = ({ children }) => {
    const [dashboardData, setDashboardData] = useState({ id: 0, name: "dashboard 1" });
    const [containers, setContainers] = useState([]);
    const [timers, setTimers] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [minimizedContainers, setMinimizedContainers] = useState([]);
    const [themeMode, setThemeMode] = useState("light");
    const [updates, setUpdates] = useState([]);
    const [isSecretarySpeak, setIsSecretarySpeak] = useState(false);
    const [windowOrder, setWindowOrder] = useState([]);
    const [draggingContainer, setDraggingContainer] = useState(null);

    function generateUniqueId() {
        const timePart = Date.now().toString();
        const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
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
        return newContainer;
    }

    function addContainer(type, props = {}) {
        if (containers.length >= 20) {
            return;
        }

        const newId = generateUniqueId();

        if (type === "timersToolbar") {
            if (Object.keys(props).length === 0) {
                props = { isRunningProp: false, initialTimeProp: 1 };
            }
            const newTimers = [...timers, { id: newId, ...props }];
            setTimers(newTimers);
            sendTimersToServer(newTimers);
            return;
        }

        const newContainer = createComponentFromType(type, newId, { containerId: newId, ...props });

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

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await fetch(`/dashboard/last`);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                setDashboardData({ id: data.id, name: data.name });

                    const loadedTimers = data.timers || [];
                    setTimers(loadedTimers);
                    const loadedContainers = (data.containers || []).map((containerData) =>
                        createComponentFromType(containerData.type, containerData.id, containerData),
                    );

                    setContainers(loadedContainers);
                    setThemeMode(data.themeMode || "light");
                } catch (error) {
                    console.log("Ошибка загрузки dashboard, используем интерфейс по умолчанию:", error.message);
                    setDashboardData({ id: 0, name: "dashboard 1" });
                    setContainers([]);
                    setTimers([]);
                    setThemeMode("light");
                }
            };

        fetchDashboard();
    }, []);

    const sendContainersToServer = async () => {
        // console.log('[ContainerContext] sendContainersToServer called');
        // отправляем все контейнеры кроме таймеров
        const sendingContainers = containers.filter((container) => container.type !== "timersToolbar");
        try {
            const response = await fetch("/dashboard", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    dashboard_data: dashboardData,
                    containers: sendingContainers.map(c => {
                        const { componentType, content, componentProps, ...serializableContainer } = c;
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
        setContainers((prevContainers) =>
            prevContainers.map((container) => {
                if (container.id === id) {
                    const newProps = { ...container.componentProps, ...updatedData };
                    const updatedContainer = { ...container, ...updatedData, componentProps: newProps };
                    return updatedContainer;
                }
                return container;
            }),
        );
    };

    function sendTimersToServer(updatedTimers) {
        // отправляем таймеры на сервер
        fetch("/post_timers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ dashboardId: dashboardData.id, timers: updatedTimers }),
        })
            .then((response) => response.json())
            .then((data) => console.log("Timers saved:", data.message))
            .catch((error) => console.error("Failed to save timers:", error));
    }

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
                updates,
                setUpdates,
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
                draggingContainer,
                setDraggingContainer,
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
