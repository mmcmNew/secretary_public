import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function RequireAuth({ loginPath = '/login' }) {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to={loginPath} state={{ from: location }} replace />
  );
}
