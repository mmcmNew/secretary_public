import { useContext } from 'react';
import AntiScheduleContext from './AntiScheduleContext';

const useAntiSchedule = () => useContext(AntiScheduleContext);

export default useAntiSchedule;
