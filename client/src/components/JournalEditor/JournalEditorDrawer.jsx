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
import { Autocomplete, Button, Checkbox, CircularProgress, Pagination, TextField, } from "@mui/material";
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
import NotionEditor from "./NotionEditor";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import NewRecordDialog from './NewRecordDialog';
import { aiPostGenerate, sendMessageToAI, post_record_to_socials, fetchAllFilters, fetchFilteredData, fetchTableData,
  fetchDatesList, fetchTablesList, updateRecordFromBlocks, generateImageForRecord } from '../Chat/API/apiHandlers';
import MDNotionEditor from './MDNotionEditor';
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

  // Стабильные refs для редакторов
  const editorRefs = React.useRef([]);

  useMemo(async () => {
    const data = await fetchTablesList();
    setTablesList(data);
  }, []);

  useEffect(() => {
    // Сохраняем refs по id записи
    editorRefs.current = records.map((blocks, i) => {
      if (!editorRefs.current[i]) editorRefs.current[i] = React.createRef();
      return editorRefs.current[i];
    });
    const newEditors = records.map((blocks, i) => ({
      ref: editorRefs.current[i],
      blocks,
      saveStatus: "idle",
      aiResponseStatus: "idle",
      sendToSocialsStatus: "idle",
      aiResponse: null,
      checked: false,
      hasUnsavedChanges: false,
    }));
    setEditors(newEditors);
    // console.log('Records:', records)
    // console.log('Editors:', newEditors)
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

    const editorRef = editors[index].ref;
    if (editorRef?.current?.getBlocks) {
      const allBlocks = await editorRef.current.getBlocks();

      const modifiedBlocks = [];

      for (const block of allBlocks) {
        if (block.children && block.children.length > 0) {
          let markdown = "";

          for (const child of block.children) {
            const singleBlockArray = [child]; // Преобразуем одного ребенка в массив
            const childMarkdown = await editorRef.current.blocksToMarkdownLossy(singleBlockArray);
            markdown += childMarkdown.trim() + "\n";
          }

          markdown = markdown.trim();
          modifiedBlocks.push({ ...block, markdownContent: markdown });
        } else {
          modifiedBlocks.push({ ...block, markdownContent: "" });
        }
      }

      await updateRecordFromBlocks(tableName, modifiedBlocks);

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
  };

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
    const records_ids = editors.map(editor => editor.blocks[0]?.id?.split("-")[1]).filter(Boolean);
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
    const editorRef = editors[index]?.ref?.current;
    if (!editorRef) return;
    const blocks = editorRef.getBlocks();
    const recordId = blocks?.[0]?.id?.split("-")[1];

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
    const editorRef = editors[index]?.ref?.current;
    if (!editorRef) return;

    const blocks = editorRef.getBlocks();
    const recordId = blocks?.[0]?.id?.split("-")[1];

    const mdRecord = await editorRef.blocksToMarkdownLossy(blocks);
    console.log(editorRef)
    console.log(mdRecord)
    if (!mdRecord) return;

    if (!recordId || !tableName) {
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
    const editorRef = editorRefs.current[index]?.current;
    if (!editorRef) return;
    const blocks = await editorRef.getBlocks();
    const text = await editorRef.blocksToMarkdownLossy(blocks);
    const recordId = blocks?.[0]?.id?.split("-")[1];
    try {
      const newBlocks = await generateImageForRecord({
        table_name: tableName,
        record_id: recordId,
        text
      });
      // Валидация: newBlocks должен быть массивом объектов
      const validBlocks = Array.isArray(newBlocks) && Array.isArray(newBlocks[0]) ? newBlocks[0] : newBlocks;
      setRecords(prev => {
        const updated = [...prev];
        updated[index] = validBlocks;
        return updated;
      });
      // Обновляем содержимое редактора через ref
      if (editorRef.setBlocks) {
        editorRef.setBlocks(validBlocks);
      }
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
                      return (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0,
                            padding: 0,
                            alignItems: 'stretch',
                            marginBottom: 0,
                            background: 'transparent',
                          }}
                        >
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
                            // borderTop: `2px solid ${editor.hasUnsavedChanges ? '#f44336' : '#ccc'}`,
                            // borderLeft: `2px solid ${editor.hasUnsavedChanges ? '#f44336' : '#ccc'}`,
                            // borderRight: `2px solid ${editor.hasUnsavedChanges ? '#f44336' : '#ccc'}`,
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
                            // borderLeft: `2px solid ${editor.hasUnsavedChanges ? '#f44336' : '#ccc'}`,
                            // borderRight: `2px solid ${editor.hasUnsavedChanges ? '#f44336' : '#ccc'}`,
                            borderBottom: `2px solid ${editor.hasUnsavedChanges ? '#f44336' : '#ccc'}`,
                            background: 'white',
                            transition: 'border-color 0.5s ease',
                          }}>
                            {/* Основной редактор */}
                            <Box sx={{ flex: editor.aiResponse ? 1 : '100%' }}>
                              <NotionEditor
                                ref={editor.ref}
                                initialBlocks={editor.blocks}
                                onChange={async () => {
                                  const editorRef = editor.ref.current;
                                  if (editorRef?.getBlocks) {
                                    const newBlocks = await editorRef.getBlocks();
                                    setEditors(prev => {
                                      const updated = [...prev];
                                      updated[index] = {
                                        ...updated[index],
                                        hasUnsavedChanges: true,
                                        blocks: newBlocks
                                      };
                                      return updated;
                                    });
                                  }
                                }}
                              />
                            </Box>

                            {/* AI Ответ */}
                            {editor.aiResponse && (
                              <Box sx={{ width: '50%', height: '100%', position: 'relative' }}>
                                <IconButton
                                  onClick={() => {
                                    setEditors(prev => {
                                      const updated = [...prev];
                                      updated[index] = {
                                        ...updated[index],
                                        aiResponse: null,
                                      };
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
