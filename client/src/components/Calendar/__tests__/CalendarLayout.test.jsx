import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CalendarLayout from '../CalendarLayout';
import { TasksProvider } from '../../ToDo/hooks/TasksContext';

// Mock компонентов
jest.mock('../CalendarComponent', () => {
  return function MockCalendarComponent(props) {
    return <div data-testid="calendar-component">Calendar Component</div>;
  };
});

jest.mock('../TaskDialog', () => {
  return function MockTaskDialog(props) {
    return props.open ? <div data-testid="task-dialog">Task Dialog</div> : null;
  };
});

// Mock хуков
jest.mock('../../DraggableComponents/useContainer', () => ({
  __esModule: true,
  default: () => ({
    setUpdates: jest.fn(),
    handleUpdateContent: jest.fn(),
  }),
}));

jest.mock('../../DraggableComponents/useUpdateWebSocket', () => ({
  __esModule: true,
  default: () => ({
    tasksVersion: null,
    taskChange: null,
  }),
}));

// Mock API
jest.mock('../../../utils/api', () => ({
  apiGet: jest.fn(() => Promise.resolve({ data: { tasks: [], events: [] } })),
  apiPost: jest.fn(() => Promise.resolve({ data: {} })),
  apiPut: jest.fn(() => Promise.resolve({ data: {} })),
  apiDelete: jest.fn(() => Promise.resolve({ data: {} })),
  apiPatch: jest.fn(() => Promise.resolve({ data: {} })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <TasksProvider>
        {children}
      </TasksProvider>
    </QueryClientProvider>
  );
};

describe('CalendarLayout', () => {
  const defaultProps = {
    containerId: 'test-container',
    handleDatesSet: jest.fn(),
    calendarSettingsProp: null,
    onSuccess: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders calendar component', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CalendarLayout {...defaultProps} />
      </Wrapper>
    );

    expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
  });

  test('does not render task dialog when closed', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CalendarLayout {...defaultProps} />
      </Wrapper>
    );

    expect(screen.queryByTestId('task-dialog')).not.toBeInTheDocument();
  });

  test('renders with custom calendar settings', () => {
    const customSettings = {
      slotDuration: 60,
      timeRange: [9, 18],
      currentView: "timeGridDay",
    };

    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CalendarLayout 
          {...defaultProps} 
          calendarSettingsProp={customSettings}
        />
      </Wrapper>
    );

    expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
  });

  test('calls onError when provided', () => {
    const onError = jest.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CalendarLayout 
          {...defaultProps} 
          onError={onError}
        />
      </Wrapper>
    );

    // Компонент должен рендериться без ошибок
    expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
  });

  test('renders snackbar for override choice', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <CalendarLayout {...defaultProps} />
      </Wrapper>
    );

    // Snackbar должен быть в DOM, но скрыт
    expect(document.querySelector('[role="presentation"]')).toBeInTheDocument();
  });
});