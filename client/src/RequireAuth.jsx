import { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext.jsx';

export default function RequireAuth({ children }) {
  const { user, fetchCurrentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      if (!user) {
        await fetchCurrentUser();
      }
      setLoading(false);
    }
    check();
  }, [user, fetchCurrentUser]);

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
