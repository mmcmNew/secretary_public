import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMeQuery } from '../../store/api/authApi';
import { setCredentials, logout, authLoadingDone } from '../../store/authSlice';
import { Box, CircularProgress } from '@mui/material';

function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { accessToken, isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  // Пробуем получить данные пользователя, если есть токен, но нет данных пользователя
  const { data: userData, isFetching, isError } = useGetMeQuery(undefined, {
    skip: !accessToken || !!user,
  });

  useEffect(() => {
    if (!isFetching) {
      if (userData) {
        // Если пользователь успешно загружен, сохраняем его данные
        dispatch(setCredentials({ user: userData, accessToken }));
      } else if (isError && accessToken) {
        // Если токен есть, но он невалиден, выходим из системы
        dispatch(logout());
      }
      // В любом случае, завершаем начальную загрузку
      dispatch(authLoadingDone());
    }
  }, [userData, isFetching, isError, accessToken, dispatch]);

  // Пока идет первоначальная проверка, показываем спиннер
  if (isLoading && isFetching) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return children;
}

export default AuthInitializer;