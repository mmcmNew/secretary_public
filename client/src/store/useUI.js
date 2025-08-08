import { useSelector, useDispatch } from 'react-redux';
import { 
  setThemeMode, 
  setActiveId, 
  setWindowOrder, 
  setIsSecretarySpeak,
  setDraggingContainer
} from './uiSlice';

/**
 * Хук для работы с UI состоянием через Redux
 * Заменяет функциональность useContainer
 */
export const useUI = () => {
  const dispatch = useDispatch();
  
  // Состояние UI из Redux store
  const themeMode = useSelector(state => state.ui.themeMode);
  const activeId = useSelector(state => state.ui.activeId);
  const windowOrder = useSelector(state => state.ui.windowOrder);
  const isSecretarySpeak = useSelector(state => state.ui.isSecretarySpeak);
  const draggingContainer = useSelector(state => state.ui.draggingContainer);

  // Функции для работы с UI
  const setTheme = (mode) => {
    return dispatch(setThemeMode(mode));
  };

  const setActiveContainerId = (id) => {
    return dispatch(setActiveId(id));
  };

  const setWindowOrderFunc = (order) => {
    return dispatch(setWindowOrder(order));
  };

  const setSecretarySpeak = (speak) => {
    return dispatch(setIsSecretarySpeak(speak));
  };

  const setDraggingContainerFunc = (container) => {
    return dispatch(setDraggingContainer(container));
  };

  return {
    // Состояние
    themeMode,
    activeId,
    windowOrder,
    isSecretarySpeak,
    draggingContainer,
    
    // Функции
    setTheme,
    setActiveContainerId,
    setWindowOrder: setWindowOrderFunc,
    setSecretarySpeak,
    setDraggingContainer: setDraggingContainerFunc,
  };
};

export default useUI;