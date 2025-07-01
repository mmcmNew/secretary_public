import React, { useContext, useEffect } from 'react';
import { AuthContext } from './contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography } from '@mui/material';

export default function AccountPage() {
  const { user, fetchCurrentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      fetchCurrentUser();
    }
  }, [user, fetchCurrentUser]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        {user.user_name}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {user.email}
      </Typography>
      <Button variant="outlined" onClick={handleLogout}>
        Logout
      </Button>
    </Container>
  );
}

