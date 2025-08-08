import { useState } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Button, TextField, Box, Typography, Container, CircularProgress, Divider } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation, useGetDemoTokenMutation } from './store/api/authApi';

export default function SignInPage({ isModal = false, onAuthSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [login, { isLoading, error }] = useLoginMutation();
  const [getDemoToken, { isLoading: isDemoLoading }] = useGetDemoTokenMutation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login({ email, password }).unwrap();
      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        // Navigate to the page they tried to visit when they were redirected to login
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Ошибки обрабатываются состоянием error из useLoginMutation
      console.error('Failed to login: ', err);
    }
  };

  const renderContent = () => (
    <Box
      sx={{
        marginTop: isModal ? 2 : 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {!isModal && (
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
      )}
      <Typography component="h1" variant="h5">
        Sign in
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!error}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!error}
        />
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error.data?.error || 'An unexpected error occurred.'}
          </Typography>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
        {!isModal && (
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/register')}
            sx={{ mb: 2 }}
          >
            Register
          </Button>
        )}
        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            или
          </Typography>
        </Divider>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={async () => {
            try {
              await getDemoToken().unwrap();
              if (onAuthSuccess) {
                onAuthSuccess();
              } else {
                // Navigate to the page they tried to visit when they were redirected to login
                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });
              }
            } catch (err) {
              console.error('Failed to get demo access:', err);
            }
          }}
          disabled={isDemoLoading}
        >
          {isDemoLoading ? <CircularProgress size={24} /> : 'Попробовать демо-режим'}
        </Button>
      </Box>
    </Box>
  );

  if (isModal) {
    return renderContent();
  }

  return (
    <Container component="main" maxWidth="xs">
      {renderContent()}
    </Container>
  );
}

SignInPage.propTypes = {
  isModal: PropTypes.bool,
  onAuthSuccess: PropTypes.func,
};
