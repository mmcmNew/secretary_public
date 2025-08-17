import React from 'react';
import { vi } from 'vitest';
// Mock @mui/icons-material to avoid opening many icon files during the test (prevents EMFILE)
vi.mock('@mui/icons-material', () => {
  const makeIcon = () => (props) => React.createElement('span', props);
  return new Proxy({}, { get: () => makeIcon() });
});

import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import ListsList from '../../../../src/components/ToDo/ListsList';
import { createTestStore } from '../../store/rtk-test-setup';

describe('ListsList component', () => {
  it('renders default, projects and lists sections and shows provided items', () => {
    const store = createTestStore();

    // Render the component with explicit props (no need to dispatch into store for this test)
    render(
      <Provider store={store}>
        <ListsList
          lists={[{ id: 'L1', title: 'List One', type: 'list' }]}
          defaultLists={[{ id: 'D1', title: 'Default One', type: 'default' }]}
          projects={[{ id: 'P1', title: 'Project One', type: 'project' }]}
        />
      </Provider>
    );

    // Check section titles
    expect(screen.getByText('Стандартные')).toBeInTheDocument();
    expect(screen.getByText('Проекты')).toBeInTheDocument();
    expect(screen.getByText('Списки и Группы')).toBeInTheDocument();

    // Check items rendered
    expect(screen.getByText('Default One')).toBeInTheDocument();
    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.getByText('List One')).toBeInTheDocument();
  });
});
