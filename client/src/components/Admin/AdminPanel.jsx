import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Select, MenuItem
} from '@mui/material';
import { useAccessControl } from '../../contexts/AccessControlContext';
import axios from 'axios';


export default function AdminPanel() {
    const { hasAccess } = useAccessControl();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [availableModules, setAvailableModules] = useState([]);
    
    useEffect(() => {
        fetchUsers();
        fetchPlans();
        fetchAvailableModules();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await axios.get('/api/subscription-plans');
            setPlans(response.data);
        } catch (e) {
            console.error('Failed to fetch plans:', e);
        }
    };

    const fetchAvailableModules = async () => {
        try {
            const response = await axios.get('/api/admin/available-modules');
            setAvailableModules(response.data);
        } catch (e) {
            console.error('Failed to fetch modules list:', e);
        }
    };

    const updateUserPlan = async (userId, planId) => {
        try {
            await axios.post(`/api/admin/users/${userId}/plan`, { plan_id: planId });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update plan:', error);
        }
    };

    const updateUserModules = async (userId, modules) => {
        try {
            await axios.post(`/api/admin/users/${userId}/modules`, { modules });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update modules:', error);
        }
    };


    if (loading) return <Typography>Загрузка...</Typography>;

    if (!hasAccess('admin')) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h5" color="error">
                    Доступ запрещен
                </Typography>
                <Typography variant="body1">
                    У вас нет прав для доступа к панели администратора
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Панель администратора
            </Typography>
            
            <Paper sx={{ mt: 2 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Имя пользователя</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Тариф</TableCell>
                                <TableCell>Модули</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={user.plan_id || ''}
                                            onChange={(e) => updateUserPlan(user.id, e.target.value)}
                                            size="small"
                                        >
                                            {plans.map((plan) => (
                                                <MenuItem key={plan.id} value={plan.id}>
                                                    {plan.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            multiple
                                            value={user.modules || []}
                                            onChange={(e) => updateUserModules(user.id, e.target.value)}
                                            size="small"
                                            renderValue={(selected) => selected.join(', ')}
                                        >
                                            {availableModules.map((m) => (
                                                <MenuItem key={m} value={m}>{m}</MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );}