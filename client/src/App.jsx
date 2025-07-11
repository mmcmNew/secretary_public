// App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { memo } from 'react';
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
import { AuthProvider, RequireAuth } from 'react-auth-kit';
// import ReactGridLayout from "./components/GridLayout";

// Memoize routes to prevent unnecessary re-renders
const AppRoutes = memo(() => (
  <Routes>
    <Route path="/login" element={<SignInPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<RequireAuth loginPath="/login" />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/second" element={<SecondPage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/mobile" element={<MainContainerMobile />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/pricing" element={<PricingPlans />} />
      <Route path="/account" element={<AccountPage />} />
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
        <AuthProvider
          authType="localstorage"
          authName="_auth"
          refreshName="_refresh"
          cookieDomain={window.location.hostname}
          cookieSecure={window.location.protocol === 'https:'}
        >
          <UpdateWebSocketProvider>
            <AudioProvider>
              <ContainerProvider>
                <TasksProvider>
                  <AntiScheduleProvider>
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
                  </AntiScheduleProvider>
                </TasksProvider>
              </ContainerProvider>
            </AudioProvider>
          </UpdateWebSocketProvider>
        </AuthProvider>
      </ErrorProvider>
    </div>
  );
}

export default memo(App);
