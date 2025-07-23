import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import CalendarLayout from '../src/components/Calendar/CalendarLayout';

jest.mock('prop-types', () => {
  const proxy = new Proxy(function () { return proxy; }, { get: () => proxy });
  return new Proxy({}, { get: () => proxy });
}, { virtual: true });

jest.mock('../src/components/ToDo/hooks/useTasks', () => jest.fn());
jest.mock('../src/components/DraggableComponents/useContainer', () => jest.fn());
jest.mock('../src/components/Calendar/CalendarComponent', () => (props) => {
  global.capturedCalendarProps = props;
  return <div data-testid="calendar-component" />;
});
jest.mock('../src/components/Calendar/TaskDialog', () => (props) => {
  global.capturedTaskDialogProps = props;
  return props.open ? <div data-testid="task-dialog" /> : null;
});

import useTasks from '../src/components/ToDo/hooks/useTasks';
import useContainer from '../src/components/DraggableComponents/useContainer';

describe('CalendarLayout', () => {
  let tasksMock, containerMock, onSuccess, onError;

  beforeEach(() => {
    onSuccess = jest.fn();
    onError = jest.fn();

    tasksMock = {
      updateTask: jest.fn().mockResolvedValue({}),
      addTask: jest.fn().mockResolvedValue({}),
      fetchTasks: jest.fn(),
      tasks: { data: [], error: null },
      taskFields: {},
      addSubTask: jest.fn(),
      changeTaskStatus: jest.fn(),
      deleteTask: jest.fn(),
      lists: {},
      calendarEvents: { data: { events: [], parent_tasks: [] }, error: null },
      fetchCalendarEvents: jest.fn(),
      processEventChange: jest.fn(),
      getSubtasksByParentId: jest.fn().mockResolvedValue([]),
      createTaskOverride: jest.fn(),
      updateTaskOverride: jest.fn(),
      deleteTaskOverride: jest.fn(),
    };
    containerMock = {
      setUpdates: jest.fn(),
      handleUpdateContent: jest.fn(),
    };

    useTasks.mockReturnValue(tasksMock);
    useContainer.mockReturnValue(containerMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.capturedCalendarProps = undefined;
    global.capturedTaskDialogProps = undefined;
  });

  it('renders CalendarComponent and TaskDialog', () => {
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    expect(global.capturedCalendarProps).toBeDefined();
    expect(global.capturedTaskDialogProps).toBeDefined();
  });

  it('calls onSuccess when saving settings', () => {
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    act(() => {
      global.capturedCalendarProps.saveSettings({ slotDuration: 15 });
    });
    expect(onSuccess).toHaveBeenCalledWith('Настройки сохранены');
  });

  it('calls addTask and fetchCalendarEvents on create task', async () => {
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    await act(async () => {
      await global.capturedCalendarProps.onCreateTask({ title: 'Test' });
    });
    expect(tasksMock.addTask).toHaveBeenCalled();
    expect(tasksMock.fetchCalendarEvents).toHaveBeenCalled();
    expect(containerMock.setUpdates).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('Событие добавлено');
  });

  it('handles error in addTask', async () => {
    tasksMock.addTask.mockRejectedValueOnce(new Error('fail'));
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    await act(async () => {
      await global.capturedCalendarProps.onCreateTask({ title: 'Test' });
    });
    expect(onError).toHaveBeenCalled();
  });

  it('opens TaskDialog on event click', async () => {
    tasksMock.calendarEvents = { data: { events: [{ id: 1 }], parent_tasks: [] }, error: null };
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    await act(async () => {
      await global.capturedCalendarProps.handleEventClick({ event: { id: 1 } });
    });
    expect(global.capturedTaskDialogProps.open).toBe(true);
  });

  it('calls updateTask on event change', async () => {
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    await act(async () => {
      await global.capturedCalendarProps.handleEventChange({ event: { id: 1, title: 'T', allDay: false, start: new Date(), end: new Date() } });
    });
    expect(tasksMock.updateTask).toHaveBeenCalled();
    expect(tasksMock.fetchCalendarEvents).toHaveBeenCalled();
    expect(containerMock.setUpdates).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('Событие обновлено');
  });

  it('calls onError if tasks.error is set', () => {
    tasksMock.tasks.error = 'fail';
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    expect(onError).toHaveBeenCalledWith('fail');
  });

  it('calls onError if calendarEvents.error is set', () => {
    tasksMock.calendarEvents.error = 'fail2';
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    expect(onError).toHaveBeenCalledWith('fail2');
  });

  it('calls updateTaskOverride for override in handleTaskDialogChange', async () => {
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    await act(async () => {
      await global.capturedTaskDialogProps.onChange({ id: 1, is_override: true, override_id: 2 });
    });
    expect(tasksMock.updateTaskOverride).toHaveBeenCalledWith(2, { data: { id: 1, is_override: true, override_id: 2 } });
  });

  it('calls updateTask for normal task in handleTaskDialogChange', async () => {
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    await act(async () => {
      await global.capturedTaskDialogProps.onChange({ id: 1 });
    });
    expect(tasksMock.updateTask).toHaveBeenCalledWith({ taskId: 1, id: 1 });
  });

  it('calls handleDelDateClick and onSuccess', async () => {
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    await act(async () => {
      await global.capturedTaskDialogProps.handleDelDateClick(1);
    });
    expect(tasksMock.updateTask).toHaveBeenCalledWith({ taskId: 1, start: null, end: null });
    expect(onSuccess).toHaveBeenCalledWith('Дата удалена');
  });

  it('calls loadSubtasks and sets selectedSubtasks', async () => {
    // Подготовьте моки до рендера!
    tasksMock.calendarEvents = { data: { events: [{ id: 1 }], parent_tasks: [] }, error: null };
    tasksMock.getSubtasksByParentId.mockResolvedValueOnce([{ id: 123 }]);
    render(<CalendarLayout onSuccess={onSuccess} onError={onError} />);
    await act(async () => {
      await global.capturedCalendarProps.handleEventClick({ event: { id: 1 } });
    });
    expect(tasksMock.getSubtasksByParentId).toHaveBeenCalled();
  });

  it('calls handleUpdateContent when saving settings with containerId', () => {
    render(<CalendarLayout containerId="abc" onSuccess={onSuccess} onError={onError} />);
    act(() => {
      global.capturedCalendarProps.saveSettings({ slotDuration: 20 });
    });
    expect(containerMock.handleUpdateContent).toHaveBeenCalledWith('abc', { calendarSettingsProp: { slotDuration: 20 } });
  });

  // Можно добавить тесты для overrideDialog, handleOverrideDialogChoice, handleDialogClose и других edge-cases
});
