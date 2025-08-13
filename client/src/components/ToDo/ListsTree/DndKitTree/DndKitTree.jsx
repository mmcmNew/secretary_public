import React from 'react';
import PropTypes from 'prop-types';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  buildTree,
  flattenTree,
  removeChildrenOf,
} from './utils';
import SortableTreeItem from './SortableTreeItem';

const DndKitTree = ({ treeData }) => {
  const [items, setItems] = useState(() => flattenTree(treeData));
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const sortedIds = useMemo(() => items.map(({ id }) => id), [items]);
  const activeItem = activeId ? items.find(({ id }) => id === activeId) : null;

  function handleDragStart({ active }) {
    setActiveId(active.id);
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null);

    if (over && active.id !== over.id) {
        const activeIndex = items.findIndex(({ id }) => id === active.id);
        const overIndex = items.findIndex(({ id }) => id === over.id);
        const newItems = [...items];
        const [movedItem] = newItems.splice(activeIndex, 1);
        newItems.splice(overIndex, 0, movedItem);
        setItems(newItems);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableTreeItem key={item.id} id={item.id} item={item} />
        ))}
      </SortableContext>
    </DndContext>
  );
};

DndKitTree.propTypes = {
  treeData: PropTypes.array,
};

DndKitTree.defaultProps = {
    treeData: [],
};

export default DndKitTree;