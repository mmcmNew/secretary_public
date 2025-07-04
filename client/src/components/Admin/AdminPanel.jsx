import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Select, MenuItem, Button, Chip
} from '@mui/material';
import { useAccessControl } from '../../contexts/AccessControlContext';
import axios from 'axios';

const ACCESS_LEVELS = {
    1: { name: 'Free', color: 'default' },
    2: { name: 'Basic', color: 'primary' },
    3: { name: 'Premium', color: 'secondary' },
    4: { name: 'Admin', color: 'error' }
};

export default function AdminPanel() {
    const { hasAccess } = useAccessControl();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
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

    useEffect(() => {
        fetchUsers();
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

    const updateUserAccessLevel = async (userId, newLevel) => {
        try {
            await axios.post(`/api/admin/users/${userId}/access-level`, {
                access_level: newLevel
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update access level:', error);
        }
    };

    if (loading) return <Typography>Загрузка...</Typography>;

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
                                <TableCell>Уровень доступа</TableCell>
                                <TableCell>Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={ACCESS_LEVELS[user.access_level_id]?.name || 'Free'}
                                            color={ACCESS_LEVELS[user.access_level_id]?.color || 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={user.access_level_id || 1}
                                            onChange={(e) => updateUserAccessLevel(user.id, e.target.value)}
                                            size="small"
                                        >
                                            {Object.entries(ACCESS_LEVELS).map(([level, data]) => (
                                                <MenuItem key={level} value={parseInt(level)}>
                                                    {data.name}
                                                </MenuItem>
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
    );
}