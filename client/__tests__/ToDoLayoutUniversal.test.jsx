import React from 'react';
import { render, waitFor } from '@testing-library/react';
import ToDoLayoutUniversal from '../src/components/ToDo/ToDoLayoutUniversal';

// Mock external modules used in the component
jest.mock('prop-types', () => {
  const proxy = new Proxy(function () { return proxy; }, { get: () => proxy });
  return new Proxy({}, { get: () => proxy });
}, { virtual: true });
jest.mock('@mui/material', () => {
  const React = require('react');
  return {
    useMediaQuery: jest.fn(() => false),
    Box: ({ children }) => <div>{children}</div>,
    Grid: ({ children }) => <div>{children}</div>,
    Typography: ({ children }) => <div>{children}</div>,
  };
}, { virtual: true });

jest.mock('../src/components/ToDo/hooks/useTasks', () => jest.fn());
jest.mock('../src/components/ToDo/hooks/useNewTaskInput', () => jest.fn());
jest.mock('../src/components/ToDo/ToDoListsPanel', () => () => <div>lists</div>, { virtual: true });
jest.mock('../src/components/ToDo/ToDoTasksPanel', () => () => <div>tasks</div>, { virtual: true });
jest.mock('../src/components/ToDo/ToDoTaskEditorPanel', () => () => <div>editor</div>, { virtual: true });
jest.mock('../src/contexts/ErrorContext', () => {
  const React = require('react');
  return { ErrorContext: React.createContext({ setError: () => {}, setSuccess: () => {} }) };
}, { virtual: true });

import useTasks from '../src/components/ToDo/hooks/useTasks';
import useNewTaskInput from '../src/components/ToDo/hooks/useNewTaskInput';

const mockedUseTasks = useTasks;
const mockedUseNewTaskInput = useNewTaskInput;

describe('ToDoLayoutUniversal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fetches lists on mount', async () => {
    const fetchLists = jest.fn();
    mockedUseTasks.mockReturnValue({
      addTask: jest.fn(),
      addSubTask: jest.fn(),
      updateTask: jest.fn(),
      fetchTasks: jest.fn(),
      selectedTaskId: null,
      tasks: { loading: false },
      selectedListId: null,
      fetchLists,
      lists: { loading: false },
    });
    mockedUseNewTaskInput.mockReturnValue({ submitTask: jest.fn() });

    render(<ToDoLayoutUniversal />);

    await waitFor(() => expect(fetchLists).toHaveBeenCalled());
  });

  test('fetches tasks when list selected', async () => {
    const fetchTasks = jest.fn();
    const fetchLists = jest.fn();
    mockedUseTasks.mockReturnValue({
      addTask: jest.fn(),
      addSubTask: jest.fn(),
      updateTask: jest.fn(),
      fetchTasks,
      selectedTaskId: null,
      tasks: { loading: false },
      selectedListId: 'list1',
      fetchLists,
      lists: { loading: false },
    });
    mockedUseNewTaskInput.mockReturnValue({ submitTask: jest.fn() });

    render(<ToDoLayoutUniversal />);

    await waitFor(() => expect(fetchTasks).toHaveBeenCalledWith('list1'));
  });
});
