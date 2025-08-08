import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { MultiBackend, getBackendOptions } from '@minoru/react-dnd-treeview';
import ListsTreeAnimated from './ListsTree/ListsTreeAnimated';
import ToDoListsPanel from './ToDoListsPanel';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { apiSlice } from '../../store/api/apiSlice';
import { handlers } from '../../stories/msw-handlers';
import { mockTreeData, treeUtils } from './ListsTree/mockData';

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
  const [mockData, setMockData] = useState(null);
  
  // Оптимистичная логика для демонстрации перетаскивания
  const handleOptimisticDrop = (sectionIndex, newTree, options) => {
    console.log('Optimistic drop:', { sectionIndex, newTree, options });
    
    if (mockData) {
      const updatedData = [...mockData];
      updatedData[sectionIndex] = newTree;
      setMockData(updatedData);
    }
  };
  
  return (
    <div>
      <ToDoListsPanel {...args} />
      {mockData && (
        <div style={{ marginTop: 20, padding: 10, background: '#f0f0f0' }}>
          <h4>Оптимистичное состояние:</h4>
          <pre>{JSON.stringify(mockData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  mobile: false
};
Default.parameters = {
  msw: {
    handlers: [handlers.withData],
  },
};
Default.storyName = 'Десктоп версия с тестовыми данными';

export const Mobile = Template.bind({});
Mobile.args = {
  mobile: true
};
Mobile.parameters = {
  msw: {
    handlers: [handlers.withData],
  },
  viewport: {
    defaultViewport: 'mobile1',
  },
};
Mobile.storyName = 'Мобильная версия (тест перетаскивания)';

export const NoData = Template.bind({});
NoData.parameters = {
  msw: {
    handlers: [handlers.noData],
  },
};
NoData.storyName = 'Без данных';

export const WithRealData = Template.bind({});
WithRealData.parameters = {
  msw: {
    disable: true,
  },
};
WithRealData.storyName = 'С реальными данными (API)';

export const DragDropTestMenu = () => {
  const [treeData, setTreeData] = useState(mockTreeData);
  
  const handleDrop = (sectionIndex) => (newTree, options) => {
    console.log('Перетаскивание (меню):', { sectionIndex, newTree, options });
    
    const { dragSource, dropTarget, action } = options;
    
    if (!dragSource) {
      // Обычная сортировка в секции
      const updatedData = [...treeData];
      updatedData[sectionIndex] = newTree;
      setTreeData(updatedData);
      return;
    }
    
    if (action === 'sort') {
      // Сортировка в секции
      const sourceIndex = treeData[sectionIndex].findIndex(n => n.id === dragSource.id);
      const targetIndex = newTree.findIndex(n => n.id === dragSource.id);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const updatedData = treeUtils.sortInSection(treeData, sectionIndex, dragSource.id, targetIndex);
        setTreeData(updatedData);
      }
    } else {
      // Перемещение или связывание
      const updatedData = treeUtils.moveNode(treeData, dragSource.id, dropTarget?.id || 0, action || 'move');
      setTreeData(updatedData);
    }
  };
  
  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <div>
        <p>При перетаскивании списка в группу/проект появляется меню выбора действия</p>
        <div style={{ display: 'flex', gap: 20 }}>
          {treeData.map((section, index) => (
            <div key={index} style={{ border: '1px solid #ccc', padding: 10, minWidth: 200 }}>
              <h4>Секция {index + 1}</h4>
              <ListsTreeAnimated
                treeData={section}
                onDrop={handleDrop(index)}
                dropMode="menu"
              />
            </div>
          ))}
        </div>
      </div>
    </DndProvider>
  );
};
DragDropTestMenu.storyName = 'Контекстное меню при drop';

export const DragDropTestZones = () => {
  const [treeData, setTreeData] = useState(mockTreeData);
  
  const handleDrop = (sectionIndex) => (newTree, options) => {
    console.log('Перетаскивание (зоны):', { sectionIndex, newTree, options });
    
    const { dragSource, dropTarget, action } = options;
    
    if (!dragSource) {
      const updatedData = [...treeData];
      updatedData[sectionIndex] = newTree;
      setTreeData(updatedData);
      return;
    }
    
    if (action === 'sort') {
      const sourceIndex = treeData[sectionIndex].findIndex(n => n.id === dragSource.id);
      const targetIndex = newTree.findIndex(n => n.id === dragSource.id);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const updatedData = treeUtils.sortInSection(treeData, sectionIndex, dragSource.id, targetIndex);
        setTreeData(updatedData);
      }
    } else {
      const updatedData = treeUtils.moveNode(treeData, dragSource.id, dropTarget?.id || 0, action || 'move');
      setTreeData(updatedData);
    }
  };
  
  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <div>
        <p>При hover на группы/проекты появляются зоны: левая (связать) и правая (переместить)</p>
        <div style={{ display: 'flex', gap: 20 }}>
          {treeData.map((section, index) => (
            <div key={index} style={{ border: '1px solid #ccc', padding: 10, minWidth: 200 }}>
              <h4>Секция {index + 1}</h4>
              <ListsTreeAnimated
                treeData={section}
                onDrop={handleDrop(index)}
                dropMode="zones"
              />
            </div>
          ))}
        </div>
      </div>
    </DndProvider>
  );
};
DragDropTestZones.storyName = 'Зоны drop для выбора действия';

