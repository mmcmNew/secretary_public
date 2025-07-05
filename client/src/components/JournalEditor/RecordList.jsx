import React from 'react';
import PropTypes from 'prop-types';
import { Box, Checkbox } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';
import RecordEditor from './RecordEditor';

function RecordList({
  editors,
  tableSurvey,
  dispatchEditors,
  handleSaveSingle,
  handleAIEnhance,
  handleGenerateImage,
  handlePostRecordToSocials,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexGrow: 1,
        flexDirection: 'column',
        gap: 2,
        overflowY: 'none',
        height: '98%',
        marginTop: 1,
        paddingBottom: 2,
        border: editors.some((ed) => ed.hasUnsavedChanges)
          ? '2px solid #f44336'
          : '2px solid #ccc',
        borderRadius: 2,
        padding: 2,
        transition: 'border-color 0.3s ease',
      }}
    >
      {editors.length > 0 && (
        <Box sx={{ marginLeft: 0 }}>
          <Checkbox
            checked={editors.every((editor) => editor.checked)}
            onChange={(e) =>
              dispatchEditors({
                type: 'SET_ALL_CHECKED',
                checked: e.target.checked,
              })
            }
          />
          Выбрать все
        </Box>
      )}
      <Virtuoso
        style={{
          height: '100%',
          flexGrow: 1,
          border: '2px solid #ccc',
          borderRadius: 0,
          padding: 0,
          transition: 'border-color 0.3s ease',
        }}
        data={editors}
        itemKey={(index, item) => item.record?.id || index}
        itemContent={(index, editor) => (
          <RecordEditor
            key={editor.record?.id || index}
            editor={editor}
            index={index}
            tableSurvey={tableSurvey}
            onCheck={(idx, checked) =>
              dispatchEditors({ type: 'SET_CHECKED', index: idx, checked })
            }
            onSave={handleSaveSingle}
            onAIEnhance={handleAIEnhance}
            onGenerateImage={handleGenerateImage}
            onPostToSocials={handlePostRecordToSocials}
            dispatchEditors={dispatchEditors}
          />
        )}
      />
    </Box>
  );
}

RecordList.propTypes = {
  editors: PropTypes.array.isRequired,
  tableSurvey: PropTypes.object,
  dispatchEditors: PropTypes.func.isRequired,
  handleSaveSingle: PropTypes.func.isRequired,
  handleAIEnhance: PropTypes.func.isRequired,
  handleGenerateImage: PropTypes.func.isRequired,
  handlePostRecordToSocials: PropTypes.func.isRequired,
};

export default RecordList;
