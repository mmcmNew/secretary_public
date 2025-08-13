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
