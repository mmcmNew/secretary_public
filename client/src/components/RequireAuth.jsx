import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function RequireAuth() {
  const { isAuthenticated, isLoading } = useSelector(state => state.auth);
  const location = useLocation();

  if (isLoading) {
    // Показываем спиннер пока идет проверка аутентификации
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Outlet />;
  }

  // Redirect unauthorized users to login page, saving their intended destination
  return <Navigate to="/login" state={{ from: location }} replace />;
}
