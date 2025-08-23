import { Virtuoso } from 'react-virtuoso';
import PropTypes from 'prop-types';

// Simple wrapper around Virtuoso to render an array of items.
// items: array of arbitrary entries
// itemContent: (index, item) => ReactNode
export default function VirtualizedTasksList({ items, itemContent, style }) {
  return (
    <div style={style || { height: '60vh' }}>
      <Virtuoso
        data={items}
        itemContent={(index, item) => itemContent(index, item)}
        style={{ height: '100%' }}
      />
    </div>
  );
}

VirtualizedTasksList.propTypes = {
  items: PropTypes.array.isRequired,
  itemContent: PropTypes.func.isRequired,
  style: PropTypes.object,
};
