import { createSlice } from '@reduxjs/toolkit';
import { containerTypes } from "../components/DraggableComponents/containerConfig";
import { dashboardApi } from './api/dashboardApi';

export function createContainer(type, id, containerData) {
    const componentConfig = containerTypes[type];
    console.log(`createContainer: type=${type}, id=${id}, containerData=`, containerData);
    if (!componentConfig) {
        console.error(`Unknown container type: ${type}`);
        return null;
    }
    if (!id) {
      id = Date.now().toString(); // Generate a unique ID if not provided
    }
console.log(`Creating container with ID: ${id} and type: ${type}`);

    const newContainer = {
        ...containerData,
        id,
        type,
        name: containerData.name || componentConfig.name,
        position: containerData.position || componentConfig.position,
        size: containerData.size || componentConfig.size,
        maxSize: componentConfig.maxSize,
        minSize: componentConfig.minSize,
        isLockAspectRatio: containerData.isLockAspectRatio ?? componentConfig.isLockAspectRatio,
        isResizable: componentConfig.isResizable,
        isDisableDragging: componentConfig.isDisableDragging,
        isLocked: containerData.isLocked ?? componentConfig.isLocked,
        isMinimized: containerData.isMinimized ?? componentConfig.isMinimized,
        componentProps: {
            containerId: id,
            ...containerData,
        }
    };
    return newContainer;
}



const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    id: null,
    name: '',
    containers: [],         
    timers: null,
    themeMode: 'light',      
    calendarSettings: null,
    loading: false,
    error: null,
},
  reducers: {
    setContainers: (state, action) => {
      state.containers = action.payload;
    },
    addContainer: (state, action) => {
      console.log('Adding container of type: ', action);
      const newContainer = createContainer(action.payload, action.id || null, action.payload.props || {});
      if (newContainer) {
        state.containers.push(newContainer);
      }
    },
    removeContainer: (state, action) => {
      state.containers = state.containers.filter(container => container.id !== action.payload);
    },
    updateContainer: (state, action) => {
      const index = state.containers.findIndex(container => container.id === action.payload.id);
      if (index !== -1) {
        state.containers[index] = { ...state.containers[index], ...action.payload.data };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        dashboardApi.endpoints.getDashboard.matchFulfilled,
        (state, action) => {
          state.loading = false;
          state.id = action.payload.id;
          state.name = action.payload.name;
          state.containers = action.payload.containers.map((cont) => {
            if (!cont) {
              return null;
            }
            return createContainer(cont.type, cont.id, cont)});
          state.themeMode = action.payload.themeMode;
          state.timers = action.payload.timers;
          state.calendarSettings = action.payload.calendarSettings;
        }
      )
      .addMatcher(
        dashboardApi.endpoints.getDashboard.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        dashboardApi.endpoints.getDashboard.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addMatcher(
        dashboardApi.endpoints.createDashboard.matchFulfilled,
        (state, action) => {
          state.loading = false;
          state.id = action.payload.id;
          state.name = action.payload.name;
          state.containers = action.payload.containers.map((cont) => createContainer(cont.type, cont.id, cont));
          state.themeMode = action.payload.themeMode;
          state.timers = action.payload.timers;
          state.calendarSettings = action.payload.calendarSettings;
        }
      )
      .addMatcher(
        dashboardApi.endpoints.createDashboard.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        dashboardApi.endpoints.createDashboard.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addMatcher(
        dashboardApi.endpoints.saveDashboard.matchFulfilled,
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        dashboardApi.endpoints.saveDashboard.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        dashboardApi.endpoints.saveDashboard.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { setContainers, addContainer, removeContainer, updateContainer } = dashboardSlice.actions;

export default dashboardSlice.reducer;