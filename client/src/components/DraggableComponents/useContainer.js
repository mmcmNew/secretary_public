import { useSelector, useDispatch } from 'react-redux';
import {
  addContainer as addContainerAction,
  updateContainer as updateContainerAction,
  removeContainer as removeContainerAction,
  setContainers as setContainersAction
} from '../../store/dashboardSlice';
import {
  setActiveId as setActiveIdAction,
  setWindowOrder as setWindowOrderAction,
  setIsSecretarySpeak as setIsSecretarySpeakAction,
  setDraggingContainer as setDraggingContainerAction
} from '../../store/uiSlice';
import {
  setTimers as setTimersAction,
  addTimer as addTimerAction,
  removeTimer as removeTimerAction,
  updateTimer as updateTimerAction,
  saveTimers as saveTimersAction
} from '../../store/timersSlice';
import { useSaveDashboardMutation } from '../../store/api/dashboardApi';

/**
 * Хук для работы с контейнерами через Redux
 * Заменяет функциональность ContainerContext
 */
export default function useContainer() {
  const dispatch = useDispatch();
  const [saveDashboard] = useSaveDashboardMutation();
  
  // Состояние контейнеров из Redux store
  const containers = useSelector(state => state?.dashboard?.containers);
  const activeId = useSelector(state => state?.ui?.activeId || 0);
  const windowOrder = useSelector(state => state?.ui?.windowOrder);
  const isSecretarySpeak = useSelector(state => state?.ui?.isSecretarySpeak);
  const draggingContainer = useSelector(state => state?.ui?.draggingContainer);
  const timers = useSelector(state => state?.timers?.timers);
  const dashboardId = useSelector(state => state?.dashboard?.id);
  const dashboardName = useSelector(state => state?.dashboard?.name);
  const themeMode = useSelector(state => state?.dashboard?.themeMode);
  const calendarSettings = useSelector(state => state?.dashboard?.calendarSettings);

  // Функции для работы с контейнерами
  const addContainer = (containerData) => {
    console.log(`addContainer: containerData=`, containerData);
    return dispatch(addContainerAction(containerData));
  };

  const updateContainer = (containerData) => {
    return dispatch(updateContainerAction(containerData));
  };

  const removeContainer = (containerId) => {
    return dispatch(removeContainerAction(containerId));
  };

  const setContainers = (containers) => {
    return dispatch(setContainersAction(containers));
  };

  // Функции для работы с UI
  const setActiveId = (id) => {
    return dispatch(setActiveIdAction(id));
  };

  const setWindowOrder = (order) => {
    return dispatch(setWindowOrderAction(order));
  };

  const setSecretarySpeak = (speak) => {
    return dispatch(setIsSecretarySpeakAction(speak));
  };

  const setDraggingContainer = (container) => {
    return dispatch(setDraggingContainerAction(container));
  };

  // Функции для работы с таймерами
  const setTimers = (timers) => {
    return dispatch(setTimersAction(timers));
  };

  const addTimer = (timer) => {
    return dispatch(addTimerAction(timer));
  };

  const removeTimer = (timerId) => {
    return dispatch(removeTimerAction(timerId));
  };

  const updateTimer = (timerData) => {
    return dispatch(updateTimerAction(timerData));
  };

  const sendTimersToServer = (timers) => {
    return dispatch(saveTimersAction(timers));
  };

  const sendContainersToServer = async () => {
    const dashboardData = {
      id: dashboardId,
      name: dashboardName,
      containers: containers,
      timers: timers,
      themeMode: themeMode,
      calendarSettings: calendarSettings,
    };
    try {
      await saveDashboard(dashboardData).unwrap();
      console.log('Dashboard saved successfully!');
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    }
  };

  return {
    // Состояние
    containers,
    activeId,
    windowOrder,
    isSecretarySpeak,
    draggingContainer,
    timers,
    themeMode, // Add themeMode to returned state
    calendarSettings, // Add calendarSettings to returned state
    
    // Функции для работы с контейнерами
    addContainer,
    updateContainer,
    removeContainer,
    setContainers,
    
    // Функции для работы с UI
    setActiveId,
    setWindowOrder,
    setSecretarySpeak,
    setDraggingContainer,
    
    // Функции для работы с таймерами
    setTimers,
    addTimer,
    removeTimer,
    updateTimer,
    sendTimersToServer,
    sendContainersToServer, // Add the new function
  };
}