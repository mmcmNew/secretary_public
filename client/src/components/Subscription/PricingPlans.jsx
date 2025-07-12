import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, Typography, Button, Grid, 
    List, ListItem, ListItemIcon, ListItemText, Chip
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import { apiGet, apiPost } from '../../utils/api';

export default function PricingPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await apiGet('/api/subscription-plans');
            setPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToPlan = async (planId) => {
        try {
            await apiPost(`/api/subscribe/${planId}`);
            alert('Подписка оформлена!');
            navigate('/account');
        } catch (error) {
            console.error('Failed to subscribe:', error);
            alert('Ошибка при оформлении подписки');
        }
    };

    const handlePayment = (planId, planName, price) => {
        // Заглушка для функции оплаты
        alert(`Переход к оплате тарифа "${planName}" за ${price}₽`);
        // Здесь будет интеграция с платежной системой
    };

    if (loading) return <Typography>Загрузка тарифов...</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Button 
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/account')}
                    variant="outlined"
                >
                    Назад
                </Button>
            </Box>
            
            <Typography variant="h4" align="center" gutterBottom>
                Выберите тариф
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
                {plans.map((plan) => (
                    <Grid item xs={12} md={4} key={plan.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    {plan.name}
                                    {plan.name === 'Premium' && (
                                        <Chip label="Популярный" color="secondary" size="small" sx={{ ml: 1 }} />
                                    )}
                                </Typography>
                                
                                <Typography variant="h4" color="primary" gutterBottom>
                                    {plan.price === 0 ? 'Бесплатно' : `${plan.price}₽/мес`}
                                </Typography>
                                
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                                        <ListItemText primary={`До ${plan.max_containers === -1 ? '∞' : plan.max_containers} контейнеров`} />
                                    </ListItem>
                                    {plan.features.map((feature, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                                            <ListItemText primary={feature} />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                            
                            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {plan.price === 0 ? (
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        disabled
                                    >
                                        Текущий план
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={() => handlePayment(plan.id, plan.name, plan.price)}
                                            color="primary"
                                        >
                                            Оплатить {plan.price}₽
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => subscribeToPlan(plan.id)}
                                            size="small"
                                        >
                                            Активировать бесплатно
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}