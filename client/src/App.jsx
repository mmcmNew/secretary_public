// App.js
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { memo } from 'react';
import axios from 'axios';
import HomePage from './HomePage.jsx';
import SecondPage from './SecondPage.jsx';
import { ContainerProvider } from './components/DraggableComponents/ContainerContext';
import { TasksProvider } from './components/ToDo/hooks/TasksContext';
import { AntiScheduleProvider } from './components/ToDo/hooks/AntiScheduleContext';
import UpdateWebSocketProvider from './components/DraggableComponents/UpdateWebSocketContext';
import TestPage from './TestPage.jsx';
import MainContainerMobile from './components/MobileMain.jsx';
import { ErrorProvider } from './contexts/ErrorContext';
import AdminPanel from './components/Admin/AdminPanel.jsx';
import PricingPlans from './components/Subscription/PricingPlans.jsx';
import { AudioProvider } from './contexts/AudioContext.jsx';
import SignInPage from './SignInPage.jsx';
import RegisterPage from './RegisterPage.jsx';
import AccountPage from './AccountPage.jsx';
import AuthProvider from 'react-auth-kit';
import createStore from 'react-auth-kit/createStore';
import createRefresh from 'react-auth-kit/createRefresh';
import RequireAuth from './components/RequireAuth.jsx';
// import ReactGridLayout from "./components/GridLayout";

const store = createStore({
  authName: '_auth',
  authType: 'localstorage',
  cookieDomain: window.location.hostname,
  cookieSecure: window.location.protocol === 'https:',
  refresh: createRefresh({
    interval: 600,
    refreshApiCallback: async ({ refreshToken }) => {
      try {
        const response = await axios.post('/api/refresh', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        if (response.status === 200) {
          const data = response.data;
          return { isSuccess: true, newAuthToken: data.access_token };
        }
      } catch (e) {
        console.error('Refresh token failed', e);
      }
      return { isSuccess: false };
    },
  }),
});

// 2. Создаем компонент-обертку для провайдеров, которые требуют аутентификации
const AuthenticatedAppProviders = memo(() => (
  <UpdateWebSocketProvider>
    <AudioProvider>
      <ContainerProvider>
        <TasksProvider>
          <AntiScheduleProvider>
            <Outlet /> {/* 1. Outlet будет рендерить вложенные защищенные маршруты */}
          </AntiScheduleProvider>
        </TasksProvider>
      </ContainerProvider>
    </AudioProvider>
  </UpdateWebSocketProvider>
));

// Memoize routes to prevent unnecessary re-renders
const AppRoutes = memo(() => (
  <Routes>
    <Route path="/login" element={<SignInPage />} />
    <Route path="/register" element={<RegisterPage />} />
    {/* 3. Оборачиваем защищенные маршруты в AuthenticatedAppProviders */}
    <Route element={<RequireAuth loginPath="/login" />}>
      <Route element={<AuthenticatedAppProviders />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/second" element={<SecondPage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/mobile" element={<MainContainerMobile />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/pricing" element={<PricingPlans />} />
      <Route path="/account" element={<AccountPage />} />
      </Route>
    </Route>
  </Routes>
));

function App() {
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development' && window.mainStart) {
  //     const renderTime = performance.now() - window.mainStart;
  //     console.log(`Initial render completed in ${renderTime.toFixed(2)}ms`);
  //   }
  // }, []);

  return (
    <div className="App">
      <ErrorProvider>
        <AuthProvider store={store}>
          {/* 4. Убираем лишние провайдеры из корневого компонента */}
          <Router future={{
                    v7_fetcherPersist: true,
                    v7_normalizeFormMethod: true,
                    v7_partialHydration: true,
                    v7_relativeSplatPath: true,
                    v7_skipActionErrorRevalidation: true,
                    v7_startTransition: true,
                  }}>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ErrorProvider>
    </div>
  );
}

export default memo(App);
