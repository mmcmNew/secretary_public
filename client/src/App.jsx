// App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { memo, useEffect } from 'react';
import HomePage from './HomePage.jsx';
import SecondPage from './SecondPage.jsx';
import { ContainerProvider } from './components/DraggableComponents/ContainerContext';
import { TasksProvider } from './components/ToDo/hooks/TasksContext';
import { ListsProvider } from './components/ToDo/hooks/ListsContext';
import { CalendarProvider } from './components/ToDo/hooks/CalendarContext';
import UpdateWebSocketProvider from './components/DraggableComponents/UpdateWebSocketContext';
import TestPage from './TestPage.jsx';
import MainContainerMobile from './components/MobileMain.jsx';
import { ErrorProvider } from './contexts/ErrorContext';
// import ReactGridLayout from "./components/GridLayout";

// Memoize routes to prevent unnecessary re-renders
const AppRoutes = memo(() => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/second" element={<SecondPage />} />
    <Route path="/test" element={<TestPage />} />
    <Route path="/mobile" element={<MainContainerMobile />} />
  </Routes>
));

function App() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && window.mainStart) {
      const renderTime = performance.now() - window.mainStart;
      console.log(`Initial render completed in ${renderTime.toFixed(2)}ms`);
    }
  }, []);

  return (
    <div className="App">
      <ErrorProvider>
        <UpdateWebSocketProvider>
          <ContainerProvider>
            <ListsProvider>
              <TasksProvider>
                <CalendarProvider>
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
                </CalendarProvider>
              </TasksProvider>
            </ListsProvider>
          </ContainerProvider>
        </UpdateWebSocketProvider>
      </ErrorProvider>
    </div>
  );
}

export default memo(App);
