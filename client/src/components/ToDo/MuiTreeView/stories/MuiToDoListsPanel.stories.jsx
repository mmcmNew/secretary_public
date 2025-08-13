import MuiToDoListsPanel from '../MuiToDoListsPanel';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { apiSlice } from '../../../../store/api/apiSlice';
import { handlers } from '../../../../stories/msw-handlers';

const authSlice = createSlice({
  name: 'auth',
  initialState: { isAuthenticated: true, user: { id: 1 } },
  reducers: {},
});

const meta = {
  title: 'ToDo/MuiTreeView/MuiToDoListsPanel',
  component: MuiToDoListsPanel,
  decorators: [
    (Story) => {
      const store = configureStore({
        reducer: {
          [apiSlice.reducerPath]: apiSlice.reducer,
          auth: authSlice.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(apiSlice.middleware),
      });
      return (
        <Provider store={store}>
          <div style={{ maxWidth: '400px', height: '600px', padding: '20px' }}>
            <Story />
          </div>
        </Provider>
      );
    }
  ],
  parameters: {
    layout: 'centered'
  }
};

export default meta;

const Template = (args) => <MuiToDoListsPanel {...args} />;

export const Default = {
  args: {
    mobile: false
  },
  parameters: {
    msw: {
      handlers: handlers.withData
    }
  }
};

export const Mobile = {
  args: {
    mobile: true
  },
  parameters: {
    msw: {
      handlers: handlers.withData
    }
  }
};

export const Empty = {
  args: {
    mobile: false
  },
  parameters: {
    msw: {
      handlers: handlers.noData
    }
  }
};
