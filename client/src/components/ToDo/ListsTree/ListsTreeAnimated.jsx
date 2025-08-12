import { useCallback, useMemo, useState } from 'react';
import { Tree } from '@minoru/react-dnd-treeview';
import { Badge, Typography, TextField } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import FolderIcon from '@mui/icons-material/Folder';
import ListIcon from '@mui/icons-material/List';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PushPinIcon from '@mui/icons-material/PushPin';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import PropTypes from 'prop-types';
import styles from './ListsTreeAnimated.module.css';
import ErrorBoundary from '../../ErrorBoundary';

const getNodeIcon = (type) => {
  switch (type) {
    case 'standard': return <PushPinIcon fontSize="small" sx={{ color: '#666' }} />;
    case 'project': return <AccountTreeIcon fontSize="small" sx={{ color: '#1976d2' }} />;
    case 'group': return <FolderIcon fontSize="small" sx={{ color: '#ff9800' }} />;
    case 'list': return <ListIcon fontSize="small" sx={{ color: '#4caf50' }} />;
    default: return null;
  }
};

const CustomNode = ({ node, depth, isOpen, onToggle, selectedId, onSelect, onRename, dropMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.text);
  const indent = depth * 24;
  
  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle();
  };

  const handleClick = () => {
    if (onSelect && node.data?.type !== 'group') {
      onSelect(node.id);
    }
  };

  const handleDoubleClick = () => {
    if (node.data?.type !== 'standard') {
      setIsEditing(true);
      setEditValue(node.text);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(node.text);
    }
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== node.text) {
      onRename?.(node.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <div
      className={`${styles.root} ${selectedId === node.id ? styles.selected : ''} ${dropMode === 'zones' && node.droppable ? styles.withDropZones : ''}`}
      style={{ paddingInlineStart: indent }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button" // Added role for accessibility
      tabIndex={0}   // Added tabIndex for accessibility
      onKeyDown={(e) => e.key === 'Enter' && handleClick()} // Added keyboard listener
    >
      <div className={`${styles.expandIconWrapper} ${isOpen ? styles.isOpen : ''}`}>
        {node.droppable && (
          <div onClick={handleToggle} className={styles.expandIcon} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleToggle(e)}>
            <ArrowRightIcon fontSize="small" />
          </div>
        )}
      </div>
      
      <div className={styles.iconWrapper}>
        {getNodeIcon(node.data?.type)}
      </div>
      
      <div className={styles.labelWrapper}>
        {isEditing ? (
          <TextField
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleBlur}
            size="small"
            variant="standard"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className={styles.editField}
          />
        ) : (
          <Typography variant="body2" className={styles.label}>
            {node.text}
          </Typography>
        )}
      </div>
      
      <div className={styles.badgeWrapper}>
        {node.data?.unfinished_tasks_count !== undefined && (
          node.data.unfinished_tasks_count > 0 ? (
            <Badge
              badgeContent={node.data.unfinished_tasks_count}
              color="primary"
              size="small"
            />
          ) : (
            <CheckIcon fontSize="small" sx={{ color: 'green' }} />
          )
        )}
      </div>
    </div>
  );
};

CustomNode.displayName = 'CustomNode';

CustomNode.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    text: PropTypes.string.isRequired,
    droppable: PropTypes.bool,
    data: PropTypes.shape({
      type: PropTypes.string,
      unfinished_tasks_count: PropTypes.number,
    }),
  }).isRequired,
  depth: PropTypes.number.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func,
  onRename: PropTypes.func,
  dropMode: PropTypes.string,
};

const CustomDragPreview = ({ monitorProps }) => {
  const item = monitorProps.item;
  
  return (
    <div className={styles.dragPreview}>
      <div className={styles.dragPreviewIcon}>
        {getNodeIcon(item?.data?.type)}
      </div>
      <div className={styles.dragPreviewLabel}>
        {item.text}
      </div>
      {item?.data?.unfinished_tasks_count !== undefined && (
        <div className={styles.dragPreviewBadge}>
          {item.data.unfinished_tasks_count > 0 ? (
            <Badge badgeContent={item.data.unfinished_tasks_count} color="primary" size="small" />
          ) : (
            <CheckIcon fontSize="small" sx={{ color: 'green' }} />
          )}
        </div>
      )}
    </div>
  );
};

CustomDragPreview.displayName = 'CustomDragPreview';

CustomDragPreview.propTypes = {
    monitorProps: PropTypes.shape({
        item: PropTypes.shape({
            text: PropTypes.string,
            data: PropTypes.shape({
                type: PropTypes.string,
                unfinished_tasks_count: PropTypes.number
            })
        })
    }).isRequired
};

