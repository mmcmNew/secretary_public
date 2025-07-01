import { Alert, Autocomplete, Button, Pagination, TextField } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import { Box } from "@mui/system";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from "@mui/x-date-pickers";
import { useMemo, useRef, useState } from "react";
import NotionEditor from "./NotionEditor";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import NewRecordDialog from "./NewRecordDialog";

dayjs.extend(utc);


async function fetchTablesList() {
    try {
      const response = await fetch('/get_tables');
    //   console.log(response);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
    //   console.log(data)
      return data.tables;
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
}

async function fetchTableData(tableName, date) {
    try {
      const timezoneOffset = new Date().getTimezoneOffset()* 60000;
      const response = await fetch(`/get_table_blocks?table_name=${tableName}&date=${date}&timezone_offset=${timezoneOffset}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
}

async function fetchDatesList(tableName, month, year, timezone) {
//   console.log(`Fetching dates with tableName: ${tableName}, month: ${month}, year: ${year}`);

  // Добавление ведущего нуля к месяцу, если он меньше 10
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;

  try {
    const response = await fetch(`/get_days?table_name=${tableName}&month=${formattedMonth}&year=${year}&timezone=${timezone}`);
    // console.log('Response:', response);

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log('Data received:', data);

    if (data) {
      console.log('Days:', data);
      return data;
    } else {
      console.warn('No days found in response data:', data);
      return []; // Возвращаем пустой массив, если данных нет
    }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
}


async function updateRecordFromBlocks(table_name, blocks) {
    const url = '/update_record_from_blocks'
    try{
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({table_name, blocks}),
        });
        if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
}


export default function JournalEditor() {
  const [tableName, setTableName] = useState();
  const [tablesList, setTablesList] = useState([]);
  const [calendarDate, setCalendarDate] = useState(dayjs().utc().startOf('day'));
  const [markedDates, setMarkedDates] = useState([]); // Добавляем состояние для хранения отмеченных дат
  const [allRecordDates, setAllRecordsDates] = useState([]);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
  const [newRecordDialogOpen, setNewRecordDialogOpen] = useState(false);
  const [tableSurvey, setTableSurvey] = useState(null);
  const [currentPage, setCurrentPage] = useState(-1);

  const editorRef = useRef();

  useMemo(async () => {
    const data = await fetchTablesList();
    setTablesList(data);
  }, []);

  async function fetchMarkedDates(tableName, month, year, timezone) {
    if (!timezone) timezone = new Date().getTimezoneOffset();
    // console.log(`Fetching dates with tableName: ${tableName}, month: ${month}, year: ${year}, timezone: ${timezone}`)
    const data = await fetchDatesList(tableName, month, year, timezone);
    const dates = data.days || [];
    const survey = data.survey;
    const newAllRecoredsDates = data.unique_dates || [];
    setAllRecordsDates(newAllRecoredsDates);
    setTableSurvey(survey);
    const formattedDates = dates.map(date => dayjs(date).format('YYYY-MM-DD')); // Приводим даты к формату YYYY-MM-DD
    return formattedDates;
  }

  async function handleDateChange(newValue) {
    const utcDate = dayjs(newValue).utc().startOf('day');
    setCalendarDate(utcDate);

    if (!tableName) return;

    const records = await fetchTableData(tableName, utcDate.toISOString());
    editorRef?.current.setBlocks(records);

    const formattedDate = utcDate.format('YYYY-MM-DD');
    const pageIndex = allRecordDates.findIndex(date => dayjs(date).format('YYYY-MM-DD') === formattedDate);

    if (pageIndex !== -1) {
        setCurrentPage(pageIndex + 1);
    }
  }

  async function handlePaginationDateChange(event, page) {
    setCurrentPage(page);

    const newDate = allRecordDates[page - 1];
    // console.log(newDate)

    const newCalendarDate = dayjs(newDate).local().startOf('day');
    setCalendarDate(newCalendarDate);

    if (!tableName) return;

    const records = await fetchTableData(tableName, newDate);
    editorRef?.current.setBlocks(records);
  }

  async function handleTableChange(newValue) {
    setTableName(newValue);
    if (!newValue) return;
    editorRef?.current?.setBlocks([{}]);
    const month = calendarDate.month() + 1;
    const year = calendarDate.year();
    const formattedDates = await fetchMarkedDates(newValue, month, year);
    // console.log('Formatted dates:', formattedDates);
    setMarkedDates(formattedDates);
  }

  async function handleMonthChange(newMonth) {
    const month = newMonth.month() + 1;
    const year = newMonth.year();
    if (tableName) {
      const formattedDates = await fetchMarkedDates(tableName, month, year);
      setMarkedDates(formattedDates);
    }
  }

  async function handleSaveClick() {
    if (!editorRef.current) return;

    const result = await updateRecordFromBlocks(tableName, editorRef.current.getBlocks());
    if (result.success) {
      setIsUpdateSuccess(true);
      setTimeout(() => setIsUpdateSuccess(false), 5000);
    }
  }

  // Функция для отключения дат, на которые нет записей
  const shouldDisableDate = (date) => {
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    return !markedDates?.includes(formattedDate);
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

  return (
    <Box display="flex" justifyContent="space-between" gap={0.5} height={'100%'} width={'100%'}>
      <Box>
        <Autocomplete
          disablePortal
          id="combo-box-demo"
          options={tablesList || []}
          sx={{ width: '100%', padding: 1 }}
          renderInput={(params) => <TextField {...params} label="Таблица" />}
          onChange={(event, newValue) => handleTableChange(newValue?.src || null)}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            value={calendarDate}
            onChange={(newValue) => handleDateChange(newValue)}
            onMonthChange={handleMonthChange} // Обработчик смены месяца
            shouldDisableDate={shouldDisableDate} // Функция для отметки доступных дат
          />
        </LocalizationProvider>
        <Button onClick={handleSaveClick}>Сохранить</Button>
        {isUpdateSuccess &&
          <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
            Запись обновлена
          </Alert>}
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', height: '100%', width: '100%', flexDirection: 'column', display: 'flex', paddingBottom: 2}}>
          {/* { tableName && calendarDate ? */}
          <Box sx={{ height: '95%', width: '100%'}}>
            <Button onClick={handleNewRecordDialogOpen}>
              Добавить запись на сегодня
            </Button>
            <Box sx={{flexGrow: 1, overflowY: 'auto', height: '90%'}}>
              <NotionEditor ref={editorRef} />
            </Box>
          </Box>
          {allRecordDates?.length > 0 ?
            <Pagination
              count={allRecordDates.length}
              page={currentPage} // Текущая страница
              onChange={handlePaginationDateChange}
              variant="outlined"
            />
          : null}
      </Box>
      <NewRecordDialog
        open={newRecordDialogOpen}
        handleClose={handleDialogClose}
        tableSurvey={tableSurvey}
        tablesList={tablesList}
        onTableChange={handleTableChange}
      />
    </Box>
  );
}
