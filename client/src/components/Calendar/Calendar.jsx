import React from 'react';
import CalendarLayout from './CalendarLayout';

/**
 * Обертка для обратной совместимости со старым Calendar.jsx
 * Использует новый оптимизированный CalendarLayout внутри
 * 
 * @deprecated Используйте CalendarLayout напрямую
 */
export default function CalendarLegacy() {
  const handleSuccess = (message) => {
    console.log('Calendar success:', message);
  };

  const handleError = (error) => {
    console.error('Calendar error:', error);
  };

  return (
    <CalendarLayout
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}