const ListsTreeAnimated = ({ treeData, rootId = 0, onSelect, selectedId, onDrop, onRename, dropMode = 'menu' }) => {

  // memoize treeData если родитель передаёт новый массив каждый рендер:
  const memoTree = useMemo(() => treeData, [treeData]);

  // canDrag — мемоизируем, без сайд-эффектов
  const canDrag = useCallback((node) => node.data?.type !== 'standard', []);

  // canDrop — мемоизируем. Ни в коем случае не делать здесь setState.
  const canDrop = (currentTree, { dragSourceId, dropTargetId, dragSource, dropTarget }) => {
    if (dragSourceId === dropTargetId) return false;
    if (!dragSource) return false;

    // 1. Cycle check: prevent dropping a node into its own descendants.
    let current = dropTarget;
    while (current) {
      if (current.id === dragSourceId) return false;
      current = currentTree.find(n => n.id === current.parent);
    }
    
    // 2. Check if the source node is a child of a group. If so, disable drop.
    const sourceNode = currentTree.find(n => n.id === dragSourceId);
    if (sourceNode && sourceNode.parent !== rootId && sourceNode.parent !== 0) {
        const parentNode = currentTree.find(n => n.id === sourceNode.parent);
        if (parentNode && parentNode.data?.type === 'group') {
            return false;
        }
    }

    // 3. Root-level drop logic
    if (dropTargetId === rootId) {
      if (rootId === 'projects') return dragSource?.data?.type === 'project';
      if (rootId === 'default') return false;
      return true;
    }

    if (!dropTarget) return false;

    const srcType = dragSource.data?.type;
    const tgtType = dropTarget.data?.type;

    // 4. Type-based drop rules
    if (srcType === 'project') return false;

    if (srcType === 'group') {
      return tgtType === 'project' || tgtType === 'group';
    }

    if (srcType === 'list') {
      return tgtType === 'group' || tgtType === 'project';
    }

    return false;
  };

  // handleDrop — вызываем onDrop асинхронно, чтобы не конфликтовать с внутренними событиями библиотеки
  const handleDrop = useCallback((newTree, options) => {
    if (typeof onDrop === 'function') {
      // асинхронный вызов, безопасный в контексте drag
      queueMicrotask(() => {
        try {
          onDrop(rootId, newTree, options);
        } catch (err) {
          console.error('onDrop error:', err);
        }
      });
    }
  }, [onDrop, rootId]);

  // мемоизируем render-функции превью и placeholder (они не должны содержать state)
  const placeholderRender = useCallback((node, { depth }) => (
    <div className={styles.placeholder} style={{ paddingInlineStart: depth * 24 }}>
      <div className={styles.placeholderLine}>
        <span className={styles.placeholderText}>Переместить сюда</span>
      </div>
    </div>
  ), []);

  const dragPreviewRender = useCallback((monitorProps) => (
    <CustomDragPreview monitorProps={monitorProps} />
  ), []); // CustomDragPreview — мемоизированный

  // memoize main node render
  const nodeRender = useCallback((node, ctx) => (
    <CustomNode
      node={node}
      depth={ctx.depth}
      isOpen={ctx.isOpen}
      onToggle={ctx.onToggle}
      selectedId={selectedId}
      onSelect={onSelect}
      onRename={onRename}
      dropMode={dropMode}
    />
  ), [selectedId, onSelect, onRename, dropMode]);

  return (
    <>
      <ErrorBoundary>
        <Tree
          tree={memoTree}
          rootId={rootId}
          onDrop={handleDrop}
          canDrag={canDrag}
          canDrop={canDrop}
          sort={false}
          insertDroppableFirst={false}
          enableAnimateExpand={true}
          dropTargetOffset={10}
          classes={useMemo(()=>({
            root: styles.treeRoot,
            draggingSource: styles.draggingSource,
            dropTarget: styles.dropTarget,
            placeholder: styles.placeholder
          }), [])}
          placeholderRender={placeholderRender}
          dragPreviewRender={dragPreviewRender}
          render={nodeRender}
        />
      </ErrorBoundary>
    </>
  );
};

ListsTreeAnimated.propTypes = {
  treeData: PropTypes.array.isRequired,
  rootId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func,
  selectedId: PropTypes.string,
  onDrop: PropTypes.func,
  onRename: PropTypes.func,
  dropMode: PropTypes.oneOf(['menu', 'zones'])
};

export default ListsTreeAnimated;