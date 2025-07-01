import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Account, AuthenticationContext, SessionContext } from '@toolpad/core';
import { AuthContext } from '../contexts/AuthContext.jsx';

export default function AccountButton() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const authentication = React.useMemo(
    () => ({
      signIn: () => navigate('/login'),
      signOut: async () => {
        await logout();
        navigate('/login');
      },
    }),
    [logout, navigate],
  );

  const session = React.useMemo(
    () =>
      user
        ? {
            user: {
              name: user.user_name,
              email: user.email,
            },
          }
        : null,
    [user],
  );

  return (
    <AuthenticationContext.Provider value={authentication}>
      <SessionContext.Provider value={session}>
        <Account />
      </SessionContext.Provider>
    </AuthenticationContext.Provider>
  );
}
