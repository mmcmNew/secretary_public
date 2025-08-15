import { useState } from 'react';

export default function useContextMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = (event) => {
    event.preventDefault(); // Предотвращаем браузерный контекст
    setAnchorEl(event.currentTarget);
  };
  const closeMenu = () => setAnchorEl(null);
  return { anchorEl, openMenu, closeMenu };
}