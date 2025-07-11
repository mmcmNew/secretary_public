import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useSignOut from 'react-auth-kit/hooks/useSignOut';

export default function AccountButton() {
  const auth = useAuthUser();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const user = auth();

  if (!user) return null;

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
    signOut();
    navigate('/login');
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Avatar sx={{ width: 32, height: 32 }}>
          {user.user_name?.charAt(0).toUpperCase()}
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
