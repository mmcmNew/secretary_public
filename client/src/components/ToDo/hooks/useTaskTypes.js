// // hooks/useTaskTypes.js
// import api from '../../../utils/api';

// export const useTaskTypes = () => {
//   const getTaskTypes = async () => {
//     const { data } = await api.get('/tasks/task_types');
//     return data;
//   };

//   const getTaskTypeGroups = async () => {
//     const { data } = await api.get('/tasks/task_type_groups');
//     return data;
//   };

//   const addTaskType = async (params) => {
//     const { data } = await api.post('/tasks/task_types', params);
//     return data;
//   };

//   // ... другие мутации

//   return {
//     getTaskTypes,
//     getTaskTypeGroups,
//     addTaskType,
//     // ...
//   };
// };