import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './contexts/AuthContext.jsx';
import { useAccessControl } from './contexts/AccessControlContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box, Card, CardContent, Chip, Tabs, Tab } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import JournalManager from './components/JournalManager/JournalManager.jsx';
import TaskTypeManager from './components/TaskTypeManager/TaskTypeManager.jsx';

export default function AccountPage() {
  const { user, fetchCurrentUser, logout } = useContext(AuthContext);
  const { hasAccess } = useAccessControl();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!user) {
      fetchCurrentUser();
    }
    fetchUserSubscription();
  }, [user, fetchCurrentUser]);

  const fetchUserSubscription = async () => {
    try {
      const response = await axios.get('/api/user/subscription');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Container sx={{ mt: 8 }}>
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
        >
          Назад
        </Button>
      </Box>
      
      <Typography variant="h4" gutterBottom>
        {user.user_name}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {user.email}
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Профиль" />
          <Tab label="Мои журналы" />
          <Tab label="Типы задач" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && (
        <Box sx={{ mt: 3 }}>
          {subscription && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Текущий тариф
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    label={subscription.plan_name}
                    color={subscription.is_active ? 'primary' : 'default'}
                    variant={subscription.is_active ? 'filled' : 'outlined'}
                  />
                  <Button 
                    variant="text" 
                    color="primary"
                    onClick={() => navigate('/pricing')}
                  >
                    Изменить тариф
                  </Button>
                </Box>
                {subscription.end_date && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Действует до: {new Date(subscription.end_date).toLocaleDateString('ru-RU')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {hasAccess('admin') && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/admin')}
              >
                Панель администратора
              </Button>
            )}
            
            <Button variant="outlined" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      )}
      
      {activeTab === 1 && (
        <Box sx={{ mt: 3 }}>
          <JournalManager />
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ mt: 3 }}>
          <TaskTypeManager />
        </Box>
      )}
    </Container>
  );
}

