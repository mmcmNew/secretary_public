import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMeQuery } from '../../store/api/authApi';
import { setCredentials, logout, authLoadingDone } from '../../store/authSlice';
import { apiSlice } from '../../store/api/apiSlice'; // Импорт apiSlice
import { Box, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import { dashboardApi } from '../../store/api/dashboardApi';

function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { accessToken, user, isLoading } = useSelector((state) => state.auth);

  // Пробуем получить данные пользователя, если есть токен, но нет данных пользователя
  const { data: userData, isFetching, isError, isSuccess, refetch } = useGetMeQuery(undefined, {
    // Выполняем запрос, если есть токен и нет данных пользователя
    skip: !accessToken || !!user,
  });

  useEffect(() => {
    // Если есть токен, но нет данных пользователя, явно запускаем запрос
    if (accessToken && !user && !isFetching) {
      refetch();
    }
  }, [accessToken, user, isFetching, refetch]);

  useEffect(() => {
    // Если запрос выполнен (успешно или с ошибкой) и мы еще не завершили загрузку
    if (!isFetching && isLoading) {
      if (isSuccess && userData) {
        dispatch(setCredentials({ user: userData, accessToken }));
        dispatch(dashboardApi.endpoints.getDashboard.initiate(userData.last_dashboard_id));
        
        // Сброс кэша RTK Query
        dispatch(apiSlice.util.resetApiState());
      } else if (isError && accessToken) {
        // Если токен есть, но он невалиден, выходим из системы
        dispatch(logout());
      }
      // В любом случае, завершаем начальную загрузку
      dispatch(authLoadingDone());
    }
  }, [userData, isFetching, isError, isSuccess, accessToken, dispatch, isLoading, user]);

  // Пока идет первоначальная проверка, показываем спиннер
  if (isLoading) {
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

AuthInitializer.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthInitializer;