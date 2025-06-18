import { PropTypes } from 'prop-types';
import { Box, IconButton, Typography } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';

export default function FilesListComponent({files, setFiles}) {

  function handleRemoveFile(fileId) {
    setFiles(files.filter(file => file.lastModified !== fileId));
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        position: 'relative',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        backgroundColor: 'background.paper',
        p: 1,
        mb: 0,
        overflow: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        {files.map((file) => (
          <Box key={file.lastModified} sx={{ position: 'relative', textAlign: 'center' }}>
            <InsertDriveFileIcon fontSize="large" />
            <Typography variant="caption">{file.name}</Typography>
            <IconButton
              size="small"
              sx={{ position: 'absolute', top: 0, right: 0 }}
              onClick={() => handleRemoveFile(file.lastModified)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

FilesListComponent.propTypes = {
  files: PropTypes.array.isRequired,
  setFiles: PropTypes.func.isRequired,
};
