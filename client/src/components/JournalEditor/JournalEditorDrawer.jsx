import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventIcon from '@mui/icons-material/Event';
import { Autocomplete, Button, CircularProgress, Pagination, TextField, Typography } from "@mui/material";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from "@mui/x-date-pickers";
import { useNavigate } from 'react-router-dom';
import NewRecordDialog from './NewRecordDialog';
import FiltersPanel from './FiltersPanel';
import RecordList from './RecordList';
import useJournalEditor from './hooks/useJournalEditor';

const drawerWidth = 300;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    variants: [
      {
        props: ({ open }) => open,
        style: {
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginLeft: 0,
        },
      },
    ],
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function JournalEditorDrawer() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(true);

  const {
    tableName,
    tablesList,
    calendarDate,
    markedDates,
    newRecordDialogOpen,
    tableSurvey,
    allRecordDates,
    currentPage,
    isPostGenerate,
    showFilters,
    filters,
    loadingFilteredRecords,
    dropdownValues,
    editors,
    dispatchEditors,
    setShowFilters,
    handleTableChange,
    handleMonthChange,
    handleDateChange,
    handlePaginationDateChange,
    handleFilterChange,
    resetFilters,
    applyFilters,
    handleSaveSingle,
    shouldDisableDate,
    handleNewRecordDialogOpen,
    handleDialogClose,
    handleAIPostGenerate,
    handlePostRecordToSocials,
    handleAIEnhance,
    handleGenerateImage,
  } = useJournalEditor();

  const handleDrawerOpen = React.useCallback(() => {
    setOpen(true);
  }, []);

  const handleDrawerClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
      <CssBaseline />
      <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          edge="start"
          sx={[
            {
              ml: 2,
            },
            open && { display: 'none' },
          ]}
        >
          <EventIcon />
      </IconButton>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth+30,
            boxSizing: 'border-box',
            borderRadius: '10px',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <Box>
          <Autocomplete
            options={(tablesList || []).map(({ label, src }) => ({ label, src }))}
            getOptionLabel={(option) => option.label || ""}
            isOptionEqualToValue={(option, value) => option?.src === value?.src}
            onChange={(event, newValue) => handleTableChange(newValue?.src || null)}
            renderInput={(params) => <TextField {...params} label="Журнал" />}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={calendarDate}
              onChange={(newValue) => handleDateChange(newValue)}
              onMonthChange={handleMonthChange} // Обработчик смены месяца
              shouldDisableDate={shouldDisableDate} // Функция для отметки доступных дат
            />
          </LocalizationProvider>
        </Box>
      </Drawer>
      <Main open={open} sx={{ flexGrow: 1, p: 3, width: '100%', height: '100%' }}>
        <Box sx={{ flexGrow: 1, overflow: 'none', height: '100%', width: '100%', flexDirection: 'column', display: 'flex', paddingBottom: 2, marginLeft: 2 }}>
          {/* { tableName && calendarDate ? */}
          <Box sx={{ height: '95%', width: '100%'}}>
          {tablesList.length != 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'left', marginBottom: 2 }}>
              {/* <Typography variant="h6" component="div">
                {tableName}
              </Typography> */}
                <Button onClick={handleNewRecordDialogOpen}>
                  Добавить запись на сегодня
                </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined"
                  startIcon={<FilterAltIcon />}
                  disabled={loadingFilteredRecords || !tableName}
                  onClick={() => setShowFilters(prev => !prev)}>
                    Фильтр
                </Button>
                <Button variant="outlined" onClick={handleAIPostGenerate}
                  disabled={isPostGenerate === "loading" || isPostGenerate === "success" || isPostGenerate === "error" || editors.some(editor => editor.aiResponseStatus === "loading") || !editors.some(editor => editor.checked)}
                  startIcon={
                    isPostGenerate === "loading" ? <CircularProgress size={20} /> :
                    isPostGenerate === "success" ? <CheckIcon /> :
                    isPostGenerate === "error" ? <ReportProblemIcon /> :
                    <AutoFixHighIcon />
                  }
                > {isPostGenerate === "success" ? "Пост успешно сгенерирован" :
                    isPostGenerate === "error" ? "Ошибка при генерации поста" :
                    isPostGenerate === "loading" ? "Генерация поста..." :
                    "Сгенерировать пост"
                  }
                </Button>
              </Box>
            </Box>
            ): null}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'none', height: '100%' }}>
              {showFilters && tableName && (
                <Box sx={{ flexShrink: 0 }}>
                  <FiltersPanel
                    filtersConfig={tablesList.find((t) => t.src === tableName)?.filters}
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    resetFilters={resetFilters}
                    applyFilters={applyFilters}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    loadingFilteredRecords={loadingFilteredRecords}
                    dropdownValues={dropdownValues}
                  />
                </Box>
              )}
              <Box sx={{ flexGrow: 1, overflowY: 'none', height: '100%', marginTop: 1 }}>
                {tablesList && tablesList.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                    <Typography variant="h5" color="text.secondary">
                      У вас нет журналов
                    </Typography>
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      Создайте свой первый журнал через профиль пользователя
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => navigate('/account')}
                      size="large"
                    >
                      Перейти в профиль
                    </Button>
                  </Box>
                ) : (
                <RecordList
                  editors={editors}
                  tableSurvey={tableSurvey}
                  dispatchEditors={dispatchEditors}
                  handleSaveSingle={handleSaveSingle}
                  handleAIEnhance={handleAIEnhance}
                  handleGenerateImage={handleGenerateImage}
                  handlePostRecordToSocials={handlePostRecordToSocials}
                />
                )}
              </Box>
              {allRecordDates?.length > 0 && Object.keys(filters).length === 0 ? (
                <Pagination
                  count={allRecordDates.length}
                  page={currentPage}
                  onChange={handlePaginationDateChange}
                  variant="outlined"
                  size="large"
                  boundaryCount={2}
                  showFirstButton
                  showLastButton
                  sx={{ marginTop: 2 }}
                />
              ) : null}
            </Box>
          </Box>
        </Box>
        <NewRecordDialog
            open={newRecordDialogOpen}
            handleClose={handleDialogClose}
            tableSurvey={tableSurvey}
          />
      </Main>
    </Box>
  );
}

JournalEditorDrawer.propTypes = {};
