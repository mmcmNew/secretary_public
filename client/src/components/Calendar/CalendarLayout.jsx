import { PropTypes } from 'prop-types';
import { useEffect, useMemo, useContext } from "react";
import useContainer from "../DraggableComponents/useContainer";
import useCalendar from './hooks/useCalendar';
import CalendarComponent from "./CalendarComponent";
import { ErrorContext } from '../../contexts/ErrorContext';

/**
 * Оптимизированный компонент календаря с использованием кастомного хука
 * Все отсутствующие функции теперь реализованы в TasksContext
 */
export default function CalendarLayout({
  containerId = null,
  handleDatesSet = null,
  calendarSettingsProp = null,
}) {
  const { setError, setSuccess } = useContext(ErrorContext);
  const { handleUpdateContent } = useContainer();

  // Use the hook to get all calendar-related state and functions
  const calendarProps = useCalendar({ onSuccess: setSuccess, onError: setError });

  // Мемоизированные настройки календаря
  const effectiveCalendarSettings = useMemo(() => {
    return calendarSettingsProp || calendarProps.calendarSettings;
  }, [calendarSettingsProp, calendarProps.calendarSettings]);

  // Мемоизированная функция сохранения настроек
  const handleSaveCalendarSettings = useMemo(() => {
    return (settings) => {
      calendarProps.handleSaveSettings(settings, containerId, handleUpdateContent);
    };
  }, [calendarProps.handleSaveSettings, containerId, handleUpdateContent]);

  // Обновление настроек календаря при изменении пропсов
  useEffect(() => {
    if (calendarSettingsProp && JSON.stringify(calendarSettingsProp) !== JSON.stringify(calendarProps.calendarSettings)) {
      handleSaveCalendarSettings(calendarSettingsProp);
    }
  }, [calendarSettingsProp, calendarProps.calendarSettings, handleSaveCalendarSettings]);

  return (
    <CalendarComponent
      {...calendarProps} // Pass all props from the hook
      newSettings={effectiveCalendarSettings}
      saveSettings={handleSaveCalendarSettings}
      datesSet={handleDatesSet}
    />
  );
}

CalendarLayout.propTypes = {
  containerId: PropTypes.string,
  handleDatesSet: PropTypes.func,
  calendarSettingsProp: PropTypes.object,
};
