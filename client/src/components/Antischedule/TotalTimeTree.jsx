import { PropTypes } from 'prop-types';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/system';
import { useEffect, useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const calculateTime = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  return (endTime - startTime) / (1000 * 60); // Время в минутах
};

const theme = createTheme();

const TotalTimeTree = ({ tasks }) => {
  const [localTasks, setLocalTasks] = useState(tasks || null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Используем useMemo для оптимизации вычислений
  const groupedData = useMemo(() => {
    if (!localTasks) return null;

    // Группировка задач
    const groupedDataRaw = localTasks.reduce((acc, task) => {
      const periodType = task.type?.group_label || 'Не указано';
      const taskType = task.type?.type_name || 'Другое';

      if (!acc[periodType]) {
        acc[periodType] = { totalTime: 0, tasks: {} };
      }

      if (!acc[periodType].tasks[taskType]) {
        acc[periodType].tasks[taskType] = 0;
      }

      const taskTime = calculateTime(task.start, task.end);
      acc[periodType].totalTime += taskTime;
      acc[periodType].tasks[taskType] += taskTime;

      return acc;
    }, {});

    // Сортировка: "Не указано" в конец
    const sortedGroupedData = {};
    Object.keys(groupedDataRaw)
      .sort((a, b) => {
        if (a === 'Не указано') return 1;
        if (b === 'Не указано') return -1;
        return a.localeCompare(b, 'ru');
      })
      .forEach(key => {
        sortedGroupedData[key] = groupedDataRaw[key];
      });

    return sortedGroupedData;
  }, [localTasks]);

  if (!localTasks) return null;

  return (
    <ThemeProvider theme={theme}>
      <SimpleTreeView
        aria-label="Task Statistics"
        defaultExpandedItems={['root']}
        slots={{
          expandIcon: ArrowRightIcon,
          collapseIcon: ArrowDropDownIcon,
        }}
        sx={{ flexGrow: 1, maxWidth: 400 }}
      >
        {/* Верхний уровень: Общее время */}
        <TreeItem itemId="root" label="Подсчет времени">
          {Object.entries(groupedData).map(([periodType, periodData], index) => (
            <TreeItem
              key={index}
              itemId={`period-${index}`}
              label={
                <Box sx={{ flex: 1, display: "flex", flexDirection: "row", justifyContent: "space-between", padding: 1 }}>
                  <Typography>{periodType}</Typography>
                  <Typography sx={{ marginLeft: 'auto', fontWeight: 'bold' }}>
                    {Math.round(periodData.totalTime)} мин.
                  </Typography>
                </Box>
              }
            >
              {Object.entries(periodData.tasks).map(([taskType, taskTime], idx) => (
                <TreeItem
                  key={idx}
                  itemId={`task-${index}-${idx}`}
                  label={
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "row", justifyContent: "space-between", padding: 1 }}>
                      <Typography>{taskType}</Typography>
                      <Typography sx={{ marginLeft: 'auto' }}>
                        {Math.round(taskTime)} мин.
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </TreeItem>
          ))}
        </TreeItem>
      </SimpleTreeView>
    </ThemeProvider>
  );
};

export default TotalTimeTree;

TotalTimeTree.propTypes = {
  tasks: PropTypes.array,
};
