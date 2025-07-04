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
import { Autocomplete, Button, Checkbox, CircularProgress, Pagination, TextField, Typography } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from "@mui/x-date-pickers";
import { useState, useEffect, useReducer, useCallback } from "react";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import NewRecordDialog from './NewRecordDialog';
import { aiPostGenerate, sendMessageToAI, post_record_to_socials, fetchAllFilters, fetchFilteredData, fetchTableData,
  fetchDatesList, fetchTablesList, updateRecordFromBlocks, generateImageForRecord } from '../Chat/API/apiHandlers';
import MDNotionEditor from './MDNotionEditor';
import FiltersPanel from './FiltersPanel';
import { Virtuoso } from 'react-virtuoso';
import RecordEditor from './RecordEditor';
import { useNavigate } from 'react-router-dom';


dayjs.extend(utc);

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

  const [tableName, setTableName] = useState();
  const [tablesList, setTablesList] = useState([]);
  const [calendarDate, setCalendarDate] = useState(dayjs().utc().startOf('day'));
  const [markedDates, setMarkedDates] = useState([]); // Добавляем состояние для хранения отмеченных дат
  const [newRecordDialogOpen, setNewRecordDialogOpen] = useState(false);
  const [tableSurvey, setTableSurvey] = useState(null);
  const [allRecordDates, setAllRecordsDates] = useState([]);
  const [currentPage, setCurrentPage] = useState(-1);
  const [records, setRecords] = useState([]);
  const [isPostGenerate, setIsPostGenerate] = useState('wait');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [loadingFilteredRecords, setLoadingFilteredRecords] = useState(false);
  const [dropdownValues, setDropdownValues] = useState({});

    const editorsReducer = (state, action) => {
      switch(action.type) {
        case 'SET_EDITORS':
          return action.payload;
      case 'SET_STATUS':
        return state.map((ed, i) => i === action.index ? { ...ed, [action.key]: action.value } : ed);
      case 'SET_CHECKED':
        return state.map((ed, i) => i === action.index ? { ...ed, checked: action.checked } : ed);
      case 'SET_ALL_CHECKED':
        return state.map(ed => ({ ...ed, checked: action.checked }));
      case 'SET_AI_RESPONSE':
        return state.map((ed, i) => i === action.index ? { ...ed, aiResponse: action.value } : ed);
      case 'SET_HAS_UNSAVED':
        return state.map((ed, i) => i === action.index ? { ...ed, hasUnsavedChanges: true } : ed);
      case 'CLEAR_UNSAVED':
        return state.map((ed, i) => i === action.index ? { ...ed, hasUnsavedChanges: false } : ed);
      case 'UPDATE_RECORD_FIELD':
        return state.map((ed, i) => {
          if (i !== action.index) return ed;
          return {
            ...ed,
            record: {
              ...ed.record,
              [action.field]: action.value
            }
          };
        });
      default:
        return state;
      }
    };
  const [editors, dispatchEditors] = useReducer(editorsReducer, []);
  
  // Стабильные refs для редакторов
  const editorRefs = React.useRef([]);

  useEffect(() => {
    let ignore = false;
    const fetchTables = async () => {
      const data = await fetchTablesList();
      if (!ignore) setTablesList(data);
    };
    fetchTables();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    const order = tableSurvey?.fields?.map(f => f.field_id) || [];
    editorRefs.current = records.map((rec, i) => {
      const refs = editorRefs.current[i] || {};
      const fields = order.length ? order : Object.keys(rec);
      fields.forEach((field) => {
        if (['id', 'date', 'time'].includes(field)) return;
        if (!refs[field]) refs[field] = React.createRef();
      });
      return refs;
    });

    const newEditors = records.map((rec, i) => ({
      ref: editorRefs.current[i],
      record: rec,
      saveStatus: "idle",
      aiResponseStatus: "idle",
      sendToSocialsStatus: "idle",
      aiResponse: null,
      checked: false,
      hasUnsavedChanges: false,
    }));
    dispatchEditors({ type: 'SET_EDITORS', payload: newEditors });
  }, [records, tableSurvey]);

  const handleFilterChange = (field, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: value,
    }));
  };

  // Функция для сброса фильтров
  const resetFilters = () => {
    setFilters({});
  };

  // Функция для применения фильтров и загрузки данных
  const applyFilters = async () => {
    if (!tableName) return;
        // очищаем редакторы и записи
    dispatchEditors({ type: 'SET_EDITORS', payload: [] });
    setRecords([]);

    // подгружаем отфильтрованные записи
    setLoadingFilteredRecords(true);
    try {
      const data = await fetchFilteredData(tableName, filters);
      setRecords(data.records || []);
    } finally {
      setLoadingFilteredRecords(false);
    }
  };

  async function fetchMarkedDates(tableName, month, year, timezone) {
    if (!timezone) { timezone = new Date().getTimezoneOffset(); }
    // console.log(`Fetching dates with tableName: ${tableName}, month: ${month}, year: ${year}, timezone: ${timezone}`)
    const data = await fetchDatesList(tableName, month, year, timezone);
    const dates = data.days || [];
    const survey = data.survey;
    setTableSurvey(survey);
    const newAllRecoredsDates = data.unique_dates || [];
    setAllRecordsDates(newAllRecoredsDates);
    const formattedDates = dates.map(date => dayjs(date).format('YYYY-MM-DD')); // Приводим даты к формату YYYY-MM-DD
    return formattedDates;
  }

  async function handleDateChange(newValue) {
    dispatchEditors({ type: 'SET_EDITORS', payload: [] })
    const utcDate = dayjs(newValue).utc().startOf('day');
    setCalendarDate(utcDate);
    setFilters({});

    if (!tableName) return;

    const data = await fetchTableData(tableName, utcDate.toISOString());
    setRecords(data.records || []);

    const formattedDate = utcDate.format('YYYY-MM-DD');
    const pageIndex = allRecordDates.findIndex(date => dayjs(date).format('YYYY-MM-DD') === formattedDate);

    if (pageIndex !== -1) {
        setCurrentPage(pageIndex + 1);
    }
  }

  async function handlePaginationDateChange(event, page) {
    setCurrentPage(page);
    dispatchEditors({ type: 'SET_EDITORS', payload: [] })
    setFilters({});

    const newDate = allRecordDates[page - 1];
    // console.log(newDate)

    const newCalendarDate = dayjs(newDate).local().startOf('day');
    setCalendarDate(newCalendarDate);

    if (!tableName) return;

    const data = await fetchTableData(tableName, newDate);
    console.log('Records for the selected date:', data.records);
    setRecords(data.records || [])
  }

  const handleTableChange = useCallback(async (newValue) => {
    setTableName(newValue);
    setRecords([]);
    setFilters({});
    setDropdownValues({});

    if (!newValue) return;
    const month = calendarDate.month() + 1;
    const year = calendarDate.year();
    const formattedDates = await fetchMarkedDates(newValue, month, year);
    // console.log('Formatted dates:', formattedDates);
    setMarkedDates(formattedDates);

    // 1) Загрузить все dropdown‑опции одним запросом
    const allOptions = await fetchAllFilters(newValue);
    // allOptions = { project_name: [...], step: [...], … }
    setDropdownValues(allOptions);
  }, [calendarDate]);

  const handleMonthChange = useCallback(async (newMonth) => {
    const month = newMonth.month() + 1;
    const year = newMonth.year();
    if (tableName) {
      const formattedDates = await fetchMarkedDates(tableName, month, year);
      setMarkedDates(formattedDates);
    }
  }, [tableName]);

  const handleSaveSingle = useCallback(async (index) => {
    dispatchEditors({ type: 'SET_STATUS', index, key: 'saveStatus', value: 'saving' });

    const refs = editors[index].ref;
    const record = { id: editors[index].record.id };
    const order = tableSurvey?.fields?.map(f => f.field_id) || Object.keys(refs);
    for (const field of order) {
      const r = refs[field]?.current;
      if (r && r.getMarkdown) {
        record[field] = await r.getMarkdown();
      }
    }

    await updateRecordFromBlocks(tableName, [record]);

    // Сбрасываем флаг несохраненных изменений после успешного сохранения
    dispatchEditors({ type: 'SET_STATUS', index, key: 'saveStatus', value: 'success' });
    dispatchEditors({ type: 'CLEAR_UNSAVED', index });

    setTimeout(() => {
      dispatchEditors({ type: 'SET_STATUS', index, key: 'saveStatus', value: 'idle' });
    }, 3000);
  }, [tableSurvey, tableName, editors]);

  // Функция для отключения дат, на которые нет записей
  const shouldDisableDate = useCallback((date) => {
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    return !markedDates?.includes(formattedDate);
  }, [markedDates]);

  const handleDrawerOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleNewRecordDialogOpen = useCallback(() => {
    setNewRecordDialogOpen(true);
  }, []);

  const addRecord = useCallback(async () => {
    setNewRecordDialogOpen(false);
    const todayUtcDate = dayjs().utc().startOf('day');
    setCalendarDate(todayUtcDate);
    await handleTableChange(tableName);
    await handleDateChange(todayUtcDate.toDate());
  }, [tableName]);

  const handleDialogClose = useCallback(() => {
    setNewRecordDialogOpen(false);
    addRecord();
  }, [addRecord]);

  const handleAIPostGenerate = async () => {
    const records_ids = editors.map(editor => editor.record?.id).filter(Boolean);
    if (!records_ids.length) return;
    setIsPostGenerate("loading");
    try {
      const result = await aiPostGenerate({ records_ids, table_name: tableName, type: "post" });
      if (!result) {
        console.error("Ошибка при генерации поста:", "Нет ответа от ИИ");
        setIsPostGenerate("error");
        setTimeout(() => {
          setIsPostGenerate("wait");
        }, 5000);
        return;
      }
      // Заменять текст на кнопке на Пост успешно сгенерирован на 5 секунд
      setIsPostGenerate("success");
      setTimeout(() => {
        setIsPostGenerate("wait");
      }, 5000);
    }
    catch (e) {
      console.error("Ошибка при генерации поста:", e);
      setIsPostGenerate("error");
      setTimeout(() => {
        setIsPostGenerate("wait");
      }, 5000);
    }
  }

  const handlePostRecordToSocials = async (index, type = "post") => {
    const editorFields = editors[index]?.ref;
    const recordId = editors[index]?.record?.id;
    if (!editorFields || !recordId) return;

    if (tableName !== 'posts_journal') {
      console.log("Публикация пока доступна только из таблицы постов")
      return
    }

    if (!recordId) {
      console.error("Нет ID записи или названия таблицы");
      return;
    }

    try {
      dispatchEditors({ type: 'SET_STATUS', index, key: 'sendToSocialsStatus', value: 'loading' });

      const result = await post_record_to_socials({ records_ids: [recordId], table_name: tableName, type });

      console.log("Ответ от ИИ:", result);

      dispatchEditors({ type: 'SET_STATUS', index, key: 'sendToSocialsStatus', value: 'success' });
      setTimeout(() => {
        dispatchEditors({ type: 'SET_STATUS', index, key: 'sendToSocialsStatus', value: 'idle' });
      }, 8000);
    } catch (e) {
      dispatchEditors({ type: 'SET_STATUS', index, key: 'sendToSocialsStatus', value: 'fail' });
      setTimeout(() => {
        dispatchEditors({ type: 'SET_STATUS', index, key: 'sendToSocialsStatus', value: 'idle' });
      }, 8000);
    }

  }


  const handleAIEnhance = async (index, type = "fix") => {
    const editorFields = editors[index]?.ref;
    const recordId = editors[index]?.record?.id;
    if (!editorFields || !recordId) return;

    let mdRecord = "";
    for (const field in editorFields) {
      const ref = editorFields[field].current;
      if (ref && ref.getMarkdown) {
        mdRecord += await ref.getMarkdown() + "\n";
      }
    }
    mdRecord = mdRecord.trim();

    if (!mdRecord || !tableName) {
      console.error("Нет ID записи или названия таблицы");
      return;
    }

    try {
      dispatchEditors({ type: 'SET_STATUS', index, key: 'aiResponseStatus', value: 'loading' });
      const result = await sendMessageToAI({ record: mdRecord, table_name: tableName, type });

      console.log("AI ответ:", result);

      dispatchEditors({ type: 'SET_AI_RESPONSE', index, value: result || 'Нет ответа' });
      dispatchEditors({ type: 'SET_STATUS', index, key: 'aiResponseStatus', value: 'idle' });
    } catch (e) {
      dispatchEditors({ type: 'SET_AI_RESPONSE', index, value: "Возникла ошибка при получении ответа от ИИ. Повтрорите запрос" });
      dispatchEditors({ type: 'SET_STATUS', index, key: 'aiResponseStatus', value: 'idle' });
    }
  };

  // Используем функцию из apiHandlers
  async function handleGenerateImage(index) {
    dispatchEditors({ type: 'SET_STATUS', index, key: 'imageGenerateStatus', value: 'loading' });
    const fieldRefs = editorRefs.current[index] || {};
    const recordId = editors[index]?.record?.id;
    if (!recordId) return;
    let text = "";
    for (const key in fieldRefs) {
      const ref = fieldRefs[key].current;
      if (ref && ref.getMarkdown) text += await ref.getMarkdown() + "\n";
    }
    text = text.trim();
    try {
      await generateImageForRecord({
        table_name: tableName,
        record_id: recordId,
        text
      });
      dispatchEditors({ type: 'SET_STATUS', index, key: 'imageGenerateStatus', value: 'idle' });
    } catch (e) {
      alert('Ошибка генерации изображения: ' + (e?.message || e));
      dispatchEditors({ type: 'SET_STATUS', index, key: 'imageGenerateStatus', value: 'idle' });
    }
  }

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
                <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: 'column', gap: 2, overflowY: 'none', height: '98%', marginTop: 1, paddingBottom: 2,
                  border: editors.some(editor => editor.hasUnsavedChanges) ? '2px solid #f44336' : '2px solid #ccc',
                  borderRadius: 2,
                  padding: 2,
                  transition: 'border-color 0.3s ease'
                }}>
                  {editors?.length > 0 && (
                    <Box sx ={{ marginLeft: 0 }}>
                      <Checkbox checked ={editors.every(editor => editor.checked)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          dispatchEditors({ type: 'SET_ALL_CHECKED', checked: isChecked });
                      }} />Выбрать все
                    </Box>
                  )}
                  <Virtuoso
                    style={{ height: '100%', flexGrow: 1,
                      border: '2px solid #ccc',
                      borderRadius: 0,
                      padding: 0,
                      transition: 'border-color 0.3s ease'
                    }}
                    data={editors}
                    itemKey={(index, item) => item.record?.id || index}
                    itemContent={(index, editor) => (
                      <RecordEditor
                        key={editor.record?.id || index}
                        editor={editor}
                        index={index}
                        tableSurvey={tableSurvey}
                        onCheck={(idx, checked) => dispatchEditors({ type: 'SET_CHECKED', index: idx, checked })}
                        onSave={handleSaveSingle}
                        onAIEnhance={handleAIEnhance}
                        onGenerateImage={handleGenerateImage}
                        onPostToSocials={handlePostRecordToSocials}
                        dispatchEditors={dispatchEditors}
                      />
                    )}
                  />
                </Box>
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
