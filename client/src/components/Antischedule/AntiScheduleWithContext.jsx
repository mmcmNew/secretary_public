import { useContext } from 'react';
import { ErrorContext } from '../../contexts/ErrorContext';
import AntiScheduleLayout from './AntiScheduleLayout';

export default function AntiScheduleWithContext(props) {
  const { setError, setSuccess } = useContext(ErrorContext);
  return <AntiScheduleLayout {...props} onError={setError} onSuccess={setSuccess} />;
}
