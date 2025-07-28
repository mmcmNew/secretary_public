import { PropTypes } from 'prop-types';
import { useEffect, useMemo } from "react";
import useContainer from "../DraggableComponents/useContainer";
import useCalendar from './hooks/useCalendar';
import CalendarComponent from "./CalendarComponent";

/**
 * Оптимизированный компонент календаря с использованием кастомного хука
 * Все отсутствующие функции теперь реализованы в TasksContext
 */
export default function CalendarLayout({
  containerId = null,
  handleDatesSet = null,
  calendarSettingsProp = null,
  onSuccess = null,
  onError = null,
}) {
  const { handleUpdateContent } = useContainer();

  // Use the hook to get all calendar-related state and functions
  const calendarProps = useCalendar({ onSuccess, onError });

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
    if (calendarSettingsProp) {
      handleSaveCalendarSettings(calendarSettingsProp);
    }
  }, [calendarSettingsProp, handleSaveCalendarSettings]);

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
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};
