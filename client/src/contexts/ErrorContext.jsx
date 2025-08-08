import { createContext, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';

export const ErrorContext = createContext({
  setError: () => {},
  setSuccess: () => {},
});

export function ErrorProvider({ children }) {
  const [notification, setNotification] = useState({ message: null, severity: 'info' });
  const [open, setOpen] = useState(false);

  const showMessage = useCallback((message, severity = 'info') => {
    setNotification({ message, severity });
    setOpen(true);
  }, []);

  const handleSetError = useCallback((err) => {
    const msg = err && err.message ? err.message : String(err);
    showMessage(msg, 'error');
  }, [showMessage]);

  const handleSetSuccess = useCallback((msg) => {
    showMessage(msg, 'success');
  }, [showMessage]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ErrorContext.Provider value={{ setError: handleSetError, setSuccess: handleSetSuccess }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </ErrorContext.Provider>
  );
}

ErrorProvider.propTypes = {
  children: PropTypes.node.isRequired,
};