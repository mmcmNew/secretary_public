function getDragDepth(offset, indentationWidth) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(
  items,
  activeId,
  overId,
  dragOffset,
  indentationWidth
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = [...items];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const parent = findParent(items, activeItemIndex, projectedDepth);

  return {
    depth: projectedDepth,
    parent,
  };
}

function findParent(items, activeItemIndex, projectedDepth) {
  let parent = null;
  for (let i = activeItemIndex - 1; i >= 0; i--) {
    const item = items[i];
    if (item.depth < projectedDepth) {
      parent = item.id;
      break;
    }
  }
  return parent;
}

export function flatten(
  items,
  parentId = null,
  depth = 0
) {
  return items.reduce((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(item.children ?? [], item.id, depth + 1),
    ];
  }, []);
}

export function flattenTree(tree) {
  return flatten(tree);
}

export function buildTree(flattenedItems) {
  const root = { id: 'root', children: [] };
  const nodes = { [root.id]: root };
  const items = flattenedItems.map((item) => ({ ...item, children: [] }));

  for (const item of items) {
    const { id, children } = item;
    const parentId = item.parentId ?? 'root';
    const parent = (nodes[parentId] = nodes[parentId] ?? findItem(items, parentId));
    nodes[id] = { id, children };
    parent.children.push(item);
  }

  return root.children;
}

export function findItem(items, itemId) {
    return items.find(({ id }) => id === itemId);
}

export function removeChildrenOf(items, ids) {
  const exclude = [...ids];

  return items.filter((item) => {
    if (exclude.includes(item.parentId)) {
      exclude.push(item.id);
      return false;
    }
    return true;
  });
}