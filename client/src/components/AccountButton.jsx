import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Menu, MenuItem, IconButton, Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { logout } from '../store/authSlice';

export default function AccountButton() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { isAuthenticated, user } = useSelector(state => state.auth);
  // console.log(`AccountButton: isAuthenticated=${isAuthenticated}, user=${user?.name}`);

  const handleLoginClick = () => {
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <Button color="inherit" onClick={handleLoginClick}>
        Войти
      </Button>
    );
  }

  // Если пользователь аутентифицирован, но данные еще не загружены, ничего не показываем
  if (isAuthenticated && !user) {
    return null;
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/account');
    handleClose();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Avatar sx={{ width: 32, height: 32 }}>
          {user?.user_name?.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} onClick={handleClose}>
        <MenuItem onClick={handleProfile}>
          <PersonIcon sx={{ mr: 1 }} />
          Профиль
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Выход
        </MenuItem>
      </Menu>
    </>
  );
}
