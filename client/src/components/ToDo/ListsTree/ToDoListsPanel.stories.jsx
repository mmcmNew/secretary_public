import { DndProvider } from 'react-dnd';
import { MultiBackend, getBackendOptions } from '@minoru/react-dnd-treeview';
import ToDoListsPanel from './ToDoListsPanel';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { apiSlice } from '../../../store/api/apiSlice';
import { handlers } from '../../../stories/msw-handlers';

// Mock auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState: { isAuthenticated: true, user: { id: 1 } }, // Mock user as authenticated
  reducers: {},
});

// Mock lists slice
const listsSlice = createSlice({
  name: 'lists',
  initialState: {
    lists: {},
    selectedListId: 2,
  },
  reducers: {
    setSelectedListId: (state, action) => {
      state.selectedListId = action.payload;
    },
  },
});

// Mock todoLayout slice
const todoLayoutSlice = createSlice({
  name: 'todoLayout',
  initialState: {
    selectedListId: null,
  },
  reducers: {
    setSelectedListId: (state, action) => {
      state.selectedListId = action.payload;
    },
  },
});

export default {
  title: 'Components/ToDoListsPanel',
  component: ToDoListsPanel,
  parameters: {
    docs: {
      description: {
        component: `
### Правила перетаскивания:
- 📄 **Список** → можно перетаскивать в группы и проекты
- 🏗 **Проект** → можно перетаскивать только для сортировки
- 📁 **Группа** → можно перетаскивать в проекты и для сортировки  
- 📌 **Стандартный** → нельзя перетаскивать

### Поддержка устройств:
- Десктоп: HTML5 drag & drop
- Мобильные: Touch drag & drop
        `
      }
    }
  },
  decorators: [
    (story) => {
      const store = configureStore({
        reducer: {
          [apiSlice.reducerPath]: apiSlice.reducer,
          auth: authSlice.reducer, // Add auth reducer
          lists: listsSlice.reducer,
          todoLayout: todoLayoutSlice.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(apiSlice.middleware),
      });
      return <Provider store={store}>{story()}</Provider>;
    },
  ],
};

const Template = (args) => { 
  return (
    <div>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <ToDoListsPanel {...args} />
      </DndProvider>
    </div>
  );
};

export const Default = Template.bind({});
  Default.args = {
    mobile: false,
  };
  Default.parameters = {
    msw: {
      handlers: handlers.withData,
    },
  };

export const NoData = Template.bind({});
  NoData.parameters = {
    msw: {
      handlers: handlers.noData,
    },
  };
  NoData.storyName = 'Без данных';

export const WithRealData = Template.bind({});
  WithRealData.args = {
    mobile: false,
  };
  WithRealData.parameters = {
    msw: {
      handlers: handlers.withData,
    },
  };
  WithRealData.storyName = 'С замоканными данными';
