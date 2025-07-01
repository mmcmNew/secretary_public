import { useContext } from 'react';
import { ErrorContext } from '../../contexts/ErrorContext';
import CalendarLayout from './CalendarLayout';

export default function CalendarWithContext(props) {
  const { setError, setSuccess } = useContext(ErrorContext);
  return <CalendarLayout {...props} onError={setError} onSuccess={setSuccess} />;
}
