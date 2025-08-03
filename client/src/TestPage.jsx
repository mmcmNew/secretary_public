// import { Rnd } from 'react-rnd';
// import Calendar from './components/Calendar/Calendar';
// import { IconButton, Paper, Typography } from '@mui/material';
// import { Box } from '@mui/system';


// function TestPage() {

//   return (
//     <div>
//         <Rnd
//         size={{ width: '1400px', height: '900px' }}
//       enableResizing={true}
//       disableDragging={true}
//       style={{ display: 'block',
//               zIndex: 60,
//               borderRadius: 8, border: '1px solid' }}
//       bounds="parent"
//       onMouseDown={() => {console.log('нажатие на контейнер')}}
//       lockAspectRatio={false}
//       dragHandleClassName="drag-handle"
//       maxWidth={1400}
//       maxHeight={ 900}
//       minWidth={150}
//       minHeight={150}>
//       <Paper
//         sx={{
//           borderRadius: 2,
//           boxShadow: 3,
//           overflow: 'hidden',
//           display: 'flex',
//           flexDirection: 'column',
//           height: '100%',
//           width: '100%',
//         }}
//       >
//         <Paper
//           sx={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             px: 1,
//             backgroundColor: 'initial' ,
//           }}
//         >
//           <Box
//             className="drag-handle"
//             sx={{
//               display: 'flex',
//               alignItems: 'center',
//               flexGrow: 1,
//               cursor: 'move',
//             }}
//           >
//             <Typography variant="body2">{name}</Typography>
//           </Box>
//           <Box sx={{ display: 'flex' }}>
//             <IconButton size="small" >
//               1
//             </IconButton>
//             <IconButton size="small" >
//               2
//             </IconButton>
//             <IconButton size="small">
//               3
//             </IconButton>
//           </Box>
//         </Paper>
//         <Box
//           sx={{
//             flexGrow: 1,
//             overflow: 'auto',
//             borderBottomLeftRadius: 8,
//             borderBottomRightRadius: 8,
//           }}
//         >
//           <Calendar />
//         </Box>
//       </Paper>
//     </Rnd>
//     </div>
//   );
// }

// export default TestPage;
