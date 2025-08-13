// GroupItem/GroupChildren.jsx
import PropTypes from 'prop-types';
import { styles } from './GroupItem.styles';

export default function GroupChildren({ item, childrenLists, renderListItem, renderGroupItem }) {
  return (
    <div style={styles.treeLineContainer}>
      {item.childes_order.map((childId, index) => {
        const child = childrenLists?.find(
          (c) => c?.id === childId || c?.realId === childId
        );

        if (!child) return null;

        const isLast = index === item.childes_order.length - 1;

        return (
          <div key={childId} style={styles.treeItem(isLast)}>
            {child.type === 'group'
              ? renderGroupItem(child)
              : renderListItem(child)}
          </div>
        );
      })}
    </div>
  );
}

GroupChildren.propTypes = {
  item: PropTypes.object.isRequired,
  childrenLists: PropTypes.array,
  renderListItem: PropTypes.func.isRequired,
  renderGroupItem: PropTypes.func.isRequired,
};
