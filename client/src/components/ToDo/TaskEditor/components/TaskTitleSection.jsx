import { memo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    TextField,
    Checkbox,
    IconButton,
    Grid,
    Divider,
    Paper,
    InputBase,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Controller } from 'react-hook-form';

/**
 * Component for task title and subtasks section
 */
const TaskTitleSection = memo(function TaskTitleSection({
    task,
    control,
    handleToggle,
    handleSubBlur,
    handleAddSubtask,
    handleDeleteSubTask,
    newSubtaskTitle,
    setNewSubtaskTitle,
    subtaskFields,
    remove,
    triggerParentOnChange,
}) {
    const handleKeyDown = useCallback((e, field, onEnter) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onEnter(e.target.value);
        }
    }, []);

    // Log subtaskFields changes
    useEffect(() => {
        console.log('TaskTitleSection subtaskFields changed:', subtaskFields);
    }, [subtaskFields]);

    return (
        <Paper variant="outlined" sx={{ p: 1, my: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                    checked={task.is_completed}
                    sx={{ mr: 1, p: 0 }}
                    onChange={(e) => handleToggle(task.id, e.target.checked)}
                />
                <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            label="Название задачи"
                            sx={{ width: '100%', my: 1 }}
                            {...field}
                            multiline
                            maxRows={3}
                            variant="outlined"
                            onChange={(e) => {
                                // Update form value immediately to prevent reset
                                field.onChange(e.target.value);
                            }}
                            onBlur={(e) => {
                                // Trigger parent update when title changes
                                if (e.target.value !== task.title) {
                                    console.log('Title changed on blur, triggering update:', e.target.value);
                                    triggerParentOnChange('title', e.target.value);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Trigger parent update on Enter
                                    if (e.target.value !== task.title) {
                                        console.log('Title changed on Enter, triggering update:', e.target.value);
                                        triggerParentOnChange('title', e.target.value);
                                    }
                                }
                            }}
                        />
                    )}
                />
            </Box>
            
            <Box sx={{ marginY: 0 }}>
                {subtaskFields?.map((sub, idx) => (
                    <Grid container alignItems="center" spacing={0.5} key={sub.id || idx} sx={{ marginY: 0.5 }}>
                        <Grid item xs width="100%">
                            <Box component="form" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <Checkbox
                                    checked={sub.is_completed}
                                    sx={{ m: 0, p: 0 }}
                                    onChange={(e) => sub.id && handleToggle(sub.id, e.target.checked)}
                                />
                                <Controller
                                    name={`subtasks.${idx}.title`}
                                    control={control}
                                    render={({ field }) => (
                                        <InputBase
                                            sx={{ 
                                                ml: 1, 
                                                flex: 1, 
                                                textDecoration: sub.is_completed ? 'line-through' : 'none', 
                                                width: '100%' 
                                            }}
                                            placeholder="Подзадача"
                                            {...field}
                                            onBlur={() => handleSubBlur(idx)}
                                            onKeyDown={(e) => handleKeyDown(e, `subtasks.${idx}.title`, () => handleSubBlur(idx))}
                                            inputProps={{ 'aria-label': 'subtask' }}
                                        />
                                    )}
                                />
                                <Divider sx={{ height: 15, m: 0.5 }} orientation="vertical" />
                                <IconButton 
                                    sx={{ m: 0, p: 0 }} 
                                    onClick={() => sub.id ? handleDeleteSubTask(sub.id) : remove(idx)}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                            <Divider sx={{ m: 0.5 }} />
                        </Grid>
                    </Grid>
                ))}
            </Box>
            
            <Grid item xs>
                <Box component="form" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <IconButton sx={{ m: 0, p: 0 }} onClick={handleAddSubtask}>
                        <AddIcon />
                    </IconButton>
                    <InputBase
                        sx={{ flex: 1, ml: 1 }}
                        placeholder="Новая подзадача"
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={handleAddSubtask}
                        inputProps={{ 'aria-label': 'add subtask' }}
                    />
                </Box>
            </Grid>
        </Paper>
    );
});

TaskTitleSection.propTypes = {
    task: PropTypes.object.isRequired,
    control: PropTypes.object.isRequired,
    handleToggle: PropTypes.func.isRequired,
    handleSubBlur: PropTypes.func.isRequired,
    handleAddSubtask: PropTypes.func.isRequired,
    handleDeleteSubTask: PropTypes.func.isRequired,
    newSubtaskTitle: PropTypes.string.isRequired,
    setNewSubtaskTitle: PropTypes.func.isRequired,
    subtaskFields: PropTypes.array.isRequired,
    remove: PropTypes.func.isRequired,
    triggerParentOnChange: PropTypes.func.isRequired,
};

export default TaskTitleSection;
