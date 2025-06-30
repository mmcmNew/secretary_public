import PropTypes from "prop-types";
import { Box, Button, IconButton, ToggleButton } from "@mui/material";
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import CalendarComponent from "../Calendar/CalendarComponent";
import FocusModeComponent from "./FocusMode";
import TotalTimeTree from "./TotalTimeTree";
import TaskDialog from "../Calendar/TaskDialog";
import NewRecordDialog from "../JournalEditor/NewRecordDialog";

export default function AntischeduleComponent({
  containerId,
  mode,
  isMobile,
  setIsMobile,
  handleSetMode,
  handleNewRecordDialogOpen,
  handleTaskClick,
  handleAdditionalButtonClick,
  calendarRef,
  newSettings,
  saveCalendarSettings,
  updatedCalendarEvents,
  myDayTasks,
  listsList,
  defaultLists,
  projects,
  myDayList,
  handleEventClick,
  handleEventChange,
  handleEventReceive,
  handleAddAntiTask,
  fetchTasks,
  fetchAntiSchedule,
  handleDatesSet,
  selectedDayTasks,
  taskDialogOpen,
  handleDialogClose,
  handleDelDateClick,
  dialogScroll,
  setSelectedTaskId,
  currentTasks,
  selectedTaskId,
  currentTaskFields,
  handleUpdateTask,
  currentTaskType,
  handleChangeTaskStatus,
  handleChangeEventStatus,
  deleteTask,
  newRecordDialogOpen,
  handleNewRecordDialogClose,
  updateTask,
}) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        padding: 2,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <Box
        sx={{
          minWidth: "500px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            minWidth: "500px",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <ToggleButton
            value="focus"
            selected={mode === "focus"}
            onChange={() => handleSetMode()}
          >
            Фокус
          </ToggleButton>
          <IconButton onClick={() => setIsMobile(!isMobile)} color="inherit">
            <SmartphoneIcon />
          </IconButton>
          <Button onClick={handleNewRecordDialogOpen}>Добавить запись в журнал</Button>
        </Box>
        <Box sx={{ height: "95%", width: "100%" }}>
          {mode !== "focus" && isMobile ? (
            <CalendarComponent
              calendarRef={calendarRef}
              newSettings={newSettings}
              saveSettings={saveCalendarSettings}
              events={updatedCalendarEvents}
              lists={{ lists: listsList, default_lists: defaultLists, projects }}
              handleEventClick={handleEventClick}
              handleEventChange={handleEventChange}
              eventReceive={handleEventReceive}
              addTask={handleAddAntiTask}
              fetchTasks={fetchTasks}
              fetchEvents={fetchAntiSchedule}
              datesSet={handleDatesSet}
            />
          ) : (
            <FocusModeComponent
              containerId={containerId}
              tasks={myDayTasks}
              selectedList={myDayList}
              updateTask={updateTask}
              changeTaskStatus={handleChangeTaskStatus}
              fetchTasks={fetchTasks}
              onTaskClick={handleTaskClick}
              additionalButtonClick={handleAdditionalButtonClick}
            />
          )}
        </Box>
      </Box>
      {mode !== "focus" && !isMobile && (
        <Box sx={{ width: "100%", height: '98%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <CalendarComponent
            calendarRef={calendarRef}
            newSettings={newSettings}
            saveSettings={saveCalendarSettings}
            events={updatedCalendarEvents}
            lists={{ lists: listsList, default_lists: defaultLists, projects }}
            handleEventClick={handleEventClick}
            handleEventChange={handleEventChange}
            eventReceive={handleEventReceive}
            addTask={handleAddAntiTask}
            fetchTasks={fetchTasks}
            fetchEvents={fetchAntiSchedule}
            datesSet={handleDatesSet}
          />
          {selectedDayTasks && (
            <Box sx={{ width: "100%" }}>
              <TotalTimeTree tasks={selectedDayTasks} />
            </Box>
          )}
        </Box>
      )}
      <TaskDialog
        open={taskDialogOpen}
        handleClose={handleDialogClose}
        handleDelDateClick={handleDelDateClick}
        scroll={dialogScroll}
        setSelectedTaskId={setSelectedTaskId}
        tasks={currentTasks}
        selectedTaskId={selectedTaskId}
        taskFields={currentTaskFields}
        updateTask={handleUpdateTask}
        changeTaskStatus={currentTaskType === 'task' ? handleChangeTaskStatus : handleChangeEventStatus}
        deleteTask={deleteTask}
      />
      <NewRecordDialog open={newRecordDialogOpen} handleClose={handleNewRecordDialogClose} />
    </Box>
  );
}

AntischeduleComponent.propTypes = {
  containerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mode: PropTypes.string,
  isMobile: PropTypes.bool,
  setIsMobile: PropTypes.func,
  handleSetMode: PropTypes.func,
  handleNewRecordDialogOpen: PropTypes.func,
  handleTaskClick: PropTypes.func,
  handleAdditionalButtonClick: PropTypes.func,
  calendarRef: PropTypes.object,
  saveCalendarSettings: PropTypes.func,
  newSettings: PropTypes.object,
  updatedCalendarEvents: PropTypes.array,
  myDayTasks: PropTypes.array,
  listsList: PropTypes.array,
  defaultLists: PropTypes.array,
  projects: PropTypes.array,
  myDayList: PropTypes.object,
  handleEventClick: PropTypes.func,
  handleEventChange: PropTypes.func,
  handleEventReceive: PropTypes.func,
  handleAddAntiTask: PropTypes.func,
  fetchTasks: PropTypes.func,
  fetchAntiSchedule: PropTypes.func,
  handleDatesSet: PropTypes.func,
  selectedDayTasks: PropTypes.array,
  taskDialogOpen: PropTypes.bool,
  handleDialogClose: PropTypes.func,
  handleDelDateClick: PropTypes.func,
  dialogScroll: PropTypes.string,
  setSelectedTaskId: PropTypes.func,
  currentTasks: PropTypes.array,
  selectedTaskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currentTaskFields: PropTypes.object,
  handleUpdateTask: PropTypes.func,
  updateTask: PropTypes.func,
  currentTaskType: PropTypes.string,
  handleChangeTaskStatus: PropTypes.func,
  handleChangeEventStatus: PropTypes.func,
  deleteTask: PropTypes.func,
  newRecordDialogOpen: PropTypes.bool,
  handleNewRecordDialogClose: PropTypes.func,
};
