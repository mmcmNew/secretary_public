// App.js
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { memo } from 'react';
import { Provider } from 'react-redux';
import HomePage from './HomePage.jsx';
import SecondPage from './SecondPage.jsx';

// import UpdateWebSocketProvider from './components/DraggableComponents/UpdateWebSocketContext';
// import TestPage from './TestPage.jsx';
import MainContainerMobile from './components/MobileMain.jsx';
import { ErrorProvider } from './contexts/ErrorContext';
import AdminPanel from './components/Admin/AdminPanel.jsx';
import PricingPlans from './components/Subscription/PricingPlans.jsx';
import SignInPage from './SignInPage.jsx';
import RegisterPage from './RegisterPage.jsx';
import AccountPage from './AccountPage.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import AccountButton from './components/AccountButton.jsx';
import { Box } from '@mui/material';
import Container from '@mui/material/Container';
import { useEffect, useState } from 'react';
import AuthInitializer from './components/Auth/AuthInitializer.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { store } from './store/store';
// import ReactGridLayout from "./components/GridLayout";

const queryClient = new QueryClient();

// 2. Создаем компонент-обертку для провайдеров, которые требуют аутентификации
const AuthenticatedAppProviders = memo(() => (
    <Outlet />
));

// Memoize routes to prevent unnecessary re-renders
const AppRoutes = memo(() => (
  <Routes>
    {/* Публичные маршруты, доступные всем */}
    <Route path="/login" element={<SignInPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/pricing" element={<PricingPlans />} />
    {/* Приватные маршруты, требующие аутентификации */}
    <Route element={<RequireAuth />}>
      <Route element={<AuthenticatedAppProviders />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/mobile" element={<MainContainerMobile />} />
        <Route path="/second" element={<SecondPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>
    </Route>
  </Routes>
));

// Add display names for better debugging in React DevTools
AuthenticatedAppProviders.displayName = 'AuthenticatedAppProviders';
AppRoutes.displayName = 'AppRoutes';

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ErrorProvider>
            <Router>
              <AuthInitializer>
                <AppRoutes />
              </AuthInitializer>
            </Router>
          </ErrorProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Provider>
    </div>
  );
}

export default memo(App);
