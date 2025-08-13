import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../../../store/store';
import DndKitListsPanel from './DndKitListsPanel';
import { handlers } from '../../../../stories/msw-handlers';

const meta = {
  title: 'ToDo/DndKitListsPanel',
  component: DndKitListsPanel,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
  parameters: {
    msw: {
      handlers: handlers.withData,
    },
  },
};

export default meta;

const Template = (args) => <DndKitListsPanel {...args} />;

export const Default = Template.bind({});
Default.args = {};