import { PropTypes } from 'prop-types';
import { useEffect, useMemo } from "react";
import useContainer from "../DraggableComponents/useContainer";
import useCalendar from "./hooks/useCalendar";
import TaskDialog from "./TaskDialog";
import CalendarComponent from "./CalendarComponent";
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Box from '@mui/material/Box';

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
  
  // Используем кастомный хук для всей календарной логики
  const {
    calendarRef,
    tasks,
    lists,
    taskFields,
    calendarEvents,
    calendarUIState,
    calendarSettings,
    fetchTasks,
    fetchCalendarEvents,
    handleCreateTask,
    handleEventClick,
    handleEventChange,
    handleDelDateClick,
    handleDialogClose,
    handleOverrideChoice,
    handleSaveSettings,
    setOverrideSnackbar,
    changeInstanceStatus,
    handleTaskChange,
    handleInstanceChange,
    handleDeleteInstanceDate,
    handleDeleteTaskDate,
    addSubTask,
    changeTaskStatus,
    deleteTask,
  } = useCalendar({ onSuccess, onError });

  // Мемоизированные настройки календаря
  const effectiveCalendarSettings = useMemo(() => {
    return calendarSettingsProp || calendarSettings;
  }, [calendarSettingsProp, calendarSettings]);

  // Мемоизированная функция сохранения настроек
  const handleSaveCalendarSettings = useMemo(() => {
    return (settings) => {
      handleSaveSettings(settings, containerId, handleUpdateContent);
    };
  }, [handleSaveSettings, containerId, handleUpdateContent]);

  // Обновление настроек календаря при изменении пропсов
  useEffect(() => {
    if (calendarSettingsProp) {
      handleSaveCalendarSettings(calendarSettingsProp);
    }
  }, [calendarSettingsProp, handleSaveCalendarSettings]);

  return (
    <>
      <CalendarComponent
        calendarRef={calendarRef}
        newSettings={effectiveCalendarSettings}
        saveSettings={handleSaveCalendarSettings}
        events={calendarEvents}
        tasks={tasks}
        lists={lists}
        handleEventClick={handleEventClick}
        handleEventChange={handleEventChange}
        eventReceive={handleEventChange}
        onCreateTask={handleCreateTask}
        fetchTasks={fetchTasks}
        fetchEvents={fetchCalendarEvents}
        datesSet={handleDatesSet}
      />
      
      <TaskDialog
        open={calendarUIState.taskDialogOpen}
        handleClose={handleDialogClose}
        scroll={calendarUIState.dialogScroll}
        instance={calendarUIState.selectedEvent}
        subtasks={calendarUIState.selectedSubtasks}
        task={calendarUIState.parentTask}
        overrides={calendarUIState.overrides}
        taskFields={taskFields}
        addSubTask={addSubTask}
        changeTaskStatus={changeTaskStatus}
        changeInstanceStatus={changeInstanceStatus}
        onChangeTask={handleTaskChange}
        onChangeInstance={handleInstanceChange}
        onDeleteTaskDate={handleDeleteTaskDate}
      />
      
      <Snackbar
        open={calendarUIState.overrideSnackbar.open}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span>Что изменить?</span>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleOverrideChoice('single')}
            >
              Только этот экземпляр (только {
                calendarUIState.overrideSnackbar.eventInfo?.event?.extendedProps?.originalStart 
                  ? new Date(calendarUIState.overrideSnackbar.eventInfo.event.extendedProps.originalStart).toLocaleDateString() 
                  : 'этот день'
              })
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={() => handleOverrideChoice('series')}
            >
              Всю серию
            </Button>
          </Box>
        }
        onClose={() => setOverrideSnackbar({ open: false, eventInfo: null })}
      />
    </>
  );
}

CalendarLayout.propTypes = {
  containerId: PropTypes.string,
  handleDatesSet: PropTypes.func,
  calendarSettingsProp: PropTypes.object,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};
