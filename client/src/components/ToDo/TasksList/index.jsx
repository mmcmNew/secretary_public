import { memo } from "react";
import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import PropTypes from "prop-types";
import TaskItem from "./TaskItem.jsx";
import { Virtuoso } from "react-virtuoso";

function TasksList({
    tasks = [],
    ...rest // Pass all other props down to TaskRow
}) {
    console.log('TasksList: tasks=', tasks, 'rest=', rest);
    if (!tasks || tasks.length === 0) {
        return (
            <Typography variant="body2" color="textSecondary" align="center">
                Нет задач для отображения
            </Typography>
        );
    }

    return (
        <Box
            sx={{
                height: "100%",
                overflow: "auto",
            }}
        >
            <Virtuoso
                data={tasks}
                itemContent={(index, task) => (
                    <TaskItem
                        key={task?.id || index}
                        task={task}
                        {...rest} // Pass down all the functions and state
                    />
                )}
                style={{ height: "100%" }}
            />
        </Box>
    );
}

TasksList.propTypes = {
    tasks: PropTypes.array,
};

export default memo(TasksList);