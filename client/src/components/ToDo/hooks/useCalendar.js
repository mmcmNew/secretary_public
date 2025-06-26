import { useContext } from 'react';
import CalendarContext from './CalendarContext';

const useCalendar = () => useContext(CalendarContext);

export default useCalendar; 