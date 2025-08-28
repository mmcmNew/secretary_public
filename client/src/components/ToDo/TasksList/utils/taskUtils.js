/**
 * Split tasks into active and completed arrays
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Object with activeTasks and completedTasks arrays
 */
export function splitTasksByStatus(tasks = []) {
    const active = [];
    const completed = [];
    
    if (Array.isArray(tasks)) {
        tasks.forEach(task => {
            if (task.is_completed) {
                completed.push(task);
            } else {
                active.push(task);
            }
        });
    }
    
    return { activeTasks: active, completedTasks: completed };
}

