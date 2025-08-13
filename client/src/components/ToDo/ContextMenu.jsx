import React from 'react';

const ListsList = ({ onOpenProjectMenu }) => {
  return (
    <div>
      {/* ...other menu items... */}
      <div
        onClick={() => {
          if (typeof onOpenProjectMenu === 'function') {
            onOpenProjectMenu();
          } else {
            console.warn('onOpenProjectMenu is not defined or is not a function');
          }
        }}
      >
        Open Project Menu
      </div>
      {/* ...other menu items... */}
    </div>
  );
};

export default ListsList;