import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store/authSlice';
import { Button, Container, Typography, Box, Card, CardContent, Chip, Tabs, Tab } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import JournalManager from './components/JournalManager/JournalManager.jsx';
import TaskTypeManager from './components/TaskTypeManager/TaskTypeManager.jsx';
// import { apiGet } from './utils/api.js';

export default function AccountPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const { data: subscription } = useQuery(['subscription'], async () => {
    // const { data } = await apiGet('/api/user/subscription');
    // return data;
  });
  const { user } = useSelector(state => state.auth);

  if (!user) return null;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Container sx={{ mt: 8 }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} variant="outlined">
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
                  <Chip label={subscription.plan_name} color={subscription.is_active ? 'primary' : 'default'} variant={subscription.is_active ? 'filled' : 'outlined'} />
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
