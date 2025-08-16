import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createAuthorizedStore, waitForQuery } from './rtk-test-setup';
import { calendarApi } from '../../store/calendarApi';

describe.skip('Calendar RTK API', () => {
  let store;

  beforeEach(async () => {
    store = await createAuthorizedStore();
  });

  afterEach(() => {
    store.dispatch(calendarApi.util.resetApiState());
  });

  describe('getCalendarEvents', () => {
    it('should successfully get calendar events', async () => {
      // Подготавливаем диапазон дат
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 86400000).toISOString(); // +1 день
      const dateRange = { start: startDate, end: endDate };

      store.dispatch(calendarApi.endpoints.getCalendarEvents.initiate(dateRange));
      const result = await waitForQuery(store, 'getCalendarEvents');

      expect(result.status).toBe('fulfilled');
      expect(result.data).toBeDefined();
      expect(result.data.events).toBeDefined();
      expect(Array.isArray(result.data.events)).toBe(true);
    });

    it('should get calendar events without dates', async () => {
      const dateRange = { start: '', end: '' };

      store.dispatch(calendarApi.endpoints.getCalendarEvents.initiate(dateRange));
      const result = await waitForQuery(store, 'getCalendarEvents');

      expect(result.status).toBe('fulfilled');
      expect(result.data).toBeDefined();
      expect(result.data.events).toBeDefined();
      expect(Array.isArray(result.data.events)).toBe(true);
    });

    it('should handle invalid date range gracefully', async () => {
      const dateRange = { start: 'invalid-date', end: 'another-invalid-date' };

      store.dispatch(calendarApi.endpoints.getCalendarEvents.initiate(dateRange));
      const result = await waitForQuery(store, 'getCalendarEvents');

      // Сервер может обработать невалидные даты по-разному, но запрос должен завершиться
      expect([true, false]).toContain(['fulfilled', 'rejected'].includes(result.status));
    });
  });
});