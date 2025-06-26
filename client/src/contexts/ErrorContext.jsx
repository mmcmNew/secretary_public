import React, { createContext, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export const ErrorContext = createContext({ setError: () => {} });

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const handleSetError = useCallback((err) => {
    setError(err);
    setOpen(true);
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ErrorContext.Provider value={{ setError: handleSetError }}>
      {children}
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
          {error && (error.message || String(error))}
        </Alert>
      </Snackbar>
    </ErrorContext.Provider>
  );
} 