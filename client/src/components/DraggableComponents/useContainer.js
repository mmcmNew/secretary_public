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

/**
 * Хук для работы с контейнерами через Redux
 * Заменяет функциональность ContainerContext
 */
export default function useContainer() {
  const dispatch = useDispatch();
  
  // Состояние контейнеров из Redux store
  const containers = useSelector(state => state?.dashboard?.containers);
  const activeId = useSelector(state => state?.ui?.activeId || 0);
  const windowOrder = useSelector(state => state?.ui?.windowOrder);
  const isSecretarySpeak = useSelector(state => state?.ui?.isSecretarySpeak);
  const draggingContainer = useSelector(state => state?.ui?.draggingContainer);
  const timers = useSelector(state => state?.timers?.timers);

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

  return {
    // Состояние
    containers,
    activeId,
    windowOrder,
    isSecretarySpeak,
    draggingContainer,
    timers,
    
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
  };
}