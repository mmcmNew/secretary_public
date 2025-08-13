import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import PropTypes from 'prop-types';

// MuiListsTree using RichTreeView
const MuiListsTree = ({ treeData, rootId = 0, selectedId, onSelect, onRename }) => {
  console.log('MuiListsTree received:', { treeData, rootId });
  
  // Utility: build nested tree structure from flat data
  const buildTree = (nodes, parent) => {
    return nodes
      .filter((n) => n.parent === parent)
      .map((n) => ({ 
        id: n.id,
        label: n.text,
        children: buildTree(nodes, n.id)
      }));
  };

  const nestedData = buildTree(treeData, rootId);
  console.log('Built tree data:', nestedData);

  return (
    <RichTreeView
      items={nestedData}
      selectedItems={selectedId ? [selectedId] : []}
      onItemSelectionToggle={(event, itemId) => onSelect?.(itemId)}
      isItemEditable={() => true}
      onItemLabelChange={(itemId, newLabel) => onRename?.(itemId, newLabel)}
      sx={{ overflowY: 'auto', maxHeight: '100%' }}
    />
  );
};

MuiListsTree.propTypes = {
  treeData: PropTypes.array.isRequired,
  rootId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func,
  onRename: PropTypes.func,
};

export default MuiListsTree;
