import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

const defaultGetTitle = (task) => task.title ?? task.text ?? task.label ?? '';

export default function TasksContainer({
  listId,
  tasks: tasksProp,
  onSelect,
  onRename,
  onToggleComplete,
  defaultExpanded = [],
  setSelectedTaskId = null,
  updateTask,
  changeTaskStatus,
  getTitle = defaultGetTitle,
}) {
  const tasks = React.useMemo(() => Array.isArray(tasksProp) ? tasksProp : [], [tasksProp]);

  const completedIds = React.useMemo(
    () => tasks.filter((task) => task.is_completed).map((task) => String(task.id)),
    [tasks]
  );

  const buildTree = React.useCallback((nodes, parent) => {
    return nodes
      .filter((n) => (n.parent ?? n.parent_id ?? 0) === parent)
      .map((n) => ({ id: String(n.id), label: getTitle(n), children: buildTree(nodes, n.id) }));
  }, [getTitle]);

  const items = React.useMemo(() => buildTree(Array.isArray(tasks) ? tasks : [], rootId), [tasks, rootId, buildTree]);

  const handleSelectionToggle = (event, itemId) => {
    // If the toggle came from the checkbox, interpret it as completion toggle
    try {
      const target = event?.target;
      const checkbox = (target?.type === 'checkbox' && target) || (typeof target?.closest === 'function' && target.closest('input[type="checkbox"]')) || null;
      if (checkbox) {
        const checked = !!checkbox.checked;
        handleToggleComplete({ taskId: itemId, is_completed: checked });
        return;
      }
    } catch {
      // ignore DOM inspection errors in non-browser environments
    }

    // Non-checkbox clicks select the task. Prefer setSelectedTaskId prop when provided.
    if (typeof setSelectedTaskId === 'function') {
      const id = typeof itemId === 'string' ? (isNaN(itemId) ? itemId : Number(itemId)) : itemId;
      setSelectedTaskId(id);
      return;
    }

    if (typeof onSelect === 'function') {
      onSelect(itemId, event);
    }
  };

  const handleLabelChange = (itemId, newLabel) => {
    if (typeof onRename === 'function') {
      onRename(itemId, newLabel);
      return;
    }
    (async () => {
      try {
        await updateTask({ taskId: itemId, title: newLabel, listId }).unwrap();
      } catch {
        // ignore
      }
    })();
  };

  const handleToggleComplete = ({ taskId, is_completed }) => {
    if (typeof onToggleComplete === 'function') return onToggleComplete({ taskId, is_completed });
    (async () => {
      try {
        const completed_at = is_completed ? new Date().toISOString() : null;
        await changeTaskStatus({ taskId, is_completed, completed_at, listId }).unwrap();
      } catch {
        // ignore
      }
    })();
  };

  // keep reference to avoid linter warnings when prop is provided externally
  void handleToggleComplete;

  return (
      <Box sx={{ height: '100%', minWidth: '100%', overflowY: 'auto' }}>
        <RichTreeView
          items={items}
          checkboxSelection
          multiSelect
          selectionPropagation={{ parents: true, descendants: true }}
          selectedItems={completedIds}
          onItemSelectionToggle={handleSelectionToggle}
          isItemEditable={() => true}
          onItemLabelChange={handleLabelChange}
          defaultExpandedItems={defaultExpanded}
          sx={{ overflowY: 'auto', maxHeight: '100%' }}
        />
      </Box>
  );
}

TasksContainer.propTypes = {
  listId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tasks: PropTypes.array,
  onSelect: PropTypes.func,
  onRename: PropTypes.func,
  onToggleComplete: PropTypes.func,
  defaultExpanded: PropTypes.array,
  getTitle: PropTypes.func,
  setSelectedTaskId: PropTypes.func,
    setSelectedTask: PropTypes.func,
    updateTask: PropTypes.func.isRequired,
    changeTaskStatus: PropTypes.func.isRequired,
};