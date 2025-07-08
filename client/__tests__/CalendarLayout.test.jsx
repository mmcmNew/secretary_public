import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import CalendarLayout from '../src/components/Calendar/CalendarLayout';

// Avoid requiring optional libraries in tests
jest.mock('prop-types', () => {
  const proxy = new Proxy(function () { return proxy; }, { get: () => proxy });
  return new Proxy({}, { get: () => proxy });
}, { virtual: true });
jest.mock('../src/components/ToDo/hooks/useTasks', () => jest.fn());
jest.mock('../src/components/DraggableComponents/useContainer', () => jest.fn());

import useTasks from '../src/components/ToDo/hooks/useTasks';
import useContainer from '../src/components/DraggableComponents/useContainer';

let capturedProps;
jest.mock('../src/components/Calendar/CalendarComponent', () => (props) => {
  capturedProps = props;
  return null;
});
jest.mock('../src/components/Calendar/TaskDialog', () => () => null);

describe('CalendarLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
    capturedProps = null;
  });

  test('creates task via CalendarComponent', async () => {
    const addTask = jest.fn().mockResolvedValue({});
    const fetchCalendarEvents = jest.fn();
    useTasks.mockReturnValue({
      updateTask: jest.fn(),
      addTask,
      fetchTasks: jest.fn(),
      tasks: { data: [], error: null },
      taskFields: {},
      addSubTask: jest.fn(),
      changeTaskStatus: jest.fn(),
      deleteTask: jest.fn(),
      lists: {},
      calendarEvents: { data: [], error: null },
      fetchCalendarEvents,
    });
    useContainer.mockReturnValue({ setUpdates: jest.fn(), handleUpdateContent: jest.fn() });

    render(<CalendarLayout />);

    await act(async () => {
      await capturedProps.onCreateTask({ title: 'Test' });
    });

    expect(addTask).toHaveBeenCalled();
    expect(fetchCalendarEvents).toHaveBeenCalled();
  });

  test('updates task on event change', async () => {
    const updateTask = jest.fn().mockResolvedValue({});
    const fetchCalendarEvents = jest.fn();
    useTasks.mockReturnValue({
      updateTask,
      addTask: jest.fn(),
      fetchTasks: jest.fn(),
      tasks: { data: [], error: null },
      taskFields: {},
      addSubTask: jest.fn(),
      changeTaskStatus: jest.fn(),
      deleteTask: jest.fn(),
      lists: {},
      calendarEvents: { data: [], error: null },
      fetchCalendarEvents,
    });
    useContainer.mockReturnValue({ setUpdates: jest.fn(), handleUpdateContent: jest.fn() });

    render(<CalendarLayout />);

    await act(async () => {
      await capturedProps.handleEventChange({ event: { id: 1, title: 'T', allDay: false, start: new Date(), end: new Date() } });
    });

    expect(updateTask).toHaveBeenCalled();
    expect(fetchCalendarEvents).toHaveBeenCalled();
  });
});
