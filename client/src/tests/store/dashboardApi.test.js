import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { dashboardApi } from '../../store/api/dashboardApi.jsx';
import { createAuthorizedStore } from './rtk-test-setup';

describe('Dashboard RTK API', () => {
  let store;

  beforeAll(async () => {
    store = await createAuthorizedStore();
  });

  afterEach(() => {
    store.dispatch(dashboardApi.util.resetApiState());
  });

  describe('createDashboard', () => {
    it('should create a new dashboard via /dashboard/create and update store', async () => {
      const dashboardData = {
        name: 'Created Dashboard',
        containers: [],
        themeMode: 'light',
        calendarSettings: null
      };

      const result = await store.dispatch(
        dashboardApi.endpoints.createDashboard.initiate(dashboardData)
      ).unwrap();

      expect(result).toBeDefined();
      expect(result.name).toBe('Created Dashboard');

      const state = store.getState().dashboard;
      expect(state.id).toBe(result.id);
      expect(state.name).toBe('Created Dashboard');
    });
  });

  describe('listDashboards', () => {
    it('should return a list of dashboards', async () => {
      const result = await store.dispatch(
        dashboardApi.endpoints.listDashboards.initiate()
      ).unwrap();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
      }
    });
  });

  describe('saveDashboard', () => {
    it('should successfully save dashboard data and update store', async () => {
      const fetchResult = await store.dispatch(
        dashboardApi.endpoints.fetchDashboard.initiate()
      ).unwrap();

      const dashboardData = {
        dashboard_data: {
          id: fetchResult.id,
          name: 'Updated Dashboard'
        },
        containers: fetchResult.containers || []
      };

      const result = await store.dispatch(
        dashboardApi.endpoints.saveDashboard.initiate(dashboardData)
      ).unwrap();

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Dashboard');

      const state = store.getState().dashboard;
      expect(state.id).toBe(result.id);
      expect(state.name).toBe('Updated Dashboard');
    });
  });
});
