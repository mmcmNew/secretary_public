import React, { useState } from 'react';
import { Tree } from '@minoru/react-dnd-treeview';
import { Badge, Box, Typography, TextField } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import FolderIcon from '@mui/icons-material/Folder';
import ListIcon from '@mui/icons-material/List';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PushPinIcon from '@mui/icons-material/PushPin';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import LinkIcon from '@mui/icons-material/Link';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import PropTypes from 'prop-types';
import styles from './ListsTreeAnimated.module.css';
import DropActionMenu from './DropActionMenu';

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

  const renderDropZones = () => {
    if (dropMode !== 'zones' || !node.droppable) return null;
    
    return (
      <>
        <div className={styles.dropZoneLeft} title="Связать">
          <LinkIcon fontSize="small" />
        </div>
        <div className={styles.dropZoneRight} title="Переместить">
          <DriveFileMoveIcon fontSize="small" />
        </div>
      </>
    );
  };

  return (
    <div
      className={`${styles.root} ${selectedId === node.id ? styles.selected : ''} ${dropMode === 'zones' && node.droppable ? styles.withDropZones : ''}`}
      style={{ paddingInlineStart: indent }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className={`${styles.expandIconWrapper} ${isOpen ? styles.isOpen : ''}`}>
        {node.droppable && (
          <div onClick={handleToggle} className={styles.expandIcon}>
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
      
      {renderDropZones()}
    </div>
  );
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

const ListsTreeAnimated = ({ treeData, onSelect, selectedId, onDrop, onRename, dropMode = 'menu' }) => {
  const [menuState, setMenuState] = useState({ open: false, anchorPosition: null, pendingDrop: null });
  const canDrag = (node) => node.data?.type !== 'standard';

  const canDrop = (tree, { dragSource, dropTarget, dropTargetId }) => {
    if (!dragSource) return false;
    const sourceType = dragSource.data?.type;
    const targetType = dropTarget?.data?.type;
    
    if (sourceType === 'standard') return false;
    
    // Корневой уровень - разрешаем только сортировку одинаковых типов
    if (dropTargetId === 0) {
      // Проверяем, что в текущей секции есть элементы того же типа
      const hasSameTypeInSection = tree.some(node => 
        node.parent === 0 && node.data?.type === sourceType
      );
      return hasSameTypeInSection;
    }
    
    // Перетаскивание в контейнеры
    if (sourceType === 'list') return targetType === 'group' || targetType === 'project';
    if (sourceType === 'group') return targetType === 'project';
    
    // Сортировка между элементами одного типа
    return sourceType === targetType;
  };

  const handleDrop = (newTree, options) => {
    const { dragSource, dropTarget } = options;
    console.log('handleDrop', { newTree, options });
    
    // Проверяем, нужно ли показывать меню выбора действия
    const isMovingToContainer = dragSource && dropTarget && dropTarget.droppable &&
      ((dragSource.data?.type === 'list' && (dropTarget.data?.type === 'group' || dropTarget.data?.type === 'project')) ||
       (dragSource.data?.type === 'group' && dropTarget.data?.type === 'project'));
    
    // Проверяем, происходит ли сортировка внутри того же контейнера
    const isSortingWithinSameContainer = () => {
      const sourceParent = treeData.find(node => node.id === dragSource.parent);
      return sourceParent && sourceParent.id === dropTarget.id;
    };
    
    const needsActionChoice = dropMode === 'menu' && 
      isMovingToContainer && 
      !isSortingWithinSameContainer();
    
    if (needsActionChoice) {
      setMenuState({
        open: true,
        anchorPosition: { top: window.event?.clientY || 0, left: window.event?.clientX || 0 },
        pendingDrop: { newTree, options }
      });
    } else {
      if (onDrop) onDrop(newTree, options);
    }
  };

  const handleMenuAction = (action) => {
    if (menuState.pendingDrop && onDrop) {
      const { newTree, options } = menuState.pendingDrop;
      onDrop(newTree, { ...options, action });
    }
    setMenuState({ open: false, anchorPosition: null, pendingDrop: null });
  };

  const handleMenuClose = () => {
    setMenuState({ open: false, anchorPosition: null, pendingDrop: null });
  };

  return (
    <>
      <Tree
        tree={treeData}
        rootId={0}
        onDrop={handleDrop}
        canDrag={canDrag}
        canDrop={canDrop}
        sort={true}
        insertDroppableFirst={false}
        enableAnimateExpand={true}
        classes={{
          root: styles.treeRoot,
          draggingSource: styles.draggingSource,
          dropTarget: styles.dropTarget,
          placeholder: styles.placeholder
        }}
        placeholderRender={(node, { depth }) => (
          <div 
            className={styles.placeholder}
            style={{ paddingInlineStart: depth * 24 }}
          >
            <div className={styles.placeholderLine}>
              <span className={styles.placeholderText}>Переместить сюда</span>
            </div>
          </div>
        )}
        dragPreviewRender={(monitorProps) => (
          <CustomDragPreview monitorProps={monitorProps} />
        )}
        render={(node, { depth, isOpen, onToggle }) => (
          <CustomNode
            node={node}
            depth={depth}
            isOpen={isOpen}
            onToggle={onToggle}
            selectedId={selectedId}
            onSelect={onSelect}
            onRename={onRename}
            dropMode={dropMode}
          />
        )}
      />
      <DropActionMenu
        open={menuState.open}
        anchorPosition={menuState.anchorPosition}
        onClose={handleMenuClose}
        onAction={handleMenuAction}
        sourceType={menuState.pendingDrop?.options?.dragSource?.data?.type}
        targetType={menuState.pendingDrop?.options?.dropTarget?.data?.type}
      />
    </>
  );
};

ListsTreeAnimated.propTypes = {
  treeData: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  selectedId: PropTypes.string,
  onDrop: PropTypes.func,
  onRename: PropTypes.func,
  dropMode: PropTypes.oneOf(['menu', 'zones'])
};

export default ListsTreeAnimated;