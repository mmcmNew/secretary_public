import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../../../store/store';
import DndKitTree from './DndKitTree';
import { useGetDndTreeListsQuery } from '../../../../store/listsSlice';
import { handlers } from '../../../../stories/msw-handlers';

export default {
  title: 'ToDo/DndKitTree',
  component: DndKitTree,
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

const Template = () => {
    const { data: treeData, isLoading, error } = useGetDndTreeListsQuery();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return <DndKitTree treeData={treeData} />;
};

export const Default = Template.bind({});