export const FullFunctionalTest = () => {
  const [treeData, setTreeData] = useState(mockTreeData);
  const [selectedId, setSelectedId] = useState(null);
  
  const handleDrop = (sectionIndex) => (newTree, options) => {
    console.log('Полнофункциональный тест:', { sectionIndex, newTree, options });
    
    const { dragSource, dropTarget, action, dropTargetId } = options;
    
    if (!dragSource) {
      // Обычная сортировка в секции
      const updatedData = [...treeData];
      updatedData[sectionIndex] = newTree;
      setTreeData(updatedData);
      return;
    }
    
    // Определяем тип операции
    const isSorting = !dropTarget && dropTargetId === 0;
    const isMovingToContainer = dropTarget && dropTarget.droppable;
    
    if (action) {
      // Если action явно указан (через меню)
      if (action === 'sort') {
        const sourceIndex = treeData[sectionIndex].findIndex(n => n.id === dragSource.id);
        const targetIndex = newTree.findIndex(n => n.id === dragSource.id);
        
        if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
          const updatedData = treeUtils.sortInSection(treeData, sectionIndex, dragSource.id, targetIndex);
          setTreeData(updatedData);
        }
      } else {
        const updatedData = treeUtils.moveNode(treeData, dragSource.id, dropTarget?.id || 0, action);
        setTreeData(updatedData);
      }
    } else if (isSorting) {
      // Автоматическая сортировка
      const sourceIndex = treeData[sectionIndex].findIndex(n => n.id === dragSource.id);
      const targetIndex = newTree.findIndex(n => n.id === dragSource.id);
      
      if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
        const updatedData = treeUtils.sortInSection(treeData, sectionIndex, dragSource.id, targetIndex);
        setTreeData(updatedData);
      }
    } else if (isMovingToContainer) {
      // Перемещение в контейнер - показываем меню через dropMode
      // Меню обработает ListsTreeAnimated
      return;
    } else {
      // Обычное перемещение
      const updatedData = treeUtils.moveNode(treeData, dragSource.id, dropTarget?.id || 0, 'move');
      setTreeData(updatedData);
    }
  };
  
  const handleRename = (id, newTitle) => {
    console.log('Переименование:', id, newTitle);
    const updatedData = treeData.map(section => 
      section.map(node => 
        node.id === id ? { ...node, text: newTitle } : node
      )
    );
    setTreeData(updatedData);
  };
  
  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <div>
        <h3>Полнофункциональный тест сортировки и перетаскивания</h3>
        <div style={{ marginBottom: 20 }}>
          <h4>Возможности:</h4>
          <ul>
            <li>✅ Сортировка в секциях</li>
            <li>✅ Перемещение между секциями</li>
            <li>✅ Перемещение в контейнеры</li>
            <li>✅ Связывание (копирование)</li>
            <li>✅ Переименование (двойной клик)</li>
            <li>✅ Выбор элементов</li>
          </ul>
        </div>
        
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {treeData.map((section, index) => (
            <div key={index} style={{ 
              border: '2px solid #ddd', 
              borderRadius: 8,
              padding: 15, 
              minWidth: 250,
              backgroundColor: '#fafafa'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                {index === 0 ? '📌 Стандартные' : 
                 index === 1 ? '🏢 Проекты' : 
                 '📁 Списки и группы'}
              </h4>
              <ListsTreeAnimated
                treeData={section}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onDrop={handleDrop(index)}
                onRename={handleRename}
                dropMode="menu"
              />
            </div>
          ))}
        </div>
        
        {selectedId && (
          <div style={{ 
            marginTop: 20, 
            padding: 15, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 8,
            border: '1px solid #2196f3'
          }}>
            <strong>Выбрано:</strong> {selectedId}
          </div>
        )}
      </div>
    </DndProvider>
  );
};
FullFunctionalTest.storyName = '🚀 Полнофункциональный тест';