import React from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTreeItem = ({ id, item }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { name, depth } = item;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ paddingLeft: `${depth * 24}px`, marginBottom: '4px' }}>
        <span>{name}</span>
      </div>
    </div>
  );
};

SortableTreeItem.propTypes = {
  id: PropTypes.string.isRequired,
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    depth: PropTypes.number,
  }).isRequired,
};

SortableTreeItem.defaultProps = {
    item: {
        depth: 0,
    }
};

export default SortableTreeItem;