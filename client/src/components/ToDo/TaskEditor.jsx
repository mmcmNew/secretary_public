import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import TaskTypeDialog from "../TaskTypeManager/TaskTypeDialog.jsx";
import PropTypes from "prop-types";
import { TaskTitleSection, TaskFieldsSection } from "./TaskEditor/components";

function TaskEditor({
    taskFields,
    task = null,
    subtasks = [],
    onChange = null,
    addSubTask = null,
    changeTaskStatus = null,
    deleteTask = null,
    showJournalButton = true,
}) {
    const methods = useForm({ defaultValues: { subtasks: [] } });
    const { control, reset, formState: { errors }, getValues } = methods;
    const { fields: subtaskFields, append, remove, replace } = useFieldArray({ control, name: 'subtasks' });
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [newTypeData, setNewTypeData] = useState({ name: '', color: '#3788D8', description: '' });
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    // Memoized task ID for comparison
    const taskId = useMemo(() => task?.id, [task?.id]);
    
    // Memoized initial form data - only recalculate when task ID changes
    const initialFormData = useMemo(() => {
        if (!task || !taskFields) return {};
        
        const initial = {};
        Object.entries(taskFields).forEach(([key, field]) => {
            const taskValue = task[key];
            
            if (field.type === 'range') {
                initial[key] = {
                    start: task.start ? dayjs(task.start).toISOString() : null,
                    end: task.end ? dayjs(task.end).toISOString() : null,
                };
            } else if (field.type === 'select' || field.type === 'multiselect') {
                initial[key] = taskValue ?? null;
            } else {
                initial[key] = taskValue ?? (field.type === 'toggle' ? false : (field.type === 'multiselect' ? [] : ''));
            }
        });
        initial.title = task.title;
        initial.subtasks = Array.isArray(subtasks) ? subtasks.map(st => ({ 
            id: st.id, 
            title: st.title, 
            is_completed: st.is_completed 
        })) : [];
        
        return initial;
    }, [taskId, taskFields, subtasks]); // Removed 'task' dependency to prevent form reset on task updates

    // Initialize form when task ID changes only
    useEffect(() => {
        if (!task || !taskFields) return;
        console.log('Initializing form for task:', taskId);
        reset(initialFormData);
        replace(initialFormData.subtasks);
    }, [taskId, taskFields, reset, replace]); // Only reset when taskId changes

    // Sync subtaskFields with subtasks prop changes
    useEffect(() => {
        if (Array.isArray(subtasks) && subtasks.length !== subtaskFields.length) {
            const formattedSubtasks = subtasks.map(st => ({ 
                id: st.id, 
                title: st.title, 
                is_completed: st.is_completed 
            }));
            replace(formattedSubtasks);
        }
    }, [subtasks, subtaskFields.length, replace]);

    // Stable callbacks
    const triggerParentOnChange = useCallback((updatedField, updatedValue) => {
        if (!onChange || !taskId) {
            console.log('triggerParentOnChange skipped:', { updatedField, updatedValue, hasOnChange: !!onChange, hasTaskId: !!taskId });
            return;
        }
        
        const updateData = {
            taskId: taskId,
            [updatedField]: updatedValue,
        };

        // Handle special cases for date fields
        if (updatedField === 'start' || updatedField === 'end') {
            updateData[updatedField] = updatedValue;
        } else if (updatedField === 'range' && typeof updatedValue === 'object' && updatedValue !== null) {
            if ('start' in updatedValue) {
                updateData.start = updatedValue.start;
            }
            if ('end' in updatedValue) {
                updateData.end = updatedValue.end;
            }
        }

        console.log('triggerParentOnChange called:', { updatedField, updatedValue, updateData });
        onChange(updateData);
    }, [onChange, taskId]);

    const handleToggle = useCallback((taskId, is_completed) => {
        if (changeTaskStatus) {
            // According to API: PUT /api/tasks/change_status
            // This works for both main tasks and subtasks since subtasks are also tasks
            const updateData = { 
                taskId, 
                is_completed 
            };
            
            // Add completed_at only when marking as completed
            if (is_completed) {
                updateData.completed_at = new Date().toISOString();
            }
            
            console.log('handleToggle called:', { taskId, is_completed, updateData, isSubtask: taskId !== task?.id });
            
            try {
                changeTaskStatus(updateData).unwrap().then(result => {
                    console.log('changeTaskStatus result:', result);
                }).catch(error => {
                    console.error('changeTaskStatus error:', error);
                });
            } catch (error) {
                console.error('changeTaskStatus error:', error);
            }
        }
    }, [changeTaskStatus, task?.id]);

    const handleSubBlur = useCallback(async (index) => {
        const field = subtaskFields[index];
        const title = getValues(`subtasks.${index}.title`).trim();
        if (!title) return;
        
        console.log('handleSubBlur called:', { index, field, title });
        
        if (!field.id && addSubTask) {
            // Create new subtask using API: POST /api/tasks/add_subtask
            console.log('Creating new subtask:', { title, parentTaskId: taskId });
            try {
                const result = await addSubTask({ 
                    title, 
                    parentTaskId: taskId 
                }).unwrap();
                console.log('addSubTask result:', result);
                
                // Add the new subtask to local state for immediate UI update
                if (result.subtask) {
                    append({ 
                        id: result.subtask.id, 
                        title: result.subtask.title, 
                        is_completed: result.subtask.is_completed 
                    });
                }
            } catch (error) {
                console.error('addSubTask error:', error);
            }
        } else if (field.id) {
            // Update existing subtask using updateTask API since subtasks are also tasks
            console.log('Updating existing subtask title:', { subtaskId: field.id, title });
            
            if (onChange) {
                // Use the same updateTask API that's used for main tasks
                const updateData = {
                    taskId: field.id, // Use subtask ID, not parent task ID
                    title: title
                };
                
                console.log('Calling updateTask for subtask:', updateData);
                onChange(updateData);
            }
        }
    }, [subtaskFields, getValues, addSubTask, taskId, onChange, append]);

    const handleAddSubtask = useCallback(async (e) => {
        if (e.type === 'keydown' && e.key !== 'Enter') return;
        e.preventDefault();
        const title = newSubtaskTitle.trim();
        if (!title) return;
        
        console.log('handleAddSubtask called:', { title, taskId });
        
        if (addSubTask) {
            // Use API: POST /api/tasks/add_subtask
            console.log('Calling addSubTask API');
            try {
                const result = await addSubTask({ 
                    title, 
                    parentTaskId: taskId 
                }).unwrap();
                console.log('addSubTask result:', result);
                
                // Add the new subtask to local state for immediate UI update
                if (result.subtask) {
                    append({ 
                        id: result.subtask.id, 
                        title: result.subtask.title, 
                        is_completed: result.subtask.is_completed 
                    });
                }
            } catch (error) {
                console.error('addSubTask error:', error);
            }
        } else {
            // Fallback for local development/testing
            console.log('Adding subtask locally');
            append({ title, status_id: 1 });
        }
        setNewSubtaskTitle('');
    }, [newSubtaskTitle, addSubTask, taskId, append]);

    const handleDeleteSubTask = useCallback((subId) => {
        if (deleteTask) {
            // Use API: DELETE /api/tasks/del_task
            console.log('handleDeleteSubTask called:', subId);
            
            try {
                deleteTask({ taskId: subId }).unwrap().then(result => {
                    console.log('deleteTask result:', result);
                    // Remove from local state
                    const index = subtaskFields.findIndex(field => field.id === subId);
                    if (index !== -1) {
                        remove(index);
                    }
                }).catch(error => {
                    console.error('deleteTask error:', error);
                });
            } catch (error) {
                console.error('deleteTask error:', error);
            }
        }
    }, [deleteTask, subtaskFields, remove]);

    const updateNewTypeData = useCallback((field, value) => {
        setNewTypeData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Memoized completion status text
    const completionText = useMemo(() => {
        if (!task?.is_completed) return null;
        return (
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                Завершено: {task.completed_at ? dayjs(task.completed_at).format('DD/MM/YYYY HH:mm') : ''}
            </Typography>
        );
    }, [task?.is_completed, task?.completed_at]);

    // Early return if no task
    if (!task) return null;

    return (
        <FormProvider {...methods}>
            <Box sx={{ width: '100%', height: '96%', pb: 2 }}>
                <TaskTitleSection
                    key={`title-${taskId}`}
                    task={task}
                    control={control}
                    handleToggle={handleToggle}
                    handleSubBlur={handleSubBlur}
                    handleAddSubtask={handleAddSubtask}
                    handleDeleteSubTask={handleDeleteSubTask}
                    newSubtaskTitle={newSubtaskTitle}
                    setNewSubtaskTitle={setNewSubtaskTitle}
                    subtaskFields={subtaskFields}
                    remove={remove}
                    triggerParentOnChange={triggerParentOnChange}
                />
                
                {completionText}
                
                <TaskFieldsSection
                    key={`fields-${taskId}`}
                    taskFields={taskFields}
                    control={control}
                    errors={errors}
                    triggerParentOnChange={triggerParentOnChange}
                    showJournalButton={showJournalButton}
                    setTypeDialogOpen={setTypeDialogOpen}
                />
                
                <TaskTypeDialog
                    open={typeDialogOpen}
                    onClose={() => setTypeDialogOpen(false)}
                    data={newTypeData}
                    onChange={updateNewTypeData}
                    onSave={async () => {
                        // Task types should be updated outside the component
                        setTypeDialogOpen(false);
                    }}
                />
            </Box>
        </FormProvider>
    );
}

TaskEditor.propTypes = {
    taskFields: PropTypes.object,
    task: PropTypes.object,
    subtasks: PropTypes.array,
    onChange: PropTypes.func,
    addSubTask: PropTypes.func,
    updateTask: PropTypes.func,
    changeTaskStatus: PropTypes.func,
    deleteTask: PropTypes.func,
    showJournalButton: PropTypes.bool,
};

export default memo(TaskEditor);