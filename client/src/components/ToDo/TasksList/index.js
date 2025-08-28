// Main component
export { default } from './index.jsx';

// Sub-components
export { default as TaskContextMenu } from './ContextMenu/TaskContextMenu.jsx';
export { default as ListsSelectionMenu } from './ContextMenu/ListsSelectionMenu.jsx';

// Hooks
export { useTaskActions } from './hooks/useTaskActions.js';
export { useTaskDragDrop } from './hooks/useTaskDragDrop.js';
export { useTaskMenu } from './hooks/useTaskMenu.js';
// export { useSubtasksLoader } from './hooks/useSubtasksLoader.js';

// Utils
export * from './utils/taskUtils.js';
// export * from './utils/menuUtils.js';
