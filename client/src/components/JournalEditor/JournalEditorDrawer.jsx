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
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from "@mui/x-date-pickers";
import { useMemo, useState,useEffect } from "react";
import MarkdownEditor from "./MarkdownEditor";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import NewRecordDialog from './NewRecordDialog';
import { aiPostGenerate, sendMessageToAI, post_record_to_socials, fetchAllFilters, fetchFilteredData, fetchTableData,
  fetchDatesList, fetchTablesList, updateRecordFromBlocks, generateImageForRecord } from '../Chat/API/apiHandlers';
import MDNotionEditor from './MDNotionEditor';
import pathToUrl from '../../utils/pathToUrl';
import FiltersPanel from './FiltersPanel';
import { Virtuoso } from 'react-virtuoso';

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

  const [editors, setEditors] = useState([]);
  
  const renderFiles = (files) => {
    if (!files) return null;
    const list = files.split(';').filter(Boolean);
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {list.map((f, i) => {
          const url = pathToUrl(f.trim());
          if (/\.(png|jpe?g|gif)$/i.test(url)) {
            return <img key={i} src={url} alt="file" style={{ maxWidth: '100%' }} />;
          }
          if (/\.(mp4|mkv)$/i.test(url)) {
            return <video key={i} src={url} controls style={{ maxWidth: '100%' }} />;
          }
          if (/\.(mp3|wav|ogg)$/i.test(url)) {
            return <audio key={i} src={url} controls />;
          }
          return <Button key={i} href={url} target="_blank" startIcon={<AttachFileIcon />}>Файл {i+1}</Button>;
        })}
      </Box>
    );
  };

  // Стабильные refs для редакторов
  const editorRefs = React.useRef([]);

  useMemo(async () => {
    const data = await fetchTablesList();
    setTablesList(data);
  }, []);

  useEffect(() => {
    editorRefs.current = records.map((rec, i) => {
      const refs = editorRefs.current[i] || {};
      Object.keys(rec).forEach((field) => {
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
    setEditors(newEditors);
  }, [records]);

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
    setEditors([]);
    setRecords([]);

    // подгружаем отфильтрованные записи
    setLoadingFilteredRecords(true);
    try {
      const data = await fetchFilteredData(tableName, filters);
      setRecords(data);
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
    setEditors([])
    const utcDate = dayjs(newValue).utc().startOf('day');
    setCalendarDate(utcDate);
    setFilters({});

    if (!tableName) return;

    const records = await fetchTableData(tableName, utcDate.toISOString());
    setRecords(records);

    const formattedDate = utcDate.format('YYYY-MM-DD');
    const pageIndex = allRecordDates.findIndex(date => dayjs(date).format('YYYY-MM-DD') === formattedDate);

    if (pageIndex !== -1) {
        setCurrentPage(pageIndex + 1);
    }
  }

  async function handlePaginationDateChange(event, page) {
    setCurrentPage(page);
    setEditors([])
    setFilters({});

    const newDate = allRecordDates[page - 1];
    // console.log(newDate)

    const newCalendarDate = dayjs(newDate).local().startOf('day');
    setCalendarDate(newCalendarDate);

    if (!tableName) return;

    const records = await fetchTableData(tableName, newDate);
    console.log('Records for the selected date:', records);
    setRecords(records)
  }

  async function handleTableChange(newValue) {
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
  }

  async function handleMonthChange(newMonth) {
    const month = newMonth.month() + 1;
    const year = newMonth.year();
    if (tableName) {
      const formattedDates = await fetchMarkedDates(tableName, month, year);
      setMarkedDates(formattedDates);
    }
  }

  const handleSaveSingle = async (index) => {
    setEditors(prev =>
      prev.map((editor, i) =>
        i === index ? { ...editor, saveStatus: "saving" } : editor
      )
    );

    const refs = editors[index].ref;
    const record = { id: editors[index].record.id };
    for (const field in refs) {
      const r = refs[field].current;
      if (r && r.getMarkdown) {
        record[field] = await r.getMarkdown();
      }
    }

    await updateRecordFromBlocks(tableName, [record]);

    // Сбрасываем флаг несохраненных изменений после успешного сохранения
    setEditors(prev =>
      prev.map((editor, i) =>
        i === index ? { ...editor, hasUnsavedChanges: false, saveStatus: "success" } : editor
      )
    );

    setTimeout(() => {
      setEditors(prev =>
        prev.map((editor, i) =>
          i === index ? { ...editor, saveStatus: "idle" } : editor
        )
      );
    }, 3000);
  }

  // Функция для отключения дат, на которые нет записей
  const shouldDisableDate = (date) => {
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    return !markedDates?.includes(formattedDate);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleNewRecordDialogOpen = () => {
    setNewRecordDialogOpen(true);
  };

  const handleDialogClose = () => {
    setNewRecordDialogOpen(false);
    addRecord();
  };

  async function addRecord() {
    setNewRecordDialogOpen(false);
    const todayUtcDate = dayjs().utc().startOf('day');
    setCalendarDate(todayUtcDate);
    await handleTableChange(tableName);
    await handleDateChange(todayUtcDate.toDate());
  }

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
      setEditors(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          sendToSocialsStatus: "loading"
        };
        return updated;
      });

      const result = await post_record_to_socials({ records_ids: [recordId], table_name: tableName, type });

      console.log("Ответ от ИИ:", result);

      setEditors(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          sendToSocialsStatus: "success",
        };
        return updated;
      });
      setTimeout(() => {
        setEditors(prev =>
          prev.map((editor, i) =>
            i === index ? { ...editor, sendToSocialsStatus: "idle" } : editor
          )
        );
      }, 3000);
    } catch (e) {
      setEditors(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          sendToSocialsStatus: "fail",
        };
        return updated;
      });
      setTimeout(() => {
        setEditors(prev =>
          prev.map((editor, i) =>
            i === index ? { ...editor, sendToSocialsStatus: "idle" } : editor
          )
        );
      }, 3000);
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
      setEditors(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          aiResponseStatus: "loading"
        };
        return updated;
      });
      const result = await sendMessageToAI({ record: mdRecord, table_name: tableName, type });

      console.log("AI ответ:", result);

      setEditors(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          aiResponse: result || "Нет ответа",
          aiResponseStatus: "idle",
        };
        return updated;
      });
    } catch (e) {
      setEditors(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          aiResponse: "Возникла ошибка при получении ответа от ИИ. Повтрорите запрос",
          aiResponseStatus: "idle",
        };
        return updated;
      });
    }
  };

  // Используем функцию из apiHandlers
  async function handleGenerateImage(index) {
    setEditors(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        imageGenerateStatus: 'loading',
      };
      return updated;
    });
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
      setEditors(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          imageGenerateStatus: 'idle',
        };
        return updated;
      });
    } catch (e) {
      alert('Ошибка генерации изображения: ' + (e?.message || e));
      setEditors(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          imageGenerateStatus: 'idle',
        };
        return updated;
      });
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
                          setEditors(prev => prev.map(editor => ({ ...editor, checked: isChecked })));
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
                    totalCount={editors.length}
                    itemContent={(index) => {
                      const editor = editors[index];
                      const record = editor.record || {};
                      const fieldRefs = editor.ref;
                      const fields = Object.keys(record).filter(f => !['id','date','time'].includes(f));
                      const getFieldName = (field) => {
                        const found = tableSurvey?.fields?.find(fld => fld.field_id === field);
                        return found ? found.field_name : field;
                      };
                      return (
                        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, alignItems: 'stretch', marginBottom: 0, background: 'transparent' }}>
                          {/* Кнопки управления */}
                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            backgroundColor: 'background.paper',
                            padding: 0,
                            borderBottom: `2px solid  '#ccc'`,
                            boxShadow: '0 2px 8px -5px rgba(0,0,0,0.3)',
                            marginBottom: '-2px',
                            transition: 'border-color 0.5s ease',
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Checkbox
                                checked={editor.checked}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setEditors(prev => {
                                    const updated = [...prev];
                                    updated[index] = { ...updated[index], checked: isChecked };
                                    return updated;
                                  });
                                }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                variant="contained"
                                disabled={editor.saveStatus !== "idle"}
                                onClick={() => handleSaveSingle(index)}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: editor.hasUnsavedChanges ? '#c8e6c9' : undefined
                                  },
                                  '& .MuiSvgIcon-root': {
                                    color: editor.hasUnsavedChanges ? '#4caf50' : undefined,
                                    animation: editor.hasUnsavedChanges ? 'pulseIcon 1.2s infinite' : undefined,
                                  },
                                  '@keyframes pulseIcon': {
                                    '0%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 #4caf50)' },
                                    '70%': { transform: 'scale(1.15)', filter: 'drop-shadow(0 0 8px #4caf50)' },
                                    '100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 #4caf50)' },
                                  },
                                }}
                              >
                                {editor.saveStatus === "saving" ? (
                                  <CircularProgress size={24} />
                                ) : editor.saveStatus === "success" ? (
                                  <CheckIcon />
                                ) : (
                                  <SaveIcon />
                                )}
                              </IconButton>

                              <IconButton
                                variant="contained"
                                onClick={() => handleAIEnhance(index)}
                                disabled={editor.aiResponseStatus === "loading"}
                              >
                                {editor.aiResponseStatus === "loading" ? (
                                  <CircularProgress size={24} />
                                ) : editor.aiResponseStatus === "success" ? (
                                  <CheckIcon />
                                ) : (
                                  <AutoFixHighIcon />
                                )}
                              </IconButton>

                              <IconButton
                                variant="contained"
                                disabled={editor.imageGenerateStatus === "loading"}
                                onClick={() => handleGenerateImage(index)}
                              >
                                {editor.imageGenerateStatus === "loading" ? (
                                  <CircularProgress size={24} />
                                ) : (
                                  <ImageSearchIcon />
                                )}
                              </IconButton>

                              <IconButton variant="contained">
                                <AttachFileIcon />
                              </IconButton>

                              <IconButton
                                variant="contained"
                                onClick={() => handlePostRecordToSocials(index)}
                                disabled={editor.sendToSocialsStatus === "loading"}
                              >
                                {editor.sendToSocialsStatus === "loading" ? (
                                  <CircularProgress size={24} />
                                ) : editor.sendToSocialsStatus === "success" ? (
                                  <CheckIcon />
                                ) : editor.sendToSocialsStatus === "fail" ? (
                                  <ReportProblemIcon />
                                ) : (
                                  <SendIcon />
                                )}
                              </IconButton>
                            </Box>
                          </Box>

                          {/* Редактор и AI Ответ */}
                          <Box sx={{
                            display: 'flex',
                            gap: 2,
                            borderBottom: `2px solid ${editor.hasUnsavedChanges ? '#f44336' : '#ccc'}`,
                            background: 'white',
                            transition: 'border-color 0.5s ease',
                          }}>
                            <Box sx={{ flex: editor.aiResponse ? 1 : '100%' }}>
                              {fields.map((field) => (
                                field === 'files' ? (
                                  <Box key={field} sx={{ mb: 1 }}>
                                    {renderFiles(record[field])}
                                  </Box>
                                ) : (
                                  <Box key={field} sx={{ mb: 1 }}>
                                    <Typography variant="subtitle2">{getFieldName(field)}</Typography>
                                    <MarkdownEditor
                                      ref={fieldRefs[field]}
                                      initialMarkdown={record[field] || ''}
                                      onChange={() => setEditors(prev => prev.map((ed,i) => i===index ? { ...ed, hasUnsavedChanges: true } : ed))}
                                    />
                                  </Box>
                                )
                              ))}
                            </Box>

                            {editor.aiResponse && (
                              <Box sx={{ width: '50%', height: '100%', position: 'relative' }}>
                                <IconButton
                                  onClick={() => {
                                    setEditors(prev => {
                                      const updated = [...prev];
                                      updated[index] = { ...updated[index], aiResponse: null };
                                      return updated;
                                    });
                                  }}
                                  sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                                >
                                  <CloseIcon />
                                </IconButton>
                                <MDNotionEditor readOnly initialMarkdown={editor.aiResponse} />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                    }}
                  />
                </Box>
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
