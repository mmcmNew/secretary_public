import { styled } from '@mui/material/styles';
import { ListItemButton } from '@mui/material';

export const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  '&.Mui-selected': {
    backgroundColor: theme.palette.action.selected,
  },
  '&.Mui-selected:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

export const GroupLine = styled('div')(({ theme, open }) => ({
  position: 'absolute',
  left: 17,
  top: 52, // немного ниже заголовка
  bottom: open ? 0 : 'auto',
  width: 2,
  backgroundColor: theme.palette.divider,
}));

export const GroupChildrenWrapper = styled('div')({
  paddingLeft: 32,
  width: '100%',
});
