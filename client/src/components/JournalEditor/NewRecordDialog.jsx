import { useEffect, useState } from 'react';
import { PropTypes } from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Box } from '@mui/system';
import Survey from '../Scenario/Survey';
import { Autocomplete, TextField } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import axios from 'axios';
import { apiGet } from '../../utils/api';

dayjs.extend(utc);

async function fetchTablesList() {
    try {
      const data = await apiGet('/get_tables');
      return data.tables;
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
}

async function fetchDatesList(tableName, month, year, timezone) {
//   console.log(`Fetching dates with tableName: ${tableName}, month: ${month}, year: ${year}`);

  // Добавление ведущего нуля к месяцу, если он меньше 10
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;

  try {
    const { data } = await apiGet(`/get_days?table_name=${tableName}&month=${formattedMonth}&year=${year}&timezone=${timezone}`);

    if (data) {
      // console.log('Days:', data.days);
      return data;
    } else {
      console.warn('No days found in response data:', data);
      return []; // Возвращаем пустой массив, если данных нет
    }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
}


export default function NewRecordDialog({ open, handleClose, taskId =null, tableSurvey=null, tablesList=null, onTableChange }) {
  const [tempTablesList, setTempTablesList] = useState(tablesList || []);
  const [tempTableSurvey, setTempTableSurvay] = useState(tableSurvey || null);

  useEffect(() => {
    const fetchTables = async () => {
      const data = await fetchTablesList();
      // console.log(data);
      setTempTablesList(data);
    };
    if (!tablesList) {
      // console.log('fetching tables');
      fetchTables();
    }
  }, []);

  useEffect(() => {
    // console.log(tablesList);
    if (tablesList)
      setTempTablesList(tablesList);
  }, [tablesList]);

  useEffect(() => {
    // console.log(tableSurvey);
    if (tableSurvey)
      setTempTableSurvay(tableSurvey);
  }, [tableSurvey])

  function handleCloseClick() {
    if (handleClose) handleClose();
  }

  async function handleTableChange(newValue, timezone=null) {
    if (onTableChange) onTableChange(newValue);
    else {
      if (!newValue) return;
      const utcDate = dayjs().utc().startOf('day');
      const month = utcDate.month() + 1;
      const year = utcDate.year();
      if (!timezone) timezone = new Date().getTimezoneOffset();
    // console.log(`Fetching dates with tableName: ${tableName}, month: ${month}, year: ${year}, timezone: ${timezone}`)
      const data = await fetchDatesList(newValue, month, year, timezone);
      const survey = data.survey;
      // console.log(newValue, utcDate, data);
      setTempTableSurvay(survey);
    }
  }

  // console.log('tempTableSurvey', tempTableSurvey)

  return (
    <Dialog
      open={open}
      onClose={handleCloseClick}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
    >
      <DialogTitle id="scroll-dialog-title">Добавить новую запись</DialogTitle>
      <DialogContent dividers={scroll === 'paper'} style={{ width: '500px', minHeight: '500px' }}>
        { tempTablesList && tempTablesList.length > 0 &&
          <Autocomplete
            disablePortal
            id="combo-box-demo"
            options={tempTablesList || []}
            sx={{ width: '100%', padding: 1 }}
            renderInput={(params) => <TextField {...params} label="Таблица" />}
            onChange={(event, newValue) => handleTableChange(newValue?.src || null)}
          />
        }
        { tempTableSurvey &&
          <Box>
            <Survey key={'addRecordSurvey'} id={'addRecordSurvey'} survey={tempTableSurvey} activeElementId={null} onExpireFunc={null} autosend={false} taskId={taskId} />
          </Box>
        }
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseClick}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}

NewRecordDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func,
  tableSurvey: PropTypes.object,
  tablesList: PropTypes.array,
  onTableChange: PropTypes.func,
  taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
