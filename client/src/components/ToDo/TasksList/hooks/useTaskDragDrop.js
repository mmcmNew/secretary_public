import { useEffect, useCallback } from 'react';
import { Draggable } from "@fullcalendar/interaction";

/**
 * Hook for managing task drag and drop functionality
 */
export const useTaskDragDrop = (containerId, tasks) => {
    /**
     * Initialize draggable functionality
     */
    useEffect(() => {
        const draggableEl = document.getElementById(`tasksList${containerId}`);
        if (!draggableEl) return;

        const draggable = new Draggable(draggableEl, {
            itemSelector: '.draggable-task',
            eventData: (eventEl) => {
                const id = eventEl.getAttribute("data-id");
                const task = tasks.find((t) => String(t.id) === id);
                if (!task) return null;
                return {
                    title: task.title,
                    id: task.id,
                    start: task.start || null,
                    end: task.end || null,
                    allDay: !task.start,
                };
            },
        });

        return () => draggable.destroy();
    }, [tasks, containerId]);

    /**
     * Handle drag start event
     */
    const handleDragStart = useCallback((event, task) => {
        event.dataTransfer.setData("task", JSON.stringify(task));
    }, []);

    return {
        handleDragStart,
    };
};


