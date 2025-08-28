import { MenuItem } from '@mui/material';

/**
 * Build hierarchical menu items from lists and projects
 * @param {Array} listsList - Array of lists
 * @param {Array} projects - Array of projects
 * @param {Function} onItemClick - Callback for item click
 * @returns {Array} Array of menu items
 */
export function buildHierarchicalMenu(listsList = [], projects = [], onItemClick) {
    if (!listsList || !projects) return [];
    
    const allItems = (listsList || []).concat(projects || []);
    const itemsMap = new Map(allItems.map((item) => [item.id, item]));
    const rootProjects = (projects || []).filter((item) => !item.deleted);
    const elements = [];
    let menuIndex = 0;
    const visited = new Set();

    const traverse = (item, depth = 0) => {
        if (visited.has(item.id) || depth > 10) return;
        visited.add(item.id);

        if (item.type === "project" || item.type === "group") {
            elements.push({
                key: menuIndex++,
                type: 'header',
                title: item.title,
                id: item.id,
                depth,
                disabled: true
            });
            
            (item.childes_order || []).forEach((childId) => {
                const child = itemsMap.get(childId);
                if (child && !visited.has(childId)) {
                    traverse(child, depth + 1);
                }
            });
        } else if (item.type === "list") {
            elements.push({
                key: menuIndex++,
                type: 'item',
                title: item.title,
                id: item.id,
                depth,
                onClick: () => onItemClick(item.id)
            });
        }
    };

    rootProjects.forEach((item) => traverse(item));
    const rootLists = (listsList || []).filter(
        (item) => item.in_general_list && !item.deleted && !item.parent_id
    );
    rootLists.forEach((item) => traverse(item));

    return elements;
}

/**
 * Convert menu items to React components
 * @param {Array} menuItems - Array of menu item objects
 * @returns {Array} Array of React MenuItem components
 */
export function renderMenuItems(menuItems) {
    return menuItems.map(item => {
        if (item.type === 'header') {
            return (
                <MenuItem
                    key={item.key}
                    disabled
                    sx={{ pl: item.depth * 2 }}
                    data-id={item.id}
                >
                    {item.title}
                </MenuItem>
            );
        } else {
            return (
                <MenuItem
                    key={item.key}
                    data-id={item.id}
                    onClick={item.onClick}
                    sx={{ pl: item.depth * 2 }}
                >
                    {item.title}
                </MenuItem>
            );
        }
    });
}
