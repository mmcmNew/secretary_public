import { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  useSendMessageToAIMutation,
  useAiPostGenerateMutation,
  usePostRecordToSocialsMutation,
  useGetAllFiltersQuery,
  useGetFilteredDataMutation,
  useGetTableDataQuery,
  useGetDatesListQuery,
  useGetTablesListQuery,
  useUpdateRecordFromBlocksMutation,
  useGenerateImageForRecordMutation,
} from '../../../store/chatApi';

dayjs.extend(utc);

const editorsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_EDITORS':
      return action.payload;
    case 'SET_STATUS':
      return state.map((ed, i) =>
        i === action.index ? { ...ed, [action.key]: action.value } : ed
      );
    case 'SET_CHECKED':
      return state.map((ed, i) =>
        i === action.index ? { ...ed, checked: action.checked } : ed
      );
    case 'SET_ALL_CHECKED':
      return state.map((ed) => ({ ...ed, checked: action.checked }));
    case 'SET_AI_RESPONSE':
      return state.map((ed, i) =>
        i === action.index ? { ...ed, aiResponse: action.value } : ed
      );
    case 'SET_HAS_UNSAVED':
      return state.map((ed, i) =>
        i === action.index ? { ...ed, hasUnsavedChanges: true } : ed
      );
    case 'CLEAR_UNSAVED':
      return state.map((ed, i) =>
        i === action.index ? { ...ed, hasUnsavedChanges: false } : ed
      );
    case 'UPDATE_RECORD_FIELD':
      return state.map((ed, i) => {
        if (i !== action.index) return ed;
        return {
          ...ed,
          record: {
            ...ed.record,
            [action.field]: action.value,
          },
        };
      });
    default:
      return state;
  }
};

