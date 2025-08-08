
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
import { useGetTablesListQuery, useGetDatesListQuery } from '../../store/chatApi';

dayjs.extend(utc);

export default function NewRecordDialog({ open, handleClose, taskId =null, tableSurvey=null, tablesList=null, onTableChange }) {
  const [tempTablesList, setTempTablesList] = useState(tablesList || []);
  const [tempTableSurvey, setTempTableSurvay] = useState(tableSurvey || null);
  const { data: tablesListData } = useGetTablesListQuery(null, { skip: !!tablesList });
  const [triggerDatesList, { data: datesListData }] = useLazyGetDatesListQuery();

  useEffect(() => {
    if (tablesListData) {
      setTempTablesList(tablesListData.tables);
    }
  }, [tablesListData]);

  useEffect(() => {
    if (tablesList) {
      setTempTablesList(tablesList);
    }
  }, [tablesList]);

  useEffect(() => {
    if (tableSurvey) {
      setTempTableSurvay(tableSurvey);
    }
  }, [tableSurvey]);

  useEffect(() => {
    if (datesListData) {
      setTempTableSurvay(datesListData.survey);
    }
  }, [datesListData]);

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
      triggerDatesList({ tableName: newValue, month, year, timezone });
    }
  }

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