export default function useJournalEditor() {
  const [tableName, setTableName] = useState();
  const [tablesList, setTablesList] = useState([]);
  const [calendarDate, setCalendarDate] = useState(dayjs().utc().startOf('day'));
  const [markedDates, setMarkedDates] = useState([]);
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

  const editorRefs = useRef([]);
  const [editors, dispatchEditors] = useReducer(editorsReducer, []);

  const { data: tablesListData } = useGetTablesListQuery();
  const [sendMessageToAI] = useSendMessageToAIMutation();
  const [aiPostGenerate] = useAiPostGenerateMutation();
  const [postRecordToSocials] = usePostRecordToSocialsMutation();
  const { data: allFiltersData } = useGetAllFiltersQuery(tableName, { skip: !tableName });
  const [getFilteredData] = useGetFilteredDataMutation();
  const { data: tableData } = useGetTableDataQuery({ tableName, date: calendarDate.toISOString() }, { skip: !tableName });
  const { data: datesListData } = useGetDatesListQuery({ tableName, month: calendarDate.month() + 1, year: calendarDate.year(), timezone: new Date().getTimezoneOffset() }, { skip: !tableName });
  const [updateRecordFromBlocks] = useUpdateRecordFromBlocksMutation();
  const [generateImageForRecord] = useGenerateImageForRecordMutation();


  useEffect(() => {
    if (tablesListData) {
      setTablesList(tablesListData.tables);
    }
  }, [tablesListData]);

  useEffect(() => {
    const order = tableSurvey?.fields?.map((f) => f.field_id) || [];
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
      saveStatus: 'idle',
      aiResponseStatus: 'idle',
      sendToSocialsStatus: 'idle',
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

  const handleDateChange = useCallback(
    async (newValue) => {
      dispatchEditors({ type: 'SET_EDITORS', payload: [] });
      const utcDate = dayjs(newValue).utc().startOf('day');
      setCalendarDate(utcDate);
      setFilters({});

      if (!tableName) return;

      if (tableData) {
        setRecords(tableData.records || []);
      }

      const formattedDate = utcDate.format('YYYY-MM-DD');
      const pageIndex = allRecordDates.findIndex(
        (date) => dayjs(date).format('YYYY-MM-DD') === formattedDate
      );

      if (pageIndex !== -1) {
        setCurrentPage(pageIndex + 1);
      }
    },
    [tableName, allRecordDates, tableData]
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    if (tableName) {
      handleDateChange(calendarDate.toDate());
    }
  }, [tableName, calendarDate, handleDateChange]);

  const applyFilters = async () => {
    if (!tableName) return;
    const hasFilters = Object.values(filters).some(
      (v) =>
        (Array.isArray(v) && v.length) ||
        (!Array.isArray(v) && v !== undefined && v !== null && v !== '')
    );
    if (!hasFilters) return;
    dispatchEditors({ type: 'SET_EDITORS', payload: [] });
    setRecords([]);

    setLoadingFilteredRecords(true);
    try {
      const data = await getFilteredData({ tableName, filters }).unwrap();
      setRecords(data.records || []);
    } finally {
      setLoadingFilteredRecords(false);
    }
  };

  async function fetchMarkedDates(name, month, year, timezone) {
    if (!timezone) {
      timezone = new Date().getTimezoneOffset();
    }
    if (datesListData) {
      const dates = datesListData.days || [];
      const survey = datesListData.survey;
      setTableSurvey(survey);
      const newAllRecoredsDates = datesListData.unique_dates || [];
      setAllRecordsDates(newAllRecoredsDates);
      const formattedDates = dates.map((date) => dayjs(date).format('YYYY-MM-DD'));
      return formattedDates;
    }
    return [];
  }

  const handlePaginationDateChange = useCallback(
    async (event, page) => {
      setCurrentPage(page);
      dispatchEditors({ type: 'SET_EDITORS', payload: [] });
      setFilters({});

      const newDate = allRecordDates[page - 1];
      const newCalendarDate = dayjs(newDate).local().startOf('day');
      setCalendarDate(newCalendarDate);

      if (!tableName) return;

      if (tableData) {
        setRecords(tableData.records || []);
      }
    },
    [allRecordDates, tableName, tableData]
  );

  const handleTableChange = useCallback(
    async (newValue) => {
      setTableName(newValue);
      setRecords([]);
      setFilters({});
      setDropdownValues({});

      if (!newValue) return;
      const month = calendarDate.month() + 1;
      const year = calendarDate.year();
      const formattedDates = await fetchMarkedDates(newValue, month, year);
      setMarkedDates(formattedDates);

      if (allFiltersData) {
        setDropdownValues(allFiltersData);
      }
    },
    [calendarDate, allFiltersData]
  );

  const handleMonthChange = useCallback(
    async (newMonth) => {
      const month = newMonth.month() + 1;
      const year = newMonth.year();
      if (tableName) {
        const formattedDates = await fetchMarkedDates(tableName, month, year);
        setMarkedDates(formattedDates);
      }
    },
    [tableName]
  );

  const handleSaveSingle = useCallback(
    async (index) => {
      dispatchEditors({ type: 'SET_STATUS', index, key: 'saveStatus', value: 'saving' });

      const refs = editors[index].ref;
      const record = { id: editors[index].record.id };
      const order = tableSurvey?.fields?.map((f) => f.field_id) || Object.keys(refs);
      for (const field of order) {
        const r = refs[field]?.current;
        if (r && r.getMarkdown) {
          record[field] = await r.getMarkdown();
        }
      }

      await updateRecordFromBlocks({ tableName, records: [record] }).unwrap();

      dispatchEditors({ type: 'SET_STATUS', index, key: 'saveStatus', value: 'success' });
      dispatchEditors({ type: 'CLEAR_UNSAVED', index });

      setTimeout(() => {
        dispatchEditors({ type: 'SET_STATUS', index, key: 'saveStatus', value: 'idle' });
      }, 3000);
    },
    [tableSurvey, tableName, editors, updateRecordFromBlocks]
  );

  const shouldDisableDate = useCallback(
    (date) => {
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      return !markedDates?.includes(formattedDate);
    },
    [markedDates]
  );

  const handleNewRecordDialogOpen = useCallback(() => {
    setNewRecordDialogOpen(true);
  }, []);

  const addRecord = useCallback(async () => {
    setNewRecordDialogOpen(false);
    const todayUtcDate = dayjs().utc().startOf('day');
    setCalendarDate(todayUtcDate);
    await handleTableChange(tableName);
    await handleDateChange(todayUtcDate.toDate());
  }, [tableName, handleTableChange, handleDateChange]);

  const handleDialogClose = useCallback(() => {
    setNewRecordDialogOpen(false);
    addRecord();
  }, [addRecord]);

  const handleAIPostGenerate = useCallback(async () => {
    const records_ids = editors.map((editor) => editor.record?.id).filter(Boolean);
    if (!records_ids.length) return;
    setIsPostGenerate('loading');
    try {
      const result = await aiPostGenerate({ records_ids, table_name: tableName, type: 'post' }).unwrap();
      if (!result) {
        console.error('Ошибка при генерации поста:', 'Нет ответа от ИИ');
        setIsPostGenerate('error');
        setTimeout(() => {
          setIsPostGenerate('wait');
        }, 5000);
        return;
      }
      setIsPostGenerate('success');
      setTimeout(() => {
        setIsPostGenerate('wait');
      }, 5000);
    } catch (e) {
      console.error('Ошибка при генерации поста:', e);
      setIsPostGenerate('error');
      setTimeout(() => {
        setIsPostGenerate('wait');
      }, 5000);
    }
  }, [editors, tableName, aiPostGenerate]);

  const handlePostRecordToSocials = useCallback(
    async (index, type = 'post') => {
      const editorFields = editors[index]?.ref;
      const recordId = editors[index]?.record?.id;
      if (!editorFields || !recordId) return;

      if (tableName !== 'posts_journal') {
        console.log('Публикация пока доступна только из таблицы постов');
        return;
      }

      try {
        dispatchEditors({ type: 'SET_STATUS', index, key: 'sendToSocialsStatus', value: 'loading' });

        await postRecordToSocials({ records_ids: [recordId], table_name: tableName, type }).unwrap();

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
    },
    [editors, tableName, postRecordToSocials]
  );

  const handleAIEnhance = useCallback(
    async (index, type = 'fix') => {
      const editorFields = editors[index]?.ref;
      const recordId = editors[index]?.record?.id;
      if (!editorFields || !recordId) return;

      let mdRecord = '';
      for (const field in editorFields) {
        const ref = editorFields[field].current;
        if (ref && ref.getMarkdown) {
          mdRecord += await ref.getMarkdown() + '\n';
        }
      }
      mdRecord = mdRecord.trim();

      if (!mdRecord || !tableName) {
        console.error('Нет ID записи или названия таблицы');
        return;
      }

      try {
        dispatchEditors({ type: 'SET_STATUS', index, key: 'aiResponseStatus', value: 'loading' });
        const result = await sendMessageToAI({ record: mdRecord, table_name: tableName, type }).unwrap();

        dispatchEditors({ type: 'SET_AI_RESPONSE', index, value: result || 'Нет ответа' });
        dispatchEditors({ type: 'SET_STATUS', index, key: 'aiResponseStatus', value: 'idle' });
      } catch (e) {
        dispatchEditors({ type: 'SET_AI_RESPONSE', index, value: 'Возникла ошибка при получении ответа от ИИ. Повтрорите запрос' });
        dispatchEditors({ type: 'SET_STATUS', index, key: 'aiResponseStatus', value: 'idle' });
      }
    },
    [editors, tableName, sendMessageToAI]
  );

  const handleGenerateImage = useCallback(
    async (index) => {
      dispatchEditors({ type: 'SET_STATUS', index, key: 'imageGenerateStatus', value: 'loading' });
      const fieldRefs = editorRefs.current[index] || {};
      const recordId = editors[index]?.record?.id;
      if (!recordId) return;
      let text = '';
      for (const key in fieldRefs) {
        const ref = fieldRefs[key].current;
        if (ref && ref.getMarkdown) text += await ref.getMarkdown() + '\n';
      }
      text = text.trim();
      try {
        await generateImageForRecord({
          table_name: tableName,
          record_id: recordId,
          text,
        }).unwrap();
        dispatchEditors({ type: 'SET_STATUS', index, key: 'imageGenerateStatus', value: 'idle' });
      } catch (e) {
        alert('Ошибка генерации изображения: ' + (e?.message || e));
        dispatchEditors({ type: 'SET_STATUS', index, key: 'imageGenerateStatus', value: 'idle' });
      }
    },
    [tableName, editors, generateImageForRecord]
  );

  return {
    tableName,
    tablesList,
    calendarDate,
    markedDates,
    newRecordDialogOpen,
    tableSurvey,
    allRecordDates,
    currentPage,
    records,
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
  };
